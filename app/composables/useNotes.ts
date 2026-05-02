// Module-level singletons — persist across page navigations
const _notes = ref<any[]>([])
const _loading = ref(false)
const _lastFetched = ref(0)
const _lastTag = ref<string | undefined>(undefined)
const _ownerId = ref<string | null>(null)
const STALE_MS = 60_000

export const useNotes = () => {
  const client: any = useSupabaseClient()

  const getUserId = async (): Promise<string | null> => {
    const { data: { user } } = await client.auth.getUser()
    return user?.id ?? null
  }

  const fetchNotes = async (tag?: string) => {
    const sameTag = tag === _lastTag.value
    const fresh = _lastFetched.value > 0 && Date.now() - _lastFetched.value < STALE_MS
    if (fresh && sameTag && _notes.value.length > 0) return

    // Only block UI on very first load
    if (_lastFetched.value === 0) _loading.value = true

    const userId = await getUserId()
    if (!userId) { _loading.value = false; return }

    if (_ownerId.value && _ownerId.value !== userId) {
      _notes.value = []; _lastFetched.value = 0
    }
    _ownerId.value = userId

    try {
      let query = client
        .from('notes')
        .select('id, user_id, raw, title, tag, project_id, images, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (tag && tag !== 'all') {
        query = query.eq('tag', tag)
      }
      const { data, error } = await query
      if (error) throw error
      _notes.value = data || []
      _lastFetched.value = Date.now()
      _lastTag.value = tag
    } catch (e) {
      console.error('Failed to fetch notes:', e)
    } finally {
      _loading.value = false
    }
  }

  const createNote = async (note: { raw: string; tag: string; title?: string; project_id?: string | null }) => {
    const userId = await getUserId()
    if (!userId) {
      console.error('[createNote] No authenticated user')
      return null
    }
    const insert: Record<string, any> = {
      user_id: userId,
      raw: note.raw,
      tag: note.tag,
    }
    if (note.title) insert.title = note.title
    if (note.project_id) insert.project_id = note.project_id
    const { data, error } = await client
      .from('notes')
      .insert(insert)
      .select()
      .single()
    if (error) {
      console.error('[createNote] Supabase error:', error.message, error)
      return null
    }
    if (data) _notes.value.unshift(data)
    return data
  }

  const updateNote = async (id: string, updates: Record<string, any>) => {
    const userId = await getUserId()
    if (!userId) return null
    const { data, error } = await client
      .from('notes')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) {
      console.error('Failed to update note:', error)
      return null
    }
    if (data) {
      const idx = _notes.value.findIndex((n: any) => n.id === id)
      if (idx !== -1) _notes.value[idx] = data
    }
    return data
  }

  const deleteNote = async (id: string) => {
    const userId = await getUserId()
    if (!userId) return
    const { error } = await client.from('notes').delete().eq('id', id)
    if (error) {
      console.error('Failed to delete note:', error)
      return
    }
    _notes.value = _notes.value.filter((n: any) => n.id !== id)
  }

  const invalidate = () => { _lastFetched.value = 0 }

  return {
    notes: _notes,
    loading: _loading,
    neverLoaded: computed(() => _lastFetched.value === 0),
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,
    invalidate,
  }
}
