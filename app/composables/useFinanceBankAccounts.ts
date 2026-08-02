// Minimal bank account identity — used only to tag which rekening a
// statement/transaction came from. Deliberately NOT a wallet/balance
// system: no balance column, no running total, no net-worth math.

export type FinanceBankAccount = {
  id: string
  user_id: string
  bank: 'bca' | 'blu'
  account_name: string
  account_number_last4: string | null
  created_at: string
}

export const useFinanceBankAccounts = () => {
  const client: any = useSupabaseClient()
  const accounts = ref<FinanceBankAccount[]>([])
  const loading = ref(false)

  const getUserId = async (): Promise<string | null> => {
    const { data: { user } } = await client.auth.getUser()
    return user?.id ?? null
  }

  const fetchAccounts = async () => {
    const userId = await getUserId()
    if (!userId) return
    loading.value = true
    try {
      const { data, error } = await client
        .from('finance_bank_accounts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
      if (error) throw error
      accounts.value = data || []
    } catch (e) {
      console.error('Failed to fetch bank accounts:', e)
    } finally {
      loading.value = false
    }
  }

  const createAccount = async (payload: {
    bank: 'bca' | 'blu'; account_name: string; account_number_last4?: string
  }): Promise<FinanceBankAccount | null> => {
    const userId = await getUserId()
    if (!userId) return null
    const { data, error } = await client
      .from('finance_bank_accounts')
      .insert({
        user_id: userId,
        bank: payload.bank,
        account_name: payload.account_name.trim(),
        account_number_last4: payload.account_number_last4 || null,
      })
      .select()
      .single()
    if (error) { console.error('Failed to create bank account:', error); return null }
    accounts.value.push(data)
    return data
  }

  const deleteAccount = async (id: string) => {
    const { error } = await client.from('finance_bank_accounts').delete().eq('id', id)
    if (error) { console.error('Failed to delete bank account:', error); return }
    accounts.value = accounts.value.filter(a => a.id !== id)
  }

  return {
    accounts,
    loading,
    fetchAccounts,
    createAccount,
    deleteAccount,
  }
}
