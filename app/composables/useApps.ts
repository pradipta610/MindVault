export const useApps = () => {
  const client: any = useSupabaseClient()
  const apps = ref<any[]>([])
  const loading = ref(false)

  const getUserId = async (): Promise<string | null> => {
    const { data: { user } } = await client.auth.getUser()
    return user?.id ?? null
  }

  const fetchApps = async () => {
    const userId = await getUserId()
    if (!userId) return
    loading.value = true
    try {
      const { data, error } = await client
        .from('apps')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      apps.value = data || []
    } catch (e) {
      console.error('Failed to fetch apps:', e)
    } finally {
      loading.value = false
    }
  }

  const createApp = async (payload: { name: string; description?: string; html: string }) => {
    const userId = await getUserId()
    if (!userId) throw new Error('Not authenticated')
    const { data, error } = await client
      .from('apps')
      .insert({
        user_id: userId,
        name: payload.name,
        description: payload.description || null,
        html: payload.html,
      })
      .select()
      .single()
    if (error) {
      console.error('Failed to create app:', error)
      throw new Error('Failed to save app')
    }
    if (data) apps.value.unshift(data)
    return data
  }

  const updateApp = async (id: string, payload: { name?: string; description?: string; html?: string }) => {
    const updates: Record<string, any> = { ...payload, updated_at: new Date().toISOString() }
    const { data, error } = await client
      .from('apps')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) {
      console.error('Failed to update app:', error)
      throw new Error('Failed to update app')
    }
    if (data) {
      const idx = apps.value.findIndex((a: any) => a.id === id)
      if (idx !== -1) apps.value[idx] = data
    }
    return data
  }

  const deleteApp = async (id: string) => {
    const { error } = await client.from('apps').delete().eq('id', id)
    if (error) {
      console.error('Failed to delete app:', error)
      throw new Error('Failed to delete app')
    }
    apps.value = apps.value.filter((a: any) => a.id !== id)
  }

  return { apps, loading, fetchApps, createApp, updateApp, deleteApp }
}
