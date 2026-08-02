import { isBcaMoney, parseBcaMoney } from './money'
import type { ParsedStatementTransaction, ParseResult, SkippedBlock, StatementParser } from './types'

// BCA e-Statement (KlikBCA "Laporan Mutasi Rekening" PDF), as extracted by
// unpdf/pdf.js. This layout is irregular by nature (see comments below) —
// every rule here was derived by inspecting a real July 2026 statement, not
// guessed. If a future statement breaks these assumptions, the offending
// block is reported in `skipped` rather than silently mis-parsed.
//
// Observed block shapes (one block = all lines between one 'DD/MM' line and
// the next):
//  - single line:      "01/07 TRSF E-BANKING CR 0107/PYBCA/WS95051 6,912,500.00 6,934,198.14"
//  - multi-line debit:  "02/07 BI-FAST DB BIF TRANSFER KE" / "002" / "KETUT PRADIPTA WIS" / "MyBCA" / "1,000,000.00 DB"
//  - QRIS:               "02/07 TRANSAKSI DEBIT TGL: 02/07" / "QR 008" / "00000.00Saint Loui" / "38,000.00 DB 2,378,698.14"
//  - posting date != transaction date: an extra "TANGGAL :DD/MM" line overrides the date.
// The trailing amount (optionally "DB", optionally a balance) can appear
// either at the end of the first line (single-line transactions) or as the
// block's own last line (multi-line transactions) — both are handled by
// scanning tokens from the end of the whole block, not per physical line.

const MONTHS_ID: Record<string, number> = {
  JANUARI: 1, FEBRUARI: 2, MARET: 3, APRIL: 4, MEI: 5, JUNI: 6,
  JULI: 7, AGUSTUS: 8, SEPTEMBER: 9, OKTOBER: 10, NOVEMBER: 11, DESEMBER: 12,
}

const pad2 = (n: number) => String(n).padStart(2, '0')
const toIso = (year: number, month: number, day: number) => `${year}-${pad2(month)}-${pad2(day)}`

// Resolves the year for a 'DD/MM' date embedded in the statement body,
// handling the (rare) case where it falls just outside the statement month
// due to processing lag across a month/year boundary.
function resolveYear(month: number, statementYear: number, statementMonth: number): number {
  if (month === statementMonth) return statementYear
  const prevMonth = statementMonth === 1 ? 12 : statementMonth - 1
  if (month === prevMonth) return statementMonth === 1 ? statementYear - 1 : statementYear
  const nextMonth = statementMonth === 12 ? 1 : statementMonth + 1
  if (month === nextMonth) return statementMonth === 12 ? statementYear + 1 : statementYear
  return statementYear
}

function extractPeriod(rawText: string): { year: number; month: number } {
  const m = rawText.match(/PERIODE\s*:\s*([A-Z]+)\s+(\d{4})/i)
  if (!m) throw new Error('Tidak dapat menemukan periode pada statement BCA')
  const month = MONTHS_ID[m[1]!.toUpperCase()]
  if (!month) throw new Error(`Nama bulan tidak dikenali pada statement BCA: ${m[1]}`)
  return { year: Number(m[2]), month }
}

type RawBlock = { postingDate: string; firstRemainder: string; extraLines: string[] }

type BcaSummary = {
  openingBalance?: number
  closingBalance?: number
  mutasiCrTotal?: number
  mutasiCrCount?: number
  mutasiDbTotal?: number
  mutasiDbCount?: number
}

const HEADER_END_RE = /^TANGGAL KETERANGAN CBG MUTASI SALDO$/
const PAGE_NUM_RE = /^\d+\s*\/\s*\d+$/
const CONTINUATION_RE = /^Bersambung ke halaman berikut$/
const DATE_START_RE = /^(\d{2})\/(\d{2})\s*(.*)$/

// Strips the repeated per-page header/footer and the closing MUTASI
// summary, reconstructing the remaining lines into per-transaction blocks.
function extractBodyAndSummary(rawText: string): { blocks: RawBlock[]; summary: BcaSummary } {
  const lines = rawText.split('\n').map(l => l.trim())
  const summary: BcaSummary = {}
  const blocks: RawBlock[] = []
  let current: RawBlock | null = null
  let inHeader = true
  let i = 0

  while (i < lines.length) {
    const line = lines[i]!
    if (line.length === 0) { i++; continue }

    if (inHeader) {
      if (HEADER_END_RE.test(line) && PAGE_NUM_RE.test(lines[i + 1] || '')) {
        i += 2
        inHeader = false
        continue
      }
      i++
      continue
    }

    if (CONTINUATION_RE.test(line)) { inHeader = true; i++; continue }

    const openM = line.match(/^SALDO AWAL\s*:\s*([\d,]+\.\d{2})$/)
    if (openM) { summary.openingBalance = parseBcaMoney(openM[1]!); i++; continue }
    const crM = line.match(/^MUTASI CR\s*:\s*([\d,]+\.\d{2})\s+(\d+)$/)
    if (crM) { summary.mutasiCrTotal = parseBcaMoney(crM[1]!); summary.mutasiCrCount = Number(crM[2]); i++; continue }
    const dbM = line.match(/^MUTASI DB\s*:\s*([\d,]+\.\d{2})\s+(\d+)$/)
    if (dbM) { summary.mutasiDbTotal = parseBcaMoney(dbM[1]!); summary.mutasiDbCount = Number(dbM[2]); i++; continue }
    const closeM = line.match(/^SALDO AKHIR\s*:\s*([\d,]+\.\d{2})$/)
    if (closeM) { summary.closingBalance = parseBcaMoney(closeM[1]!); i++; continue }

    const dateM = line.match(DATE_START_RE)
    if (dateM) {
      current = { postingDate: `${dateM[1]}/${dateM[2]}`, firstRemainder: dateM[3] || '', extraLines: [] }
      blocks.push(current)
      i++
      continue
    }

    if (current) current.extraLines.push(line)
    i++
  }

  return { blocks, summary }
}

// Scans tokens from the end of a block for [amount] [DB]? [balance]?,
// handling both orderings BCA prints: "amount DB balance", "amount DB",
// "amount balance" (credit rows have no DB marker), or just "amount".
function extractAmountTail(tokens: string[]): { amount: number; hasDB: boolean; balance?: number; consumed: number } | null {
  let end = tokens.length
  if (end === 0) return null

  let balance: number | undefined
  const last = tokens[end - 1]
  const secondLast = tokens[end - 2]
  const secondLastIsMoney = isBcaMoney(secondLast)
  const secondLastIsDB = secondLast?.toUpperCase() === 'DB'
  if (isBcaMoney(last) && (secondLastIsMoney || secondLastIsDB)) {
    balance = parseBcaMoney(last)
    end -= 1
  }

  let hasDB = false
  if (tokens[end - 1]?.toUpperCase() === 'DB') {
    hasDB = true
    end -= 1
  }

  if (!isBcaMoney(tokens[end - 1])) return null
  const amount = parseBcaMoney(tokens[end - 1]!)
  end -= 1

  return { amount, hasDB, balance, consumed: tokens.length - end }
}

const REFERENCE_RE = /\b\d{4}\/[A-Z]{3,6}\/[A-Z0-9]{5,10}\b/
const MERCHANT_CODE_RE = /\b\d{3,6}\/([A-Za-z][A-Za-z0-9 .'-]{1,30}?)(?=\s|$)/
const NON_NAME_LINES = new Set(['MyBCA', 'M-BCA', 'BIF TRANSFER KE', 'BIF BIAYA TXN KE', 'BIF TRANSFER DR', '-'])

function extractMerchantAndReference(descLines: string[], rawDescription: string): { merchant?: string; reference?: string } {
  const reference = rawDescription.match(REFERENCE_RE)?.[0]

  for (const line of descLines) {
    const m = line.match(/^\d+\.\d{2}(.+)$/)
    if (m && m[1]!.trim()) return { merchant: m[1]!.trim(), reference }
  }

  const merchCodeMatch = rawDescription.match(MERCHANT_CODE_RE)
  if (merchCodeMatch && merchCodeMatch[0] !== reference) {
    return { merchant: merchCodeMatch[1]!.trim(), reference }
  }

  // descLines[0] is always the fixed KETERANGAN phrase itself (e.g. "BI-FAST
  // DB BIF TRANSFER KE"), never the counterparty name — skip it so it can't
  // shadow the real name on a later line.
  const nameLine = descLines.slice(1).find(l =>
    !NON_NAME_LINES.has(l)
    && !/^\d+$/.test(l)
    && !/^TANGGAL/i.test(l)
    && /^[A-Za-z][A-Za-z .'-]+$/.test(l),
  )
  return { merchant: nameLine?.trim(), reference }
}

function parseBlock(block: RawBlock, statementYear: number, statementMonth: number): ParsedStatementTransaction | SkippedBlock {
  const rawBlockText = [`${block.postingDate} ${block.firstRemainder}`.trim(), ...block.extraLines].join('\n')
  const [ddStr, mmStr] = block.postingDate.split('/')
  const postingDay = Number(ddStr)
  const postingMonth = Number(mmStr)
  const postingDateIso = toIso(resolveYear(postingMonth, statementYear, statementMonth), postingMonth, postingDay)

  const allLines = [block.firstRemainder, ...block.extraLines].map(l => l.trim()).filter(l => l.length > 0)

  let effectiveDateIso = postingDateIso
  let overrideIdx = -1
  for (let i = 0; i < allLines.length; i++) {
    const m = allLines[i]!.match(/^TANGGAL\s*:(\d{2})\/(\d{2})$/)
    if (m) {
      const day = Number(m[1])
      const month = Number(m[2])
      effectiveDateIso = toIso(resolveYear(month, statementYear, statementMonth), month, day)
      overrideIdx = i
      break
    }
  }
  const descLines = allLines.filter((_, i) => i !== overrideIdx)

  const tokens = descLines.join(' ').split(/\s+/).filter(Boolean)
  const tail = extractAmountTail(tokens)
  if (!tail) {
    return { rawText: rawBlockText, reason: 'Tidak dapat menemukan nominal transaksi di akhir blok' }
  }

  const descTokens = tokens.slice(0, tokens.length - tail.consumed)
  const rawDescription = descTokens.join(' ').replace(/\s{2,}/g, ' ').trim()

  let direction: 'debit' | 'credit'
  if (tail.hasDB) {
    direction = 'debit'
  } else {
    const upper = rawDescription.toUpperCase()
    if (/\bCR\b/.test(upper) || upper.includes('KR OTOMATIS')) direction = 'credit'
    else return { rawText: rawBlockText, reason: 'Tidak dapat menentukan arah transaksi (tidak ada penanda DB atau CR)' }
  }

  if (tail.amount <= 0) {
    return { rawText: rawBlockText, reason: 'Nominal transaksi tidak valid (<= 0)' }
  }

  const { merchant, reference } = extractMerchantAndReference(descLines, rawDescription)

  return {
    date: effectiveDateIso,
    amount: tail.amount,
    direction,
    rawDescription: rawDescription || rawBlockText.replace(/\n/g, ' '),
    merchant,
    reference,
    suggestedType: direction === 'credit' ? 'income' : 'expense',
    confidence: 1,
  }
}

function isSkipped(result: ParsedStatementTransaction | SkippedBlock): result is SkippedBlock {
  return 'reason' in result
}

export const BCAStatementParser: StatementParser = {
  bank: 'bca',
  parse(rawText: string): ParseResult {
    const { year, month } = extractPeriod(rawText)
    const { blocks } = extractBodyAndSummary(rawText)

    const transactions: ParsedStatementTransaction[] = []
    const skipped: SkippedBlock[] = []

    for (const block of blocks) {
      // Opening balance row ("01/07 SALDO AWAL 21,698.14") is metadata, not a mutasi.
      if (/^SALDO AWAL\s+[\d,]+\.\d{2}$/.test(block.firstRemainder)) continue

      const result = parseBlock(block, year, month)
      if (isSkipped(result)) skipped.push(result)
      else transactions.push(result)
    }

    return { transactions, skipped }
  },
}
