import { createHash } from 'node:crypto'

const normalizeDescription = (desc: string): string =>
  desc.trim().toUpperCase().replace(/\s+/g, ' ')

// Fingerprint used for exact-duplicate protection when the same
// statement (or an overlapping period) is imported more than once.
// Deliberately does not use amount alone — see project instructions.
export const computeDedupeHash = (input: {
  accountId: string
  date: string
  amount: number
  type: 'income' | 'expense'
  description: string
  referenceNumber?: string
}): string => {
  const parts = [
    input.accountId,
    input.date,
    String(input.amount),
    input.type,
    normalizeDescription(input.description),
    input.referenceNumber?.trim() || '',
  ]
  return createHash('sha256').update(parts.join('|')).digest('hex')
}

export const computeFileHash = (buffer: Buffer): string =>
  createHash('sha256').update(buffer).digest('hex')
