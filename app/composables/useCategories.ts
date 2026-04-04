const SEED_CATEGORIES = [
  { name: 'freelance', color: '#60a5fa', icon: '💼' },
  { name: 'belajar', color: '#f87171', icon: '📚' },
  { name: 'personal', color: '#2dd4bf', icon: '👤' },
  { name: 'misc', color: '#fbbf24', icon: '📌' },
]

const dbCategories = ref<any[]>([])
const loaded = ref(false)

export const useCategories = () => {
  const client: any = useSupabaseClient()

  const getUserId = async (): Promise<string | null> => {
    const { data: { user } } = await client.auth.getUser()
    return user?.id ?? null
  }

  const allCategories = computed(() =>
    dbCategories.value.map((c: any) => ({
      name: c.name,
      color: c.color,
      icon: c.icon,
      id: c.id,
    }))
  )

  const hasCategories = computed(() => dbCategories.value.length > 0)

  const categoryNames = computed(() => allCategories.value.map(c => c.name))

  const getCategoryColor = (name: string | null | undefined): string => {
    if (!name) return '#6b7280'
    const cat = allCategories.value.find(c => c.name === name)
    return cat?.color || '#6b7280'
  }

  const getCategoryIcon = (name: string | null | undefined): string => {
    if (!name) return '📂'
    const cat = allCategories.value.find(c => c.name === name)
    return cat?.icon || '�'
  }

  const getCategoryLabel = (name: string | null | undefined): string => {
    if (!name) return 'uncategorized'
    return name
  }

  const fetchCategories = async () => {
    if (loaded.value) return
    const userId = await getUserId()
    if (!userId) return
    try {
      const { data, error } = await client
        .from('categories')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
      if (error) throw error
      dbCategories.value = data || []
      loaded.value = true
    } catch (e) {
      console.error('Failed to fetch categories:', e)
    }
  }

  const seedDefaults = async () => {
    const userId = await getUserId()
    if (!userId) return
    for (const seed of SEED_CATEGORIES) {
      const { data, error } = await client
        .from('categories')
        .insert({ user_id: userId, name: seed.name, color: seed.color, icon: seed.icon })
        .select()
        .single()
      if (!error && data) dbCategories.value.push(data)
    }
    injectAllStyles()
  }

  const createCategory = async (name: string, color: string, icon: string) => {
    const userId = await getUserId()
    if (!userId) return null
    const normalized = name.toLowerCase().trim()
    if (allCategories.value.some(c => c.name === normalized)) return null
    const { data, error } = await client
      .from('categories')
      .insert({ user_id: userId, name: normalized, color, icon })
      .select()
      .single()
    if (error) {
      console.error('Failed to create category:', error)
      return null
    }
    if (data) dbCategories.value.push(data)
    injectCategoryStyle(normalized, color)
    return data
  }

  const updateCategory = async (id: string, name: string, color: string, icon: string) => {
    const { data, error } = await client
      .from('categories')
      .update({ name: name.toLowerCase().trim(), color, icon })
      .eq('id', id)
      .select()
      .single()
    if (error) {
      console.error('Failed to update category:', error)
      return null
    }
    if (data) {
      const idx = dbCategories.value.findIndex((c: any) => c.id === id)
      if (idx !== -1) dbCategories.value[idx] = data
      else dbCategories.value.push(data)
    }
    injectCategoryStyle(name.toLowerCase().trim(), color)
    return data
  }

  const deleteCategory = async (id: string) => {
    const cat = dbCategories.value.find((c: any) => c.id === id)
    if (!cat) return
    const userId = await getUserId()
    if (!userId) return

    await client.from('notes').update({ tag: null }).eq('user_id', userId).eq('tag', cat.name)
    await client.from('tasks').update({ cat: null }).eq('user_id', userId).eq('cat', cat.name)

    const { error } = await client.from('categories').delete().eq('id', id)
    if (error) {
      console.error('Failed to delete category:', error)
      return
    }
    dbCategories.value = dbCategories.value.filter((c: any) => c.id !== id)
  }

  const injectCategoryStyle = (name: string, color: string) => {
    const styleId = `tag-style-${name}`
    let el = document.getElementById(styleId)
    if (!el) {
      el = document.createElement('style')
      el.id = styleId
      document.head.appendChild(el)
    }
    el.textContent = `.tag-${name} { background-color: ${color}33; color: ${color}; }`
  }

  const injectAllStyles = () => {
    for (const cat of allCategories.value) {
      injectCategoryStyle(cat.name, cat.color)
    }
  }

  return {
    allCategories,
    hasCategories,
    categoryNames,
    getCategoryColor,
    getCategoryIcon,
    getCategoryLabel,
    fetchCategories,
    seedDefaults,
    createCategory,
    updateCategory,
    deleteCategory,
    injectAllStyles,
  }
}
