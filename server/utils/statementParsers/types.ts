export type SupportedBank = 'bca' | 'blu'

// Deterministic statement facts, produced by the bank-specific parser only.
// AI is never involved in producing these — see parse.post.ts.
export type ParsedStatementTransaction = {
  date: string // 'YYYY-MM-DD', effective transaction date (prefers embedded
  // transaction date over posting date when the statement provides both)
  amount: number // always positive; `direction` carries the sign
  direction: 'debit' | 'credit'
  rawDescription: string
  merchant?: string
  reference?: string
  // Trivial 1:1 mapping from `direction` (debit -> expense, credit -> income).
  // Real classification (category, transfer detection) is the normalizer's
  // job (Phase 2), not the parser's.
  suggestedType: 'income' | 'expense'
  suggestedCategory?: string
  confidence: number // 0..1 — parser's confidence in the extraction itself
}

// A block of statement text that looked like it might be a transaction row
// but could not be parsed with confidence. Surfaced explicitly rather than
// silently dropped.
export type SkippedBlock = {
  rawText: string
  reason: string
}

export type ParseResult = {
  transactions: ParsedStatementTransaction[]
  skipped: SkippedBlock[]
}

export type StatementParser = {
  bank: SupportedBank
  parse: (text: string) => ParseResult
}
