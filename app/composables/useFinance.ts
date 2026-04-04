export const useFinance = () => {
  const client: any = useSupabaseClient()

  const transactions = ref<any[]>([])
  const loading = ref(false)

  const getUserId = async (): Promise<string | null> => {
    const { data: { user } } = await client.auth.getUser()
    return user?.id ?? null
  }

  const fetchMonthTransactions = async (year: number, month: number) => {
    const userId = await getUserId()
    if (!userId) return
    loading.value = true
    const start = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    try {
      const { data, error } = await client
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
      if (error) throw error
      transactions.value = data || []
    } catch (e) {
      console.error('Failed to fetch transactions:', e)
    } finally {
      loading.value = false
    }
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

  return {
    transactions,
    loading,
    fetchMonthTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  }
}
