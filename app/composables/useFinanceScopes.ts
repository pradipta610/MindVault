// Finance scopes: user-defined contexts like "Pribadi", "Keluarga", "Pacar".
// Module-level state so current selection persists across navigations.

export type FinanceScope = {
  id: string
  user_id: string
  name: string
  emoji: string
  color: string
  position: number
  spending_limit: number | null
  created_at: string
}

const STORAGE_KEY = 'mindvault_current_scope_id'

// Module-level singletons
const scopes = ref<FinanceScope[]>([])
const currentScopeId = ref<string | null>(null)
const loaded = ref(false)

export const useFinanceScopes = () => {
  const client: any = useSupabaseClient()

  const getUserId = async (): Promise<string | null> => {
    const { data: { user } } = await client.auth.getUser()
    return user?.id ?? null
  }

  const currentScope = computed<FinanceScope | null>(() => {
    if (!currentScopeId.value) return scopes.value[0] ?? null
    return scopes.value.find(s => s.id === currentScopeId.value) ?? scopes.value[0] ?? null
  })

  const persistCurrent = (id: string | null) => {
    if (import.meta.client) {
      if (id) localStorage.setItem(STORAGE_KEY, id)
      else localStorage.removeItem(STORAGE_KEY)
    }
  }

  const setCurrentScope = (id: string) => {
    currentScopeId.value = id
    persistCurrent(id)
  }

  const fetchScopes = async () => {
    const userId = await getUserId()
    if (!userId) return
    const { data, error } = await client
      .from('finance_scopes')
      .select('*')
      .eq('user_id', userId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) { console.error('fetchScopes error', error); return }
    scopes.value = data || []

    // If we have no scopes yet, create default "Pribadi"
    if (scopes.value.length === 0) {
      const defaultScope = await createScope({ name: 'Pribadi', emoji: '👤', color: '#f7ce28' })
      if (defaultScope) scopes.value = [defaultScope]
    }

    // Restore last-selected scope from localStorage
    if (import.meta.client) {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved && scopes.value.find(s => s.id === saved)) {
        currentScopeId.value = saved
      } else {
        currentScopeId.value = scopes.value[0]?.id ?? null
      }
    }

    loaded.value = true
  }

  const createScope = async (payload: {
    name: string; emoji?: string; color?: string
  }): Promise<FinanceScope | null> => {
    const userId = await getUserId()
    if (!userId) return null

    const maxPos = scopes.value.reduce((m, s) => Math.max(m, s.position), -1)

    const { data, error } = await client
      .from('finance_scopes')
      .insert({
        user_id: userId,
        name: payload.name.trim(),
        emoji: payload.emoji || '💰',
        color: payload.color || '#f7ce28',
        position: maxPos + 1,
      })
      .select()
      .single()

    if (error) { console.error('createScope error', error); return null }
    scopes.value.push(data)
    return data
  }

  const updateScope = async (id: string, payload: Partial<{
    name: string; emoji: string; color: string; spending_limit: number | null
  }>): Promise<FinanceScope | null> => {
    const clean: any = { ...payload }
    if (clean.name) clean.name = clean.name.trim()

    const { data, error } = await client
      .from('finance_scopes')
      .update(clean)
      .eq('id', id)
      .select()
      .single()

    if (error) { console.error('updateScope error', error); return null }
    const idx = scopes.value.findIndex(s => s.id === id)
    if (idx !== -1) scopes.value[idx] = data
    return data
  }

  const deleteScope = async (id: string): Promise<boolean> => {
    if (scopes.value.length <= 1) {
      console.warn('Cannot delete last scope')
      return false
    }
    const { error } = await client.from('finance_scopes').delete().eq('id', id)
    if (error) { console.error('deleteScope error', error); return false }
    scopes.value = scopes.value.filter(s => s.id !== id)

    // If current was deleted, fallback to first
    if (currentScopeId.value === id) {
      const nextId = scopes.value[0]?.id ?? null
      currentScopeId.value = nextId
      persistCurrent(nextId)
    }
    return true
  }

  return {
    scopes,
    currentScope,
    currentScopeId,
    loaded,
    fetchScopes,
    createScope,
    updateScope,
    deleteScope,
    setCurrentScope,
  }
}
