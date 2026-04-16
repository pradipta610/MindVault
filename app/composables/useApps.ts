export const useApps = () => {
  const client: any = useSupabaseClient()
  const apps = ref<any[]>([])
  const folders = ref<any[]>([])
  const loading = ref(false)

  const getUserId = async (): Promise<string | null> => {
    const { data: { user } } = await client.auth.getUser()
    return user?.id ?? null
  }

  // ── Apps CRUD ───────────────────────────────────────────────────────────

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

  const createApp = async (payload: { name: string; description?: string; html: string; project_id?: string | null; folder_id?: string | null }) => {
    const userId = await getUserId()
    if (!userId) throw new Error('Not authenticated')
    const insert: Record<string, any> = {
      user_id: userId,
      name: payload.name,
      description: payload.description || null,
      html: payload.html,
    }
    if (payload.project_id) insert.project_id = payload.project_id
    if (payload.folder_id) insert.folder_id = payload.folder_id
    const { data, error } = await client
      .from('apps')
      .insert(insert)
      .select()
      .single()
    if (error) {
      console.error('Failed to create app:', error)
      throw new Error('Failed to save app')
    }
    if (data) apps.value.unshift(data)
    return data
  }

  const updateApp = async (id: string, payload: { name?: string; description?: string; html?: string; project_id?: string | null; folder_id?: string | null }) => {
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

  // ── Folders CRUD ────────────────────────────────────────────────────────

  const fetchFolders = async () => {
    const userId = await getUserId()
    if (!userId) return
    const { data, error } = await client
      .from('app_folders')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true })
    if (error) { console.error('Failed to fetch app folders:', error); return }
    folders.value = data || []
  }

  const createFolder = async (name: string, parentId?: string | null) => {
    const userId = await getUserId()
    if (!userId) return null
    const maxOrder = folders.value.reduce((max: number, f: any) => Math.max(max, f.sort_order ?? 0), 0)
    const insert: Record<string, any> = { user_id: userId, name, sort_order: maxOrder + 1 }
    if (parentId) insert.parent_id = parentId
    const { data, error } = await client
      .from('app_folders')
      .insert(insert)
      .select()
      .single()
    if (error) { console.error('Failed to create folder:', error); return null }
    if (data) folders.value.push(data)
    return data
  }

  const updateFolder = async (id: string, payload: { name?: string; parent_id?: string | null }) => {
    const { data, error } = await client
      .from('app_folders')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) { console.error('Failed to update folder:', error); return null }
    if (data) {
      const idx = folders.value.findIndex((f: any) => f.id === id)
      if (idx !== -1) folders.value[idx] = data
    }
    return data
  }

  const renameFolder = async (id: string, name: string) => {
    const { data, error } = await client
      .from('app_folders')
      .update({ name })
      .eq('id', id)
      .select()
      .single()
    if (error) { console.error('Failed to rename folder:', error); return null }
    if (data) {
      const idx = folders.value.findIndex((f: any) => f.id === id)
      if (idx !== -1) folders.value[idx] = data
    }
    return data
  }

  const deleteFolder = async (id: string) => {
    const { error } = await client.from('app_folders').delete().eq('id', id)
    if (error) { console.error('Failed to delete folder:', error); return }
    folders.value = folders.value.filter((f: any) => f.id !== id)
    // Apps in this folder get folder_id set to null by ON DELETE SET NULL
    apps.value = apps.value.map((a: any) => a.folder_id === id ? { ...a, folder_id: null } : a)
  }

  // ── Usage Logs ─────────────────────────────────────────────────────────

  const recentApps = ref<any[]>([])

  const fetchRecentApps = async () => {
    const userId = await getUserId()
    if (!userId) return
    // Get the last 8 distinct app_ids ordered by most recent open
    const { data, error } = await client
      .from('app_usage_logs')
      .select('app_id, opened_at')
      .eq('user_id', userId)
      .order('opened_at', { ascending: false })
      .limit(50)
    if (error) { console.error('Failed to fetch recent apps:', error); return }
    // Deduplicate: keep first occurrence (most recent) per app_id
    const seen = new Set<string>()
    const uniqueIds: string[] = []
    for (const row of (data || [])) {
      if (!seen.has(row.app_id)) {
        seen.add(row.app_id)
        uniqueIds.push(row.app_id)
        if (uniqueIds.length >= 8) break
      }
    }
    if (uniqueIds.length === 0) { recentApps.value = []; return }
    // Fetch app details
    const { data: appData, error: appErr } = await client
      .from('apps')
      .select('*')
      .in('id', uniqueIds)
    if (appErr) { console.error('Failed to fetch recent app details:', appErr); return }
    // Sort by the order in uniqueIds
    const appMap = new Map((appData || []).map((a: any) => [a.id, a]))
    recentApps.value = uniqueIds.map(id => appMap.get(id)).filter(Boolean)
  }

  const logAppOpen = async (appId: string) => {
    const userId = await getUserId()
    if (!userId) return
    await client.from('app_usage_logs').insert({ user_id: userId, app_id: appId })
    // Optimistically move to front of recent
    const existing = recentApps.value.find((a: any) => a.id === appId)
    if (existing) {
      recentApps.value = [existing, ...recentApps.value.filter((a: any) => a.id !== appId)].slice(0, 8)
    } else {
      const app = apps.value.find((a: any) => a.id === appId)
      if (app) recentApps.value = [app, ...recentApps.value].slice(0, 8)
    }
  }

  const removeFromRecent = async (appId: string) => {
    const userId = await getUserId()
    if (!userId) return
    await client.from('app_usage_logs').delete().eq('user_id', userId).eq('app_id', appId)
    recentApps.value = recentApps.value.filter((a: any) => a.id !== appId)
  }

  // ── Share Token ─────────────────────────────────────────────────────────

  const generateToken = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let token = ''
    const arr = new Uint8Array(24)
    crypto.getRandomValues(arr)
    for (const byte of arr) token += chars[byte % chars.length]
    return token
  }

  const createShareLink = async (appId: string): Promise<string | null> => {
    const token = generateToken()
    const { data, error } = await client
      .from('apps')
      .update({ share_token: token })
      .eq('id', appId)
      .select()
      .single()
    if (error) { console.error('Failed to create share link:', error); return null }
    if (data) {
      const idx = apps.value.findIndex((a: any) => a.id === appId)
      if (idx !== -1) apps.value[idx] = data
    }
    return token
  }

  const revokeShareLink = async (appId: string) => {
    const { data, error } = await client
      .from('apps')
      .update({ share_token: null })
      .eq('id', appId)
      .select()
      .single()
    if (error) { console.error('Failed to revoke share link:', error); return }
    if (data) {
      const idx = apps.value.findIndex((a: any) => a.id === appId)
      if (idx !== -1) apps.value[idx] = data
    }
  }

  const fetchSharedApp = async (token: string) => {
    const { data, error } = await client
      .from('apps')
      .select('name, description, html')
      .eq('share_token', token)
      .single()
    if (error) return null
    return data
  }

  return {
    apps, folders, loading,
    fetchApps, createApp, updateApp, deleteApp,
    fetchFolders, createFolder, updateFolder, renameFolder, deleteFolder,
    createShareLink, revokeShareLink, fetchSharedApp,
    recentApps, fetchRecentApps, logAppOpen, removeFromRecent,
  }
}
