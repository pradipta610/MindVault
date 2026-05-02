// Module-level singletons — persist across page navigations
const _links = ref<any[]>([])
const _linkFolders = ref<any[]>([])
const _loading = ref(false)
const _lastFetched = ref(0)
const _ownerId = ref<string | null>(null)
const STALE_MS = 60_000

export const useLinks = () => {
  const client: any = useSupabaseClient()

  const getUserId = async (): Promise<string | null> => {
    const { data: { user } } = await client.auth.getUser()
    return user?.id ?? null
  }

  // ── Links CRUD ────────────────────────────────────────────────────────

  const fetchLinks = async () => {
    const fresh = _lastFetched.value > 0 && Date.now() - _lastFetched.value < STALE_MS
    if (fresh) return

    if (_lastFetched.value === 0) _loading.value = true

    const userId = await getUserId()
    if (!userId) { _loading.value = false; return }

    if (_ownerId.value && _ownerId.value !== userId) {
      _links.value = []; _linkFolders.value = []; _lastFetched.value = 0
    }
    _ownerId.value = userId

    try {
      const [linksRes, foldersRes] = await Promise.all([
        client
          .from('links')
          .select('id, user_id, url, title, description, image, favicon, project_id, folder_id, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
        client
          .from('link_folders')
          .select('id, user_id, name, sort_order, parent_id, created_at')
          .eq('user_id', userId)
          .order('sort_order', { ascending: true }),
      ])
      if (linksRes.error) throw linksRes.error
      _links.value = linksRes.data || []
      if (!foldersRes.error) _linkFolders.value = foldersRes.data || []
      _lastFetched.value = Date.now()
    } catch (e) {
      console.error('Failed to fetch links:', e)
    } finally {
      _loading.value = false
    }
  }

  const fetchMetadata = async (url: string) => {
    try {
      const res = await fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}`)
      const json = await res.json()
      if (json.status === 'success' && json.data) {
        return {
          title: json.data.title || null,
          description: json.data.description || null,
          image: json.data.image?.url || null,
          favicon: json.data.logo?.url || null,
        }
      }
    } catch (e) {
      console.error('Failed to fetch link metadata:', e)
    }
    return { title: null, description: null, image: null, favicon: null }
  }

  const addLink = async (url: string, projectId?: string | null, folderId?: string | null) => {
    const userId = await getUserId()
    if (!userId) throw new Error('Not authenticated')

    const meta = await fetchMetadata(url)

    const insert: Record<string, any> = {
      user_id: userId,
      url,
      title: meta.title,
      description: meta.description,
      image: meta.image,
      favicon: meta.favicon,
    }
    if (projectId) insert.project_id = projectId
    if (folderId) insert.folder_id = folderId

    const { data, error } = await client
      .from('links')
      .insert(insert)
      .select()
      .single()

    if (error) {
      console.error('Failed to add link:', error)
      throw new Error('Failed to save link')
    }
    if (data) _links.value.unshift(data)
    return data
  }

  const updateLink = async (id: string, payload: { folder_id?: string | null }) => {
    const { data, error } = await client
      .from('links')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) {
      console.error('Failed to update link:', error)
      throw new Error('Failed to update link')
    }
    if (data) {
      const idx = _links.value.findIndex((l: any) => l.id === id)
      if (idx !== -1) _links.value[idx] = data
    }
    return data
  }

  const deleteLink = async (id: string) => {
    const { error } = await client.from('links').delete().eq('id', id)
    if (error) {
      console.error('Failed to delete link:', error)
      throw new Error('Failed to delete link')
    }
    _links.value = _links.value.filter((l: any) => l.id !== id)
  }

  const refreshMetadata = async (id: string) => {
    const link = _links.value.find((l: any) => l.id === id)
    if (!link) return null
    const meta = await fetchMetadata(link.url)
    const { data, error } = await client
      .from('links')
      .update(meta)
      .eq('id', id)
      .select()
      .single()
    if (error) {
      console.error('Failed to refresh metadata:', error)
      return null
    }
    if (data) {
      const idx = _links.value.findIndex((l: any) => l.id === id)
      if (idx !== -1) _links.value[idx] = data
    }
    return data
  }

  // ── Folders CRUD ──────────────────────────────────────────────────────

  const fetchLinkFolders = async () => { /* merged into fetchLinks */ }

  const createLinkFolder = async (name: string, parentId?: string | null) => {
    const userId = await getUserId()
    if (!userId) return null
    const maxOrder = _linkFolders.value.reduce((max: number, f: any) => Math.max(max, f.sort_order ?? 0), 0)
    const insert: Record<string, any> = { user_id: userId, name, sort_order: maxOrder + 1 }
    if (parentId) insert.parent_id = parentId
    const { data, error } = await client
      .from('link_folders')
      .insert(insert)
      .select()
      .single()
    if (error) { console.error('Failed to create link folder:', error); return null }
    if (data) _linkFolders.value.push(data)
    return data
  }

  const updateLinkFolder = async (id: string, payload: { name?: string; parent_id?: string | null }) => {
    const { data, error } = await client
      .from('link_folders')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) { console.error('Failed to update link folder:', error); return null }
    if (data) {
      const idx = _linkFolders.value.findIndex((f: any) => f.id === id)
      if (idx !== -1) _linkFolders.value[idx] = data
    }
    return data
  }

  const renameLinkFolder = async (id: string, name: string) => {
    const { data, error } = await client
      .from('link_folders')
      .update({ name })
      .eq('id', id)
      .select()
      .single()
    if (error) { console.error('Failed to rename link folder:', error); return null }
    if (data) {
      const idx = _linkFolders.value.findIndex((f: any) => f.id === id)
      if (idx !== -1) _linkFolders.value[idx] = data
    }
    return data
  }

  const deleteLinkFolder = async (id: string) => {
    const { error } = await client.from('link_folders').delete().eq('id', id)
    if (error) { console.error('Failed to delete link folder:', error); return }
    _linkFolders.value = _linkFolders.value.filter((f: any) => f.id !== id)
    _links.value = _links.value.map((l: any) => l.folder_id === id ? { ...l, folder_id: null } : l)
  }

  const invalidate = () => { _lastFetched.value = 0 }

  return {
    links: _links,
    folders: _linkFolders,
    loading: _loading,
    neverLoaded: computed(() => _lastFetched.value === 0),
    fetchLinks, addLink, updateLink, deleteLink, refreshMetadata,
    fetchLinkFolders, createLinkFolder, updateLinkFolder, renameLinkFolder, deleteLinkFolder,
    invalidate,
  }
}
