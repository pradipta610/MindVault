import { getDocumentProxy, extractText } from 'unpdf'
import { getStatementParser } from '../../../utils/statementParsers'
import { computeDedupeHash, computeFileHash } from '../../../utils/dedupeHash'
import type { SupportedBank } from '../../../utils/statementParsers/types'

const SUPPORTED_BANKS: SupportedBank[] = ['bca', 'blu']

// Bank statements contain sensitive financial data. The uploaded PDF is
// only ever held in memory for the duration of this request — it is
// never written to disk, never sent to storage, and never logged.
export default defineEventHandler(async (event) => {
  const parts = await readMultipartFormData(event)
  if (!parts || parts.length === 0) {
    throw createError({ statusCode: 400, message: 'File statement diperlukan' })
  }

  const filePart = parts.find(p => p.name === 'file' && p.data)
  const bank = parts.find(p => p.name === 'bank')?.data?.toString('utf-8') as SupportedBank | undefined
  const accountId = parts.find(p => p.name === 'accountId')?.data?.toString('utf-8')

  if (!filePart) throw createError({ statusCode: 400, message: 'File statement diperlukan' })
  if (!bank || !SUPPORTED_BANKS.includes(bank)) {
    throw createError({ statusCode: 400, message: 'Bank tidak didukung' })
  }
  if (!accountId) throw createError({ statusCode: 400, message: 'accountId diperlukan' })

  const parser = getStatementParser(bank)

  let text: string
  try {
    const pdf = await getDocumentProxy(new Uint8Array(filePart.data))
    const result = await extractText(pdf, { mergePages: true })
    text = result.text
  } catch (e: any) {
    // Do not log the underlying error verbatim — it may echo PDF content.
    throw createError({
      statusCode: 422,
      message: 'Gagal membaca PDF. Pastikan file adalah e-Statement asli dan tidak rusak.',
    })
  }

  let parsed: ReturnType<typeof parser.parse>
  try {
    parsed = parser.parse(text)
  } catch (e: any) {
    throw createError({
      statusCode: 422,
      message: e?.message || 'Gagal memparse statement. Pastikan format sesuai dengan bank yang dipilih.',
    })
  }

  const transactions = parsed.transactions.map((t, i) => {
    const type = t.suggestedType
    return {
      tempId: `${i}`,
      date: t.date,
      amount: t.amount,
      type,
      rawDescription: t.rawDescription,
      merchant: t.merchant,
      reference: t.reference,
      confidence: t.confidence,
      category: 'lainnya',
      dedupeHash: computeDedupeHash({
        accountId,
        date: t.date,
        amount: t.amount,
        type,
        description: t.rawDescription,
        referenceNumber: t.reference,
      }),
      duplicateStatus: 'none' as const,
      action: 'import' as const,
      selected: true,
    }
  })

  return {
    fileHash: computeFileHash(filePart.data),
    transactionCount: transactions.length,
    transactions,
    skipped: parsed.skipped,
  }
})
