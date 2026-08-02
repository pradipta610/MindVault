import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { BluStatementParser } from './BluStatementParser'

const fixture = readFileSync(join(__dirname, '__fixtures__/blu-sample.txt'), 'utf-8')

describe('BluStatementParser', () => {
  const { transactions, skipped } = BluStatementParser.parse(fixture)

  it('parses every real transaction block and reports the unparseable one explicitly', () => {
    expect(transactions).toHaveLength(10)
    expect(skipped).toHaveLength(1)
    expect(skipped[0]!.reason).toMatch(/nominal/i)
    expect(skipped[0]!.rawText).toContain('Some Unknown Channel')
  })

  it('reconciles the running balance chain (previous + credit - debit = next) across every parsed row', () => {
    let balance = 500000 // Saldo Awal in the fixture
    for (const t of transactions) {
      balance = t.direction === 'credit' ? balance + t.amount : balance - t.amount
    }
    expect(balance).toBeCloseTo(919100, 2) // Saldo Akhir in the fixture
  })

  it('parses QRIS payment with a wrapped-free reference', () => {
    const t = transactions.find(t => t.rawDescription.includes('Pembayaran QRIS'))!
    expect(t).toBeDefined()
    expect(t.date).toBe('2026-07-01')
    expect(t.amount).toBe(25000)
    expect(t.direction).toBe('debit')
    expect(t.suggestedType).toBe('expense')
    expect(t.reference).toBe('abc123ref456')
    expect(t.merchant).toContain('Test Warung')
  })

  it('parses incoming transfer (Dana Masuk) with no reference ("- -" placeholder)', () => {
    const t = transactions.find(t => t.rawDescription.includes('Dana Masuk dari BUDI SANTOSO'))!
    expect(t).toBeDefined()
    expect(t.date).toBe('2026-07-02')
    expect(t.amount).toBe(1000000)
    expect(t.direction).toBe('credit')
    expect(t.reference).toBeUndefined()
  })

  it('parses outgoing bank transfer', () => {
    const t = transactions.find(t => t.rawDescription.includes('Transfer ke TEST RECIPIENT NAME'))!
    expect(t).toBeDefined()
    expect(t.date).toBe('2026-07-02')
    expect(t.amount).toBe(200000)
    expect(t.direction).toBe('debit')
    expect(t.merchant).toBe('TEST RECIPIENT NAME')
    expect(t.reference).toBe('1783154786884234')
  })

  it('parses outgoing transfer to bluSaving', () => {
    const t = transactions.find(t => t.rawDescription.includes('Transfer Dana ke bluSaving'))!
    expect(t).toBeDefined()
    expect(t.date).toBe('2026-07-03')
    expect(t.amount).toBe(300000)
    expect(t.direction).toBe('debit')
  })

  it('parses incoming transfer from bluSaving', () => {
    const t = transactions.find(t => t.rawDescription.includes('Dana Masuk dari bluSaving'))!
    expect(t).toBeDefined()
    expect(t.date).toBe('2026-07-04')
    expect(t.amount).toBe(100000)
    expect(t.direction).toBe('credit')
  })

  it('parses virtual-card debit transaction and extracts the merchant from the detail phrase', () => {
    const t = transactions.find(t => t.rawDescription.includes('Transaksi Debit di'))!
    expect(t).toBeDefined()
    expect(t.date).toBe('2026-07-05')
    expect(t.amount).toBe(50000)
    expect(t.direction).toBe('debit')
    expect(t.merchant).toBe('TEST MERCHANT SUB')
  })

  it('parses the transfer fee as its own separate transaction', () => {
    const t = transactions.find(t => t.rawDescription.includes('Biaya Transfer ke'))!
    expect(t).toBeDefined()
    expect(t.date).toBe('2026-07-06')
    expect(t.amount).toBe(6500)
    expect(t.direction).toBe('debit')
  })

  it('parses Nota Kredit / reward as credit', () => {
    const t = transactions.find(t => t.rawDescription.includes('bluDay Reward'))!
    expect(t).toBeDefined()
    expect(t.date).toBe('2026-07-07')
    expect(t.amount).toBe(500)
    expect(t.direction).toBe('credit')
  })

  it('parses interest (Bunga) as credit', () => {
    const t = transactions.find(t => t.rawDescription.includes('Bunga'))!
    expect(t).toBeDefined()
    expect(t.date).toBe('2026-07-08')
    expect(t.amount).toBe(100)
    expect(t.direction).toBe('credit')
  })

  // Regression: transactions.amount is a bigint column. blu prints interest
  // with sen ("Bunga 170,77"); an unrounded fractional amount fails the
  // entire bulk insert with "invalid input syntax for type bigint" — found
  // via a live end-to-end test against a real July statement.
  it('rounds fractional-sen amounts to whole Rupiah for the bigint amount column', () => {
    const text = [
      '01 Jul 2026',
      '03:16 bluAccount',
      'Bunga 170,77 22.208,81',
    ].join('\n')
    const { transactions: tx, skipped: sk } = BluStatementParser.parse(text)
    expect(sk).toHaveLength(0)
    expect(tx).toHaveLength(1)
    expect(tx[0]!.amount).toBe(171)
    expect(Number.isInteger(tx[0]!.amount)).toBe(true)
  })
})
