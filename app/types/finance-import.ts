// Types shared between the bank statement import server routes and the
// client-side preview/import UI. The transaction model itself is the
// existing `transactions` table (see useFinance.ts) — these types only
// describe the import-specific pipeline (parser output -> preview -> commit).
// Mirrors server/utils/statementParsers/types.ts (kept separate: server
// code and app code resolve module aliases differently in Nuxt).

export type SupportedBank = 'bca' | 'blu'

export type DuplicateStatus =
  | 'none'
  | 'exact_duplicate' // dedupe_hash already exists for this user -> excluded, not user-choosable
  | 'possible_existing' // looks like a manual entry that may already cover this -> user picks skip/import

export type ImportPreviewItem = {
  // Stable id within this preview session only (not a DB id yet).
  tempId: string
  date: string
  amount: number
  type: 'income' | 'expense'
  rawDescription: string
  merchant?: string
  reference?: string
  confidence: number
  category: string
  dedupeHash: string
  duplicateStatus: DuplicateStatus
  possibleMatchTransactionId?: string // transactions.id of the suspected manual entry, when duplicateStatus = 'possible_existing'
  // User decision for 'possible_existing' items. Ignored for others.
  action: 'import' | 'skip'
  selected: boolean
}

export type SkippedBlock = {
  rawText: string
  reason: string
}
