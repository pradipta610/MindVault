// Module-level singletons — persist across page navigations
const _tasks = ref<any[]>([])
const _loading = ref(false)
const _cachedDate = ref<string | null>(null)
const _lastFetched = ref(0)
const _ownerId = ref<string | null>(null)
const STALE_MS = 60_000

export const useTasks = () => {
  const client: any = useSupabaseClient()

  const getUserId = async (): Promise<string | null> => {
    const { data: { user } } = await client.auth.getUser()
    return user?.id ?? null
  }

  const fetchTasksForDate = async (date: string) => {
    const sameDate = date === _cachedDate.value
    const fresh = _lastFetched.value > 0 && Date.now() - _lastFetched.value < STALE_MS
    if (fresh && sameDate && _tasks.value.length >= 0 && _lastFetched.value > 0) return

    if (_lastFetched.value === 0) _loading.value = true

    const userId = await getUserId()
    if (!userId) { _loading.value = false; return }

    if (_ownerId.value && _ownerId.value !== userId) {
      _tasks.value = []; _lastFetched.value = 0
    }
    _ownerId.value = userId

    try {
      const { data, error } = await client
        .from('tasks')
        .select('id, user_id, text, cat, date, done, rolled_from, images, deadline_at, created_at')
        .eq('user_id', userId)
        .eq('date', date)
        .eq('done', false)
        .order('created_at', { ascending: true })
      if (error) throw error
      _tasks.value = data || []
      _cachedDate.value = date
      _lastFetched.value = Date.now()
    } catch (e) {
      console.error('Failed to fetch tasks:', e)
    } finally {
      _loading.value = false
    }
  }

  const fetchTasksForRange = async (startDate: string, endDate: string): Promise<any[]> => {
    const userId = await getUserId()
    if (!userId) return []
    try {
      const { data, error } = await client
        .from('tasks')
        .select('id, date, cat, done')
        .eq('user_id', userId)
        .eq('done', false)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })
      if (error) throw error
      return data || []
    } catch (e) {
      console.error('Failed to fetch tasks for range:', e)
      return []
    }
  }

  const fetchAllPending = async () => {
    const userId = await getUserId()
    if (!userId) return
    _loading.value = true
    try {
      const { data, error } = await client
        .from('tasks')
        .select('id, user_id, text, cat, date, done, rolled_from, images, deadline_at, created_at')
        .eq('user_id', userId)
        .eq('done', false)
        .order('date', { ascending: true })
        .order('created_at', { ascending: true })
      if (error) throw error
      _tasks.value = data || []
    } catch (e) {
      console.error('Failed to fetch all tasks:', e)
    } finally {
      _loading.value = false
    }
  }

  const rolloverTasks = async () => {
    const userId = await getUserId()
    if (!userId) return
    const today = new Date().toISOString().split('T')[0]
    try {
      const { data: overdue, error } = await client
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('done', false)
        .lt('date', today)
      if (error) throw error
      if (overdue && overdue.length > 0) {
        for (const task of overdue) {
          await client
            .from('tasks')
            .update({
              date: today,
              rolled_from: task.rolled_from || task.date,
            })
            .eq('id', task.id)
        }
      }
    } catch (e) {
      console.error('Failed to rollover tasks:', e)
    }
  }

  const createTask = async (task: { text: string; cat: string | null; date: string; images?: string[] | null; deadline_at?: string | null }) => {
    const userId = await getUserId()
    if (!userId) return null
    const insert: Record<string, any> = {
      user_id: userId,
      text: task.text,
      cat: task.cat,
      date: task.date,
    }
    if (task.images && task.images.length > 0) insert.images = task.images
    if (task.deadline_at) insert.deadline_at = task.deadline_at
    const { data, error } = await client
      .from('tasks')
      .insert(insert)
      .select()
      .single()
    if (error) {
      console.error('Failed to create task:', error)
      return null
    }
    if (data) _tasks.value.push(data)
    return data
  }

  const updateTask = async (id: string, updates: Record<string, any>) => {
    const { data, error } = await client
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) {
      console.error('Failed to update task:', error)
      throw new Error('Failed to update task')
    }
    const idx = _tasks.value.findIndex((t: any) => t.id === id)
    if (idx !== -1) _tasks.value[idx] = { ..._tasks.value[idx], ...data }
    return data
  }

  const completeTask = async (task: any) => {
    const userId = await getUserId()
    if (!userId) throw new Error('Not authenticated')

    const { archiveTask } = useBacklog()

    // Step 1: INSERT into backlog — must succeed before deleting
    await archiveTask(task)

    // Step 2: DELETE from tasks — only after backlog insert succeeded
    const { error } = await client
      .from('tasks')
      .delete()
      .eq('id', task.id)

    if (error) {
      console.error('Failed to delete task after archiving:', error)
      throw new Error('Task archived but failed to remove from todo')
    }

    // Remove from local state
    _tasks.value = _tasks.value.filter((t: any) => t.id !== task.id)
  }

  const deleteTask = async (id: string) => {
    const userId = await getUserId()
    if (!userId) return
    const { error } = await client.from('tasks').delete().eq('id', id)
    if (error) {
      console.error('Failed to delete task:', error)
      return
    }
    _tasks.value = _tasks.value.filter((t: any) => t.id !== id)
  }

  const invalidate = () => { _lastFetched.value = 0 }

  return {
    tasks: _tasks,
    loading: _loading,
    neverLoaded: computed(() => _lastFetched.value === 0),
    fetchTasksForDate,
    fetchTasksForRange,
    fetchAllPending,
    rolloverTasks,
    createTask,
    updateTask,
    completeTask,
    deleteTask,
    invalidate,
  }
}
