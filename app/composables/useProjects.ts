export const useProjects = () => {
  const client: any = useSupabaseClient()

  const projects = ref<any[]>([])
  const loading = ref(false)

  const getUserId = async (): Promise<string | null> => {
    const { data: { user } } = await client.auth.getUser()
    return user?.id ?? null
  }

  const fetchProjects = async () => {
    const userId = await getUserId()
    if (!userId) return
    loading.value = true
    try {
      const { data: projs, error } = await client
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      if (!projs || projs.length === 0) { projects.value = []; return }

      const { data: tasks } = await client
        .from('project_tasks')
        .select('project_id, done')
        .in('project_id', projs.map((p: any) => p.id))

      projects.value = projs.map((p: any) => {
        const pt = (tasks || []).filter((t: any) => t.project_id === p.id)
        return { ...p, totalTasks: pt.length, doneTasks: pt.filter((t: any) => t.done).length }
      })
    } catch (e) {
      console.error('Failed to fetch projects:', e)
    } finally {
      loading.value = false
    }
  }

  const fetchProject = async (id: string) => {
    const { data, error } = await client.from('projects').select('*').eq('id', id).single()
    if (error) return null
    return data
  }

  const createProject = async (payload: { name: string; color: string }) => {
    const userId = await getUserId()
    if (!userId) return null
    const { data, error } = await client
      .from('projects')
      .insert({ ...payload, user_id: userId })
      .select()
      .single()
    if (error) { console.error('Failed to create project:', error); return null }
    if (data) projects.value.unshift({ ...data, totalTasks: 0, doneTasks: 0 })
    return data
  }

  const updateProject = async (id: string, payload: Partial<{ name: string; color: string; status: string }>) => {
    const { data, error } = await client
      .from('projects')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) { console.error('Failed to update project:', error); return null }
    const idx = projects.value.findIndex((p: any) => p.id === id)
    if (idx !== -1 && data) projects.value[idx] = { ...projects.value[idx], ...data }
    return data
  }

  const deleteProject = async (id: string) => {
    const { error } = await client.from('projects').delete().eq('id', id)
    if (error) { console.error('Failed to delete project:', error); return }
    projects.value = projects.value.filter((p: any) => p.id !== id)
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

  const createProjectTask = async (projectId: string, text: string) => {
    const userId = await getUserId()
    if (!userId) return null
    const { data, error } = await client
      .from('project_tasks')
      .insert({ project_id: projectId, user_id: userId, text })
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

  return {
    projects,
    loading,
    fetchProjects,
    fetchProject,
    createProject,
    updateProject,
    deleteProject,
    fetchProjectTasks,
    createProjectTask,
    toggleProjectTask,
    deleteProjectTask,
    fetchProjectNotes,
    createProjectNote,
    updateProjectNote,
    deleteProjectNote,
  }
}
