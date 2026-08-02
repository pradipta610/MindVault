import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { BCAStatementParser } from './BCAStatementParser'

const fixture = readFileSync(join(__dirname, '__fixtures__/bca-sample.txt'), 'utf-8')

describe('BCAStatementParser', () => {
  const { transactions, skipped } = BCAStatementParser.parse(fixture)

  it('parses every real mutasi row and reports the unparseable one explicitly', () => {
    expect(transactions).toHaveLength(10)
    expect(skipped).toHaveLength(1)
    expect(skipped[0]!.reason).toMatch(/nominal/i)
    expect(skipped[0]!.rawText).toContain('UNKNOWN TRANSACTION TYPE')
  })

  it('excludes SALDO AWAL from the transaction list', () => {
    expect(transactions.some(t => t.rawDescription.includes('SALDO AWAL'))).toBe(false)
  })

  it('reconciles debit/credit counts and totals against the statement footer (MUTASI CR: 3/680,000 — MUTASI DB: 7/452,500)', () => {
    const debits = transactions.filter(t => t.direction === 'debit')
    const credits = transactions.filter(t => t.direction === 'credit')
    expect(debits).toHaveLength(7)
    expect(credits).toHaveLength(3)
    expect(debits.reduce((s, t) => s + t.amount, 0)).toBe(452500)
    expect(credits.reduce((s, t) => s + t.amount, 0)).toBe(680000)
  })

  it('parses TRSF E-BANKING CR (single-line, amount+balance, no DB suffix)', () => {
    const t = transactions.find(t => t.rawDescription.startsWith('TRSF E-BANKING CR'))!
    expect(t).toBeDefined()
    expect(t.date).toBe('2026-07-01')
    expect(t.amount).toBe(500000)
    expect(t.direction).toBe('credit')
    expect(t.suggestedType).toBe('income')
    expect(t.reference).toBe('0107/PYBCA/WS12345')
  })

  it('parses TRSF E-BANKING DB (multi-line, recipient name, DB suffix)', () => {
    const t = transactions.find(t => t.rawDescription.startsWith('TRSF E-BANKING DB 0107'))!
    expect(t).toBeDefined()
    expect(t.date).toBe('2026-07-01')
    expect(t.amount).toBe(75000)
    expect(t.direction).toBe('debit')
    expect(t.merchant).toBe('BUDI SANTOSO TWO')
    expect(t.reference).toBe('0107/FTSCY/WS54321')
  })

  it('parses ATM withdrawal (TARIKAN ATM)', () => {
    const t = transactions.find(t => t.rawDescription.startsWith('TARIKAN ATM'))!
    expect(t).toBeDefined()
    expect(t.date).toBe('2026-07-02')
    expect(t.amount).toBe(100000)
    expect(t.direction).toBe('debit')
  })

  it('parses admin fee (BIAYA ADM)', () => {
    const t = transactions.find(t => t.rawDescription.startsWith('BIAYA ADM'))!
    expect(t).toBeDefined()
    expect(t.date).toBe('2026-07-02')
    expect(t.amount).toBe(10000)
    expect(t.direction).toBe('debit')
  })

  it('parses BI-FAST transfer debit and resolves the recipient name, not the KETERANGAN phrase', () => {
    const t = transactions.find(t => t.rawDescription === 'BI-FAST DB BIF TRANSFER KE 002 TEST RECIPIENT NAME MyBCA')!
    expect(t).toBeDefined()
    expect(t.date).toBe('2026-07-03')
    expect(t.amount).toBe(200000)
    expect(t.direction).toBe('debit')
    expect(t.merchant).toBe('TEST RECIPIENT NAME')
  })

  it('parses the BI-FAST transfer fee as its own separate transaction', () => {
    const t = transactions.find(t => t.rawDescription.startsWith('BI-FAST DB BIF BIAYA TXN KE'))!
    expect(t).toBeDefined()
    expect(t.date).toBe('2026-07-03')
    expect(t.amount).toBe(2500)
    expect(t.direction).toBe('debit')
  })

  it('parses QRIS payment (TRANSAKSI DEBIT) and extracts the merchant name', () => {
    const t = transactions.find(t => t.rawDescription.includes('TRANSAKSI DEBIT'))!
    expect(t).toBeDefined()
    expect(t.date).toBe('2026-07-03')
    expect(t.amount).toBe(25000)
    expect(t.direction).toBe('debit')
    expect(t.merchant).toBe('Test Merchant')
  })

  it('parses BI-FAST credit (no DB suffix, direction from CR keyword)', () => {
    const t = transactions.find(t => t.rawDescription.startsWith('BI-FAST CR BIF TRANSFER DR'))!
    expect(t).toBeDefined()
    expect(t.date).toBe('2026-07-04')
    expect(t.amount).toBe(150000)
    expect(t.direction).toBe('credit')
    expect(t.merchant).toBe('TEST SENDER NAME')
  })

  it('parses automatic credit (KR OTOMATIS, no DB/CR suffix on amount)', () => {
    const t = transactions.find(t => t.rawDescription.startsWith('KR OTOMATIS'))!
    expect(t).toBeDefined()
    expect(t.date).toBe('2026-07-04')
    expect(t.amount).toBe(30000)
    expect(t.direction).toBe('credit')
  })

  it('resolves the embedded transaction date (TANGGAL override) instead of the posting date', () => {
    const t = transactions.find(t => t.reference === '1234/FTFVA/WS99999')!
    expect(t).toBeDefined()
    // posting date printed on the row is 04/07, but TANGGAL :03/07 overrides it
    expect(t.date).toBe('2026-07-03')
    expect(t.amount).toBe(40000)
    expect(t.direction).toBe('debit')
    expect(t.merchant).toBe('TESTSHOP')
  })
})
