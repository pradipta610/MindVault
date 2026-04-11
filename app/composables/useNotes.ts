export const useNotes = () => {
  const client: any = useSupabaseClient()
  const notes = ref<any[]>([])
  const loading = ref(false)

  const getUserId = async (): Promise<string | null> => {
    const { data: { user } } = await client.auth.getUser()
    return user?.id ?? null
  }

  const fetchNotes = async (tag?: string) => {
    const userId = await getUserId()
    if (!userId) return
    loading.value = true
    try {
      let query = client
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (tag && tag !== 'all') {
        query = query.eq('tag', tag)
      }
      const { data, error } = await query
      if (error) throw error
      notes.value = data || []
    } catch (e) {
      console.error('Failed to fetch notes:', e)
    } finally {
      loading.value = false
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
    if (data) notes.value.unshift(data)
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
      const idx = notes.value.findIndex((n: any) => n.id === id)
      if (idx !== -1) notes.value[idx] = data
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
    notes.value = notes.value.filter((n: any) => n.id !== id)
  }

  return { notes, loading, fetchNotes, createNote, updateNote, deleteNote }
}
