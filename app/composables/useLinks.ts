export const useLinks = () => {
  const client: any = useSupabaseClient()
  const links = ref<any[]>([])
  const loading = ref(false)

  const getUserId = async (): Promise<string | null> => {
    const { data: { user } } = await client.auth.getUser()
    return user?.id ?? null
  }

  const fetchLinks = async () => {
    const userId = await getUserId()
    if (!userId) return
    loading.value = true
    try {
      const { data, error } = await client
        .from('links')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      links.value = data || []
    } catch (e) {
      console.error('Failed to fetch links:', e)
    } finally {
      loading.value = false
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

  const addLink = async (url: string) => {
    const userId = await getUserId()
    if (!userId) throw new Error('Not authenticated')

    const meta = await fetchMetadata(url)

    const { data, error } = await client
      .from('links')
      .insert({
        user_id: userId,
        url,
        title: meta.title,
        description: meta.description,
        image: meta.image,
        favicon: meta.favicon,
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to add link:', error)
      throw new Error('Failed to save link')
    }
    if (data) links.value.unshift(data)
    return data
  }

  const deleteLink = async (id: string) => {
    const { error } = await client.from('links').delete().eq('id', id)
    if (error) {
      console.error('Failed to delete link:', error)
      throw new Error('Failed to delete link')
    }
    links.value = links.value.filter((l: any) => l.id !== id)
  }

  const refreshMetadata = async (id: string) => {
    const link = links.value.find((l: any) => l.id === id)
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
      const idx = links.value.findIndex((l: any) => l.id === id)
      if (idx !== -1) links.value[idx] = data
    }
    return data
  }

  return { links, loading, fetchLinks, addLink, deleteLink, refreshMetadata }
}
