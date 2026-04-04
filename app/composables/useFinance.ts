export const useFinance = () => {
  const client: any = useSupabaseClient()

  const transactions = ref<any[]>([])
  const loading = ref(false)

  const getUserId = async (): Promise<string | null> => {
    const { data: { user } } = await client.auth.getUser()
    return user?.id ?? null
  }

  const queryMonth = async (userId: string, year: number, month: number) => {
    const start = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    const { data, error } = await client
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  }

  const fetchMonthTransactions = async (year: number, month: number) => {
    const userId = await getUserId()
    if (!userId) return
    loading.value = true
    try {
      transactions.value = await queryMonth(userId, year, month)
    } catch (e) {
      console.error('Failed to fetch transactions:', e)
    } finally {
      loading.value = false
    }
  }

  // Returns data directly (for analytics, no shared state mutation)
  const fetchMonthData = async (year: number, month: number) => {
    const userId = await getUserId()
    if (!userId) return []
    try { return await queryMonth(userId, year, month) }
    catch (e) { console.error('Failed to fetch month data:', e); return [] }
  }

  const createTransaction = async (payload: {
    type: string; amount: number; category: string; note: string; date: string
  }) => {
    const userId = await getUserId()
    if (!userId) return null
    const { data, error } = await client
      .from('transactions')
      .insert({ ...payload, user_id: userId })
      .select()
      .single()
    if (error) { console.error('Failed to create transaction:', error); return null }
    return data
  }

  const updateTransaction = async (id: string, payload: Partial<{
    type: string; amount: number; category: string; note: string; date: string
  }>) => {
    const { data, error } = await client
      .from('transactions')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) { console.error('Failed to update transaction:', error); return null }
    return data
  }

  const deleteTransaction = async (id: string) => {
    const { error } = await client.from('transactions').delete().eq('id', id)
    if (error) console.error('Failed to delete transaction:', error)
  }

  const fetchYearTransactions = async (year: number) => {
    const userId = await getUserId()
    if (!userId) return []
    const { data, error } = await client
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('date', `${year}-01-01`)
      .lte('date', `${year}-12-31`)
      .order('date', { ascending: true })
    if (error) { console.error('Failed to fetch year transactions:', error); return [] }
    return data || []
  }

  return {
    transactions,
    loading,
    fetchMonthTransactions,
    fetchMonthData,
    fetchYearTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  }
}
