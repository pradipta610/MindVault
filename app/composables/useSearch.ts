export interface SearchResult {
  id: string
  section: 'dump' | 'todo' | 'keuangan' | 'apps' | 'links' | 'projects'
  title: string
  preview: string
  date: string
  route: string
  icon: string
}

const SECTION_META: { [k: string]: { icon: string; label: string } } & Record<'dump' | 'todo' | 'keuangan' | 'apps' | 'links' | 'projects', { icon: string; label: string }> = {
  dump: { icon: '🗂️', label: 'Dump' },
  todo: { icon: '✅', label: 'To-Do' },
  keuangan: { icon: '💰', label: 'Keuangan' },
  apps: { icon: '⚡', label: 'Apps' },
  links: { icon: '🔗', label: 'Links' },
  projects: { icon: '📁', label: 'Projects' },
}

export const useSearch = () => {
  const client: any = useSupabaseClient()
  const results = ref<SearchResult[]>([])
  const loading = ref(false)
  const query = ref('')

  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  const stripHtml = (html: string): string => html?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || ''

  const truncate = (text: string, max = 80): string => {
    const clean = stripHtml(text)
    return clean.length > max ? clean.slice(0, max) + '...' : clean
  }

  const formatDate = (d: string | null | undefined): string => {
    if (!d) return ''
    try {
      return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    } catch { return '' }
  }

  const search = async (q: string) => {
    const trimmed = q.trim()
    if (!trimmed) {
      results.value = []
      loading.value = false
      return
    }

    loading.value = true
    const pattern = `%${trimmed}%`

    try {
      const { data: { user } } = await client.auth.getUser()
      if (!user) { results.value = []; loading.value = false; return }
      const uid = user.id

      const [notesRes, tasksRes, trxRes, appsRes, linksRes, projRes] = await Promise.all([
        // Dump: search title + raw
        client
          .from('notes')
          .select('id, title, raw, tag, created_at')
          .eq('user_id', uid)
          .or(`title.ilike.${pattern},raw.ilike.${pattern}`)
          .order('created_at', { ascending: false })
          .limit(10),
        // To-Do: search text
        client
          .from('tasks')
          .select('id, text, cat, date, done')
          .eq('user_id', uid)
          .eq('done', false)
          .ilike('text', pattern)
          .order('date', { ascending: false })
          .limit(10),
        // Keuangan: search note + category
        client
          .from('transactions')
          .select('id, note, category, type, amount, date')
          .eq('user_id', uid)
          .or(`note.ilike.${pattern},category.ilike.${pattern}`)
          .order('date', { ascending: false })
          .limit(10),
        // Apps: search name
        client
          .from('apps')
          .select('id, name, description, created_at')
          .eq('user_id', uid)
          .ilike('name', pattern)
          .order('created_at', { ascending: false })
          .limit(10),
        // Links: search title + url + description
        client
          .from('links')
          .select('id, title, url, description, created_at')
          .eq('user_id', uid)
          .or(`title.ilike.${pattern},url.ilike.${pattern},description.ilike.${pattern}`)
          .order('created_at', { ascending: false })
          .limit(10),
        // Projects: search name
        client
          .from('projects')
          .select('id, name, icon, status, created_at')
          .eq('user_id', uid)
          .ilike('name', pattern)
          .order('created_at', { ascending: false })
          .limit(10),
      ])

      const all: SearchResult[] = []

      // Dump results
      for (const n of (notesRes.data || [])) {
        all.push({
          id: n.id,
          section: 'dump',
          title: n.title || truncate(n.raw, 50),
          preview: truncate(n.raw),
          date: formatDate(n.created_at),
          route: '/dump',
          icon: SECTION_META.dump.icon,
        })
      }

      // To-Do results
      for (const t of (tasksRes.data || [])) {
        all.push({
          id: t.id,
          section: 'todo',
          title: truncate(t.text, 60),
          preview: t.cat ? `Kategori: ${t.cat}` : '',
          date: formatDate(t.date),
          route: '/todo',
          icon: SECTION_META.todo.icon,
        })
      }

      // Keuangan results
      for (const tx of (trxRes.data || [])) {
        const amt = 'Rp\u00a0' + Math.abs(tx.amount).toLocaleString('id-ID')
        all.push({
          id: tx.id,
          section: 'keuangan',
          title: tx.note || tx.category,
          preview: `${tx.type === 'income' ? '+' : '-'}${amt} · ${tx.category}`,
          date: formatDate(tx.date),
          route: '/finance',
          icon: SECTION_META.keuangan.icon,
        })
      }

      // Apps results
      for (const a of (appsRes.data || [])) {
        all.push({
          id: a.id,
          section: 'apps',
          title: a.name,
          preview: a.description ? truncate(a.description) : '',
          date: formatDate(a.created_at),
          route: '/apps',
          icon: SECTION_META.apps.icon,
        })
      }

      // Links results
      for (const l of (linksRes.data || [])) {
        all.push({
          id: l.id,
          section: 'links',
          title: l.title || l.url,
          preview: l.description ? truncate(l.description) : l.url,
          date: formatDate(l.created_at),
          route: '/links',
          icon: SECTION_META.links.icon,
        })
      }

      // Projects results
      for (const p of (projRes.data || [])) {
        all.push({
          id: p.id,
          section: 'projects',
          title: `${p.icon || '📁'} ${p.name}`,
          preview: `Status: ${p.status || 'active'}`,
          date: formatDate(p.created_at),
          route: `/projects/${p.id}`,
          icon: SECTION_META.projects.icon,
        })
      }

      results.value = all
    } catch (e) {
      console.error('Search failed:', e)
      results.value = []
    } finally {
      loading.value = false
    }
  }

  const debouncedSearch = (q: string) => {
    query.value = q
    if (debounceTimer) clearTimeout(debounceTimer)
    if (!q.trim()) {
      results.value = []
      loading.value = false
      return
    }
    loading.value = true
    debounceTimer = setTimeout(() => search(q), 300)
  }

  const grouped = computed(() => {
    const map: Record<string, SearchResult[]> = {}
    for (const r of results.value) {
      if (!map[r.section]) map[r.section] = []
      map[r.section]!.push(r)
    }
    const order: string[] = ['dump', 'todo', 'keuangan', 'apps', 'links', 'projects']
    return order
      .filter(s => map[s])
      .map(s => ({ section: s, label: SECTION_META[s]!.label, icon: SECTION_META[s]!.icon, items: map[s]! }))
  })

  const clear = () => {
    query.value = ''
    results.value = []
    loading.value = false
    if (debounceTimer) clearTimeout(debounceTimer)
  }

  return { query, results, grouped, loading, debouncedSearch, clear }
}
