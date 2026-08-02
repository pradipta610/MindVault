// Orchestrates bank statement import: upload -> server-side parse ->
// duplicate detection against existing transactions -> commit.
// Commit reuses useFinance().createTransactionsBulk, which writes to the
// exact same `transactions` table/RLS as manual entries.

import type { ImportPreviewItem, SupportedBank } from '~/types/finance-import'

export const useBankStatementImport = () => {
  const client: any = useSupabaseClient()
  const { createTransactionsBulk } = useFinance()

  const parsing = ref(false)
  const importing = ref(false)
  const error = ref<string | null>(null)
  const previewItems = ref<ImportPreviewItem[]>([])
  const fileHash = ref<string | null>(null)
  const currentBank = ref<SupportedBank | null>(null)
  const currentAccountId = ref<string | null>(null)

  const getUserId = async (): Promise<string | null> => {
    const { data: { user } } = await client.auth.getUser()
    return user?.id ?? null
  }

  const alreadyImportedBatch = async (userId: string, hash: string) => {
    const { data } = await client
      .from('finance_import_batches')
      .select('id, created_at')
      .eq('user_id', userId)
      .eq('file_hash', hash)
      .maybeSingle()
    return data
  }

  // Flags: (a) exact re-import of a row already committed from a previous
  // statement, via dedupe_hash — excluded automatically, not a user choice.
  // (b) rows that look like they were already logged manually — NOT
  // auto-excluded, just flagged for the user to Skip / Import Anyway.
  const runDuplicateDetection = async (userId: string, items: ImportPreviewItem[]) => {
    if (items.length === 0) return items

    const hashes = items.map(i => i.dedupeHash)
    const dates = items.map(i => i.date).sort()
    const minDate = dates[0]!
    const maxDate = dates[dates.length - 1]!

    const [{ data: exactMatches }, { data: candidates }] = await Promise.all([
      client.from('transactions').select('dedupe_hash').eq('user_id', userId).in('dedupe_hash', hashes),
      client.from('transactions')
        .select('id, date, amount, type, category, note, source')
        .eq('user_id', userId)
        .is('dedupe_hash', null)
        .gte('date', shiftDate(minDate, -1))
        .lte('date', shiftDate(maxDate, 1)),
    ])

    const exactHashSet = new Set((exactMatches || []).map((r: any) => r.dedupe_hash))

    return items.map((item) => {
      if (exactHashSet.has(item.dedupeHash)) {
        return { ...item, duplicateStatus: 'exact_duplicate' as const, action: 'skip' as const, selected: false }
      }

      const match = (candidates || []).find((c: any) =>
        c.amount === item.amount
        && c.type === item.type
        && Math.abs(dayDiff(c.date, item.date)) <= 1,
      )
      if (match) {
        return {
          ...item,
          duplicateStatus: 'possible_existing' as const,
          possibleMatchTransactionId: match.id,
          action: 'skip' as const,
          selected: false,
        }
      }

      return item
    })
  }

  const uploadAndParse = async (file: File, bank: SupportedBank, accountId: string) => {
    error.value = null
    previewItems.value = []
    parsing.value = true
    currentBank.value = bank
    currentAccountId.value = accountId
    try {
      const userId = await getUserId()
      if (!userId) throw new Error('Not authenticated')

      const form = new FormData()
      form.append('file', file)
      form.append('bank', bank)
      form.append('accountId', accountId)

      const res: any = await $fetch('/api/finance/import/parse', { method: 'POST', body: form })

      const existingBatch = await alreadyImportedBatch(userId, res.fileHash)
      if (existingBatch) {
        throw new Error(`Statement ini sudah pernah diimport sebelumnya (${new Date(existingBatch.created_at).toLocaleDateString('id-ID')}).`)
      }

      fileHash.value = res.fileHash
      previewItems.value = await runDuplicateDetection(userId, res.transactions)
    } catch (e: any) {
      error.value = e?.data?.message || e?.message || 'Gagal memproses statement'
      throw e
    } finally {
      parsing.value = false
    }
  }

  const commitImport = async (periodLabel?: string) => {
    if (!currentBank.value || !currentAccountId.value || !fileHash.value) {
      throw new Error('Belum ada statement yang diparse')
    }
    importing.value = true
    try {
      const toImport = previewItems.value.filter(i => i.selected && i.action === 'import' && i.duplicateStatus !== 'exact_duplicate')

      const { data: batch, error: batchError } = await client
        .from('finance_import_batches')
        .insert({
          user_id: (await getUserId()),
          account_id: currentAccountId.value,
          bank: currentBank.value,
          file_hash: fileHash.value,
          period_label: periodLabel || null,
          transaction_count: previewItems.value.length,
          imported_count: toImport.length,
        })
        .select()
        .single()
      if (batchError) throw batchError

      const created = await createTransactionsBulk(toImport.map(i => ({
        type: i.type,
        amount: i.amount,
        category: i.category,
        note: i.rawDescription,
        date: i.date,
        source: 'import' as const,
        accountId: currentAccountId.value!,
        importBatchId: batch.id,
        dedupeHash: i.dedupeHash,
      })))

      return created
    } finally {
      importing.value = false
    }
  }

  const setItemCategory = (tempId: string, category: string) => {
    const item = previewItems.value.find(i => i.tempId === tempId)
    if (item) item.category = category
  }

  const setItemAction = (tempId: string, action: 'import' | 'skip') => {
    const item = previewItems.value.find(i => i.tempId === tempId)
    if (item) {
      item.action = action
      item.selected = action === 'import'
    }
  }

  const toggleItemSelected = (tempId: string) => {
    const item = previewItems.value.find(i => i.tempId === tempId)
    if (item && item.duplicateStatus !== 'exact_duplicate') item.selected = !item.selected
  }

  return {
    parsing,
    importing,
    error,
    previewItems,
    uploadAndParse,
    commitImport,
    setItemCategory,
    setItemAction,
    toggleItemSelected,
  }
}

// ── date helpers (local, no timezone lib needed for 'YYYY-MM-DD' strings) ──
function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]!
}

function dayDiff(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00').getTime()
  const db = new Date(b + 'T00:00:00').getTime()
  return Math.round((da - db) / 86400000)
}
