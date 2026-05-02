// Module-level singletons — persist across page navigations
const _projects = ref<any[]>([])
const _loading = ref(false)
const _lastFetched = ref(0)
const _ownerId = ref<string | null>(null)
const STALE_MS = 60_000

export const useProjects = () => {
  const client: any = useSupabaseClient()

  const getUserId = async (): Promise<string | null> => {
    const { data: { user } } = await client.auth.getUser()
    return user?.id ?? null
  }

  const fetchProjects = async () => {
    const fresh = _lastFetched.value > 0 && Date.now() - _lastFetched.value < STALE_MS
    if (fresh) return

    if (_lastFetched.value === 0) _loading.value = true

    const userId = await getUserId()
    if (!userId) { _loading.value = false; return }

    if (_ownerId.value && _ownerId.value !== userId) {
      _projects.value = []; _lastFetched.value = 0
    }
    _ownerId.value = userId

    try {
      const { data: projs, error } = await client
        .from('projects')
        .select('id, user_id, name, color, icon, status, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      if (!projs || projs.length === 0) { _projects.value = []; _lastFetched.value = Date.now(); return }

      const { data: tasks } = await client
        .from('project_tasks')
        .select('project_id, done')
        .in('project_id', projs.map((p: any) => p.id))

      _projects.value = projs.map((p: any) => {
        const pt = (tasks || []).filter((t: any) => t.project_id === p.id)
        return { ...p, totalTasks: pt.length, doneTasks: pt.filter((t: any) => t.done).length }
      })
      _lastFetched.value = Date.now()
    } catch (e) {
      console.error('Failed to fetch projects:', e)
    } finally {
      _loading.value = false
    }
  }

  const fetchProject = async (id: string) => {
    const { data, error } = await client.from('projects').select('*').eq('id', id).single()
    if (error) return null
    return data
  }

  const createProject = async (payload: { name: string; color: string; icon?: string }) => {
    const userId = await getUserId()
    if (!userId) return null
    const { data, error } = await client
      .from('projects')
      .insert({ ...payload, user_id: userId })
      .select()
      .single()
    if (error) { console.error('Failed to create project:', error); return null }
    if (data) _projects.value.unshift({ ...data, totalTasks: 0, doneTasks: 0 })
    return data
  }

  const updateProject = async (id: string, payload: Partial<{ name: string; color: string; icon: string; status: string }>) => {
    const { data, error } = await client
      .from('projects')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) { console.error('Failed to update project:', error); return null }
    const idx = _projects.value.findIndex((p: any) => p.id === id)
    if (idx !== -1 && data) _projects.value[idx] = { ..._projects.value[idx], ...data }
    return data
  }

  const deleteProject = async (id: string) => {
    const { error } = await client.from('projects').delete().eq('id', id)
    if (error) { console.error('Failed to delete project:', error); return }
    _projects.value = _projects.value.filter((p: any) => p.id !== id)
  }

  // ── Project Tasks ──────────────────────────────────────────────────────────

  const fetchProjectTasks = async (projectId: string) => {
    const { data, error } = await client
      .from('project_tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })
    if (error) { console.error('Failed to fetch project tasks:', error); return [] }
    return data || []
  }

  const createProjectTask = async (projectId: string, text: string, parentId?: string, collaborator?: string) => {
    const userId = await getUserId()
    if (!userId) return null
    const insert: Record<string, any> = { project_id: projectId, user_id: userId, text }
    if (parentId) insert.parent_id = parentId
    if (collaborator) insert.collaborator = collaborator
    const { data, error } = await client
      .from('project_tasks')
      .insert(insert)
      .select()
      .single()
    if (error) { console.error('Failed to create project task:', error); return null }
    return data
  }

  const toggleProjectTask = async (taskId: string, done: boolean) => {
    const { data, error } = await client
      .from('project_tasks')
      .update({ done })
      .eq('id', taskId)
      .select()
      .single()
    if (error) { console.error('Failed to toggle task:', error); return null }
    return data
  }

  const deleteProjectTask = async (taskId: string) => {
    const { error } = await client.from('project_tasks').delete().eq('id', taskId)
    if (error) console.error('Failed to delete project task:', error)
  }

  // ── Project Notes ──────────────────────────────────────────────────────────

  const fetchProjectNotes = async (projectId: string) => {
    const { data, error } = await client
      .from('project_notes')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    if (error) { console.error('Failed to fetch project notes:', error); return [] }
    return data || []
  }

  const createProjectNote = async (projectId: string, raw: string) => {
    const userId = await getUserId()
    if (!userId) return null
    const { data, error } = await client
      .from('project_notes')
      .insert({ project_id: projectId, user_id: userId, raw })
      .select()
      .single()
    if (error) { console.error('Failed to create project note:', error); return null }
    return data
  }

  const updateProjectNote = async (noteId: string, raw: string) => {
    const { data, error } = await client
      .from('project_notes')
      .update({ raw })
      .eq('id', noteId)
      .select()
      .single()
    if (error) { console.error('Failed to update project note:', error); return null }
    return data
  }

  const deleteProjectNote = async (noteId: string) => {
    const { error } = await client.from('project_notes').delete().eq('id', noteId)
    if (error) console.error('Failed to delete project note:', error)
  }

  // ── Project Bugs ───────────────────────────────────────────────────────────

  const fetchProjectBugs = async (projectId: string) => {
    const { data, error } = await client
      .from('project_bugs')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    if (error) { console.error('Failed to fetch project bugs:', error); return [] }
    return data || []
  }

  const createProjectBug = async (projectId: string, payload: { title: string; description: string; status: string }) => {
    const userId = await getUserId()
    if (!userId) return null
    const { data, error } = await client
      .from('project_bugs')
      .insert({ project_id: projectId, user_id: userId, ...payload })
      .select()
      .single()
    if (error) { console.error('Failed to create project bug:', error); return null }
    return data
  }

  const updateProjectBug = async (bugId: string, payload: Partial<{ title: string; description: string; status: string }>) => {
    const { data, error } = await client
      .from('project_bugs')
      .update(payload)
      .eq('id', bugId)
      .select()
      .single()
    if (error) { console.error('Failed to update project bug:', error); return null }
    return data
  }

  const deleteProjectBug = async (bugId: string) => {
    const { error } = await client.from('project_bugs').delete().eq('id', bugId)
    if (error) console.error('Failed to delete project bug:', error)
  }

  // ── Update project task (collaborator, text) ────────────────────────────────

  const updateProjectTask = async (taskId: string, payload: Partial<{ text: string; collaborator: string | null }>) => {
    const { data, error } = await client
      .from('project_tasks')
      .update(payload)
      .eq('id', taskId)
      .select()
      .single()
    if (error) { console.error('Failed to update project task:', error); return null }
    return data
  }

  // ── Linked Dump notes (notes with project_id) ───────────────────────────────

  const fetchLinkedNotes = async (projectId: string) => {
    const userId = await getUserId()
    if (!userId) return []
    const { data, error } = await client
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    if (error) { console.error('Failed to fetch linked notes:', error); return [] }
    return data || []
  }

  // ── Linked Links ────────────────────────────────────────────────────────────

  const fetchLinkedLinks = async (projectId: string) => {
    const userId = await getUserId()
    if (!userId) return []
    const { data, error } = await client
      .from('links')
      .select('*')
      .eq('user_id', userId)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    if (error) { console.error('Failed to fetch linked links:', error); return [] }
    return data || []
  }

  // ── Linked Apps ─────────────────────────────────────────────────────────────

  const fetchLinkedApps = async (projectId: string) => {
    const userId = await getUserId()
    if (!userId) return []
    const { data, error } = await client
      .from('apps')
      .select('*')
      .eq('user_id', userId)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    if (error) { console.error('Failed to fetch linked apps:', error); return [] }
    return data || []
  }

  // ── Linked Focus Sessions ───────────────────────────────────────────────────

  const fetchLinkedFocusSessions = async (projectId: string) => {
    const userId = await getUserId()
    if (!userId) return []
    const { data, error } = await client
      .from('focus_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('project_id', projectId)
      .not('completed_at', 'is', null)
      .order('started_at', { ascending: false })
    if (error) { console.error('Failed to fetch linked focus sessions:', error); return [] }
    return data || []
  }

  const invalidate = () => { _lastFetched.value = 0 }

  return {
    projects: _projects,
    loading: _loading,
    neverLoaded: computed(() => _lastFetched.value === 0),
    fetchProjects,
    invalidate,
    fetchProject,
    createProject,
    updateProject,
    deleteProject,
    fetchProjectTasks,
    createProjectTask,
    toggleProjectTask,
    updateProjectTask,
    deleteProjectTask,
    fetchProjectNotes,
    createProjectNote,
    updateProjectNote,
    deleteProjectNote,
    fetchProjectBugs,
    createProjectBug,
    updateProjectBug,
    deleteProjectBug,
    fetchLinkedNotes,
    fetchLinkedLinks,
    fetchLinkedApps,
    fetchLinkedFocusSessions,
  }
}
