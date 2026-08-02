import { createHash } from 'node:crypto'

const normalizeDescription = (desc: string): string =>
  desc.trim().toUpperCase().replace(/\s+/g, ' ')

// Fingerprint used for exact-duplicate protection when the same
// statement (or an overlapping period) is imported more than once.
// Deliberately does not use amount alone — see project instructions.
//
// `occurrence` disambiguates legitimately repeated transactions within the
// same statement (e.g. two separate BI-FAST transfer fees to the same
// recipient on the same day, both "BIF BIAYA TXN KE ... Rp2.500" with no
// reference number) — without it those rows hash identically and the bulk
// insert fails outright on the unique (user_id, dedupe_hash) constraint.
// Callers must assign occurrence deterministically (1st, 2nd, ... match in
// parse order) so re-importing the same file reproduces the same hashes.
export const computeDedupeHash = (input: {
  accountId: string
  date: string
  amount: number
  type: 'income' | 'expense'
  description: string
  referenceNumber?: string
  occurrence: number
}): string => {
  const parts = [
    input.accountId,
    input.date,
    String(input.amount),
    input.type,
    normalizeDescription(input.description),
    input.referenceNumber?.trim() || '',
    String(input.occurrence),
  ]
  return createHash('sha256').update(parts.join('|')).digest('hex')
}

export const computeFileHash = (buffer: Buffer): string =>
  createHash('sha256').update(buffer).digest('hex')
