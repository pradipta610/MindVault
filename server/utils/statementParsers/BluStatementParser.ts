import { isBluMoney, parseBluMoney } from './money'
import type { ParsedStatementTransaction, ParseResult, SkippedBlock, StatementParser } from './types'

// blu by BCA Digital e-Statement, as extracted by unpdf/pdf.js. More
// structured than BCA's, but still needs real handling for: multi-line
// source/reference wrapping, the "-" debit marker sitting *before* the
// amount (opposite position from BCA's trailing "DB"), and per-page
// boilerplate. Every rule below was derived from a real July 2026 sample.
//
// Block shape (one block = all lines between one 'DD Mon YYYY' line and the
// next):
//   DD Mon YYYY
//   HH:MM <source>[ | <reference>]
//   [<reference continuation, when source line ends with "|">]
//   <detail phrase> [-] <amount>,<balance>
//
// Amount format is dot-thousands/comma-decimal (e.g. "2.200.000,00"),
// opposite of BCA's comma-thousands/dot-decimal.

const MONTHS_EN: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
}

const pad2 = (n: number) => String(n).padStart(2, '0')
const toIso = (year: number, month: number, day: number) => `${year}-${pad2(month)}-${pad2(day)}`

const FOOTER_LINES = new Set([
  'BCA Digital berizin dan diawasi oleh Otoritas Jasa Keuangan & Bank Indonesia • BCA Digital merupakan peserta penjaminan LPS',
  'BCA Digital is licensed & supervised by Financial Services Authority (OJK) & Bank Indonesia •',
  'BCA Digital is a member of Indonesia Deposit Insurance Corporation (Lembaga Penjamin Simpanan)',
  'blubybcadigital.id • haloblu 1500668',
])
const PAGE_HEADER_RE = /^Halaman \d+ dari \d+ \/ Page \d+ of \d+$/
const DATE_LINE_RE = /^(\d{2}) ([A-Za-z]{3}) (\d{4})$/
// Unambiguous marker of the closing summary block (Total Pemasukan/Total
// Income only ever appears once, right after the last real transaction).
const CLOSING_SENTINEL = 'Total Pemasukan / Total Income'

// Strips page 1's account summary/column headers, the repeated
// "bluAccount / Halaman N dari M" page header, the fixed legal footer, and
// the closing summary+disclaimer block.
function extractBodyLines(rawText: string): string[] {
  const lines = rawText.split('\n').map(l => l.trim())
  const body: string[] = []
  let seenFirstDate = false
  let i = 0

  while (i < lines.length) {
    const line = lines[i]!
    if (line.length === 0) { i++; continue }

    if (!seenFirstDate) {
      // "Total Pemasukan / Total Income" etc. also appear in page 1's
      // summary preamble, before any real transaction — only treat them as
      // the closing sentinel once we're past that preamble.
      if (DATE_LINE_RE.test(line)) { seenFirstDate = true; body.push(line); i++; continue }
      i++; continue // page-1 preamble: labels, summary figures, column headers, account label
    }

    if (line === CLOSING_SENTINEL) break
    if (FOOTER_LINES.has(line)) { i++; continue }
    if (line === 'bluAccount' && PAGE_HEADER_RE.test(lines[i + 1] || '')) { i += 2; continue }

    body.push(line)
    i++
  }

  return body
}

type RawBlock = { dateLine: string; lines: string[] }

function splitIntoBlocks(bodyLines: string[]): RawBlock[] {
  const blocks: RawBlock[] = []
  let current: RawBlock | null = null
  for (const line of bodyLines) {
    if (DATE_LINE_RE.test(line)) {
      current = { dateLine: line, lines: [] }
      blocks.push(current)
    } else if (current) {
      current.lines.push(line)
    }
  }
  return blocks
}

function extractAmountTail(tokens: string[]): { amount: number; isDebit: boolean; balance?: number; consumed: number } | null {
  let end = tokens.length
  if (end === 0) return null

  let balance: number | undefined
  if (isBluMoney(tokens[end - 1]) && isBluMoney(tokens[end - 2])) {
    balance = parseBluMoney(tokens[end - 1]!)
    end -= 1
  }

  if (!isBluMoney(tokens[end - 1])) return null
  const amount = parseBluMoney(tokens[end - 1]!)
  end -= 1

  let isDebit = false
  if (tokens[end - 1] === '-') {
    isDebit = true
    end -= 1
  }

  return { amount, isDebit, balance, consumed: tokens.length - end }
}

const MERCHANT_PATTERNS: RegExp[] = [
  /^Transfer ke (.+)$/i,
  /^Dana Masuk dari (.+)$/i,
  /^Biaya Transfer ke (.+)$/i,
  /^Transaksi Debit di (.+)$/i,
]

function parseBlock(block: RawBlock): ParsedStatementTransaction | SkippedBlock {
  const rawBlockText = [block.dateLine, ...block.lines].join('\n')

  const dateM = block.dateLine.match(DATE_LINE_RE)!
  const day = Number(dateM[1])
  const month = MONTHS_EN[dateM[2]!.toLowerCase()]
  const year = Number(dateM[3])
  if (!month) return { rawText: rawBlockText, reason: `Nama bulan tidak dikenali: ${dateM[2]}` }
  const dateIso = toIso(year, month, day)

  if (block.lines.length === 0) {
    return { rawText: rawBlockText, reason: 'Blok tanggal tidak memiliki baris transaksi' }
  }

  const timeM = block.lines[0]!.match(/^(\d{2}):(\d{2})\s+(.*)$/)
  const sourceRaw = timeM ? timeM[3]! : block.lines[0]!
  const restLines = block.lines.slice(1)

  let source: string
  let reference: string | undefined
  let detailLines = restLines

  const trimmedSource = sourceRaw.trim()
  if (trimmedSource.endsWith('|')) {
    source = trimmedSource.slice(0, -1).trim()
    reference = restLines[0]?.trim()
    detailLines = restLines.slice(1)
  } else if (trimmedSource.includes('|')) {
    const pipeIdx = trimmedSource.indexOf('|')
    source = trimmedSource.slice(0, pipeIdx).trim()
    const afterPipe = trimmedSource.slice(pipeIdx + 1).trim()
    reference = afterPipe || undefined
  } else {
    source = trimmedSource.replace(/\s*-\s*-\s*$/, '').replace(/\s*-\s*$/, '').trim()
  }

  const detailTokens = detailLines.join(' ').split(/\s+/).filter(Boolean)
  const tail = extractAmountTail(detailTokens)
  if (!tail) {
    return { rawText: rawBlockText, reason: 'Tidak dapat menemukan nominal transaksi di akhir blok' }
  }
  if (tail.amount <= 0) {
    return { rawText: rawBlockText, reason: 'Nominal transaksi tidak valid (<= 0)' }
  }

  const detailPhrase = detailTokens.slice(0, detailTokens.length - tail.consumed).join(' ').trim()
  const direction: 'debit' | 'credit' = tail.isDebit ? 'debit' : 'credit'

  let merchant: string | undefined
  for (const re of MERCHANT_PATTERNS) {
    const m = detailPhrase.match(re)
    if (m) { merchant = m[1]!.trim(); break }
  }
  if (!merchant) merchant = source || undefined

  const rawDescription = [source, detailPhrase].filter(Boolean).join(' — ') || rawBlockText.replace(/\n/g, ' ')

  return {
    date: dateIso,
    amount: tail.amount,
    direction,
    rawDescription,
    merchant,
    reference,
    suggestedType: direction === 'credit' ? 'income' : 'expense',
    confidence: 1,
  }
}

function isSkipped(result: ParsedStatementTransaction | SkippedBlock): result is SkippedBlock {
  return 'reason' in result
}

export const BluStatementParser: StatementParser = {
  bank: 'blu',
  parse(rawText: string): ParseResult {
    const body = extractBodyLines(rawText)
    const blocks = splitIntoBlocks(body)

    const transactions: ParsedStatementTransaction[] = []
    const skipped: SkippedBlock[] = []

    for (const block of blocks) {
      const result = parseBlock(block)
      if (isSkipped(result)) skipped.push(result)
      else transactions.push(result)
    }

    return { transactions, skipped }
  },
}
