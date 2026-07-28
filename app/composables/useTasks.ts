// Module-level singletons — persist across page navigations
const _tasks = ref<any[]>([])
const _doneTasks = ref<any[]>([])
const _evergreenTasks = ref<any[]>([])
const _archivedEvergreenTasks = ref<any[]>([])
const _loading = ref(false)
const _cachedDate = ref<string | null>(null)
const _lastFetched = ref(0)
const _ownerId = ref<string | null>(null)
const STALE_MS = 60_000

const todayStr = () => new Date().toISOString().split('T')[0]

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
        .select('id, user_id, text, cat, date, done, rolled_from, images, deadline_at, custom_fields, created_at')
        .eq('user_id', userId)
        .eq('date', date)
        .eq('done', false)
        .eq('is_evergreen', false)
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
        .eq('is_evergreen', false)
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
        .select('id, user_id, text, cat, date, done, rolled_from, images, deadline_at, custom_fields, created_at')
        .eq('user_id', userId)
        .eq('done', false)
        .eq('is_evergreen', false)
        .order('date', { ascending: true })
        .order('created_at', { ascending: true })
      if (error) throw error
      _tasks.value = data || []
      _lastFetched.value = Date.now()
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
        .eq('is_evergreen', false)
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

  const createTask = async (task: { text: string; cat: string | null; date: string; images?: string[] | null; deadline_at?: string | null; custom_fields?: Record<string, any> }) => {
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
    if (task.custom_fields && Object.keys(task.custom_fields).length > 0) insert.custom_fields = task.custom_fields
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

  // ── Evergreen (pinned, recurring) tasks ────────────────────────────────
  const fetchEvergreenTasks = async () => {
    const userId = await getUserId()
    if (!userId) return
    try {
      const { data, error } = await client
        .from('tasks')
        .select('id, user_id, text, cat, images, deadline_at, custom_fields, is_evergreen, last_done_date, archived_at, created_at')
        .eq('user_id', userId)
        .eq('is_evergreen', true)
        .is('archived_at', null)
        .order('created_at', { ascending: true })
      if (error) throw error
      _evergreenTasks.value = data || []
    } catch (e) {
      console.error('Failed to fetch evergreen tasks:', e)
    }
  }

  const fetchArchivedEvergreenTasks = async () => {
    const userId = await getUserId()
    if (!userId) return
    try {
      const { data, error } = await client
        .from('tasks')
        .select('id, user_id, text, cat, images, deadline_at, custom_fields, is_evergreen, last_done_date, archived_at, created_at')
        .eq('user_id', userId)
        .eq('is_evergreen', true)
        .not('archived_at', 'is', null)
        .order('archived_at', { ascending: false })
      if (error) throw error
      _archivedEvergreenTasks.value = data || []
    } catch (e) {
      console.error('Failed to fetch archived evergreen tasks:', e)
    }
  }

  const createEvergreenTask = async (task: { text: string; cat: string | null; custom_fields?: Record<string, any> }) => {
    const userId = await getUserId()
    if (!userId) return null
    const insert: Record<string, any> = {
      user_id: userId,
      text: task.text,
      cat: task.cat,
      date: todayStr(),
      is_evergreen: true,
    }
    if (task.custom_fields && Object.keys(task.custom_fields).length > 0) insert.custom_fields = task.custom_fields
    const { data, error } = await client
      .from('tasks')
      .insert(insert)
      .select()
      .single()
    if (error) {
      console.error('Failed to create evergreen task:', error)
      return null
    }
    if (data) _evergreenTasks.value.push(data)
    return data
  }

  // Toggle today's completion for an evergreen task (does not touch `done`)
  const toggleEvergreenDone = async (id: string) => {
    const task = _evergreenTasks.value.find((t: any) => t.id === id)
    if (!task) return
    const doneToday = task.last_done_date === todayStr()
    const { data, error } = await client
      .from('tasks')
      .update({ last_done_date: doneToday ? null : todayStr() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    const idx = _evergreenTasks.value.findIndex((t: any) => t.id === id)
    if (idx !== -1) _evergreenTasks.value[idx] = { ..._evergreenTasks.value[idx], ...data }
  }

  const archiveEvergreenTask = async (id: string) => {
    const { data, error } = await client
      .from('tasks')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    const task = _evergreenTasks.value.find((t: any) => t.id === id)
    _evergreenTasks.value = _evergreenTasks.value.filter((t: any) => t.id !== id)
    if (task) _archivedEvergreenTasks.value.unshift({ ...task, ...(data || {}) })
  }

  const unarchiveEvergreenTask = async (id: string) => {
    const { data, error } = await client
      .from('tasks')
      .update({ archived_at: null })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    const task = _archivedEvergreenTasks.value.find((t: any) => t.id === id)
    _archivedEvergreenTasks.value = _archivedEvergreenTasks.value.filter((t: any) => t.id !== id)
    if (task) _evergreenTasks.value.push({ ...task, ...(data || {}) })
  }

  // Convert an evergreen task into a normal one-time task
  const convertEvergreenToTask = async (id: string, date: string) => {
    const task = _evergreenTasks.value.find((t: any) => t.id === id)
    if (!task) return null
    const wasDoneToday = task.last_done_date === todayStr()
    const { data, error } = await client
      .from('tasks')
      .update({
        is_evergreen: false,
        archived_at: null,
        last_done_date: null,
        date,
        done: wasDoneToday,
      })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    _evergreenTasks.value = _evergreenTasks.value.filter((t: any) => t.id !== id)
    if (data) {
      if (wasDoneToday) _doneTasks.value.unshift(data)
      else _tasks.value.push(data)
    }
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
    if (task.is_evergreen) throw new Error('Jadikan task biasa dulu sebelum memindahkan ke Backlog')

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
    const isEvergreen = _evergreenTasks.value.some((t: any) => t.id === id) || _archivedEvergreenTasks.value.some((t: any) => t.id === id)
    if (isEvergreen) throw new Error('Jadikan task biasa dulu sebelum menghapus permanen')
    const { error } = await client.from('tasks').delete().eq('id', id)
    if (error) {
      console.error('Failed to delete task:', error)
      return
    }
    _tasks.value = _tasks.value.filter((t: any) => t.id !== id)
  }

  // Fetch done tasks (stay in tasks table with done=true)
  const fetchDoneTasks = async () => {
    const userId = await getUserId()
    if (!userId) return
    try {
      const { data, error } = await client
        .from('tasks')
        .select('id, user_id, text, cat, date, done, rolled_from, images, deadline_at, custom_fields, created_at')
        .eq('user_id', userId)
        .eq('done', true)
        .eq('is_evergreen', false)
        .order('created_at', { ascending: false })
      if (error) throw error
      _doneTasks.value = data || []
    } catch (e) {
      console.error('Failed to fetch done tasks:', e)
    }
  }

  // Mark done — stays in tasks table, does NOT archive to backlog
  const markTaskDone = async (id: string) => {
    const { data, error } = await client
      .from('tasks')
      .update({ done: true })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    const task = _tasks.value.find((t: any) => t.id === id)
    _tasks.value = _tasks.value.filter((t: any) => t.id !== id)
    if (task) _doneTasks.value.unshift({ ...task, done: true, ...(data || {}) })
  }

  // Restore done task back to active
  const markTaskUndone = async (id: string) => {
    const { data, error } = await client
      .from('tasks')
      .update({ done: false })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    const task = _doneTasks.value.find((t: any) => t.id === id)
    _doneTasks.value = _doneTasks.value.filter((t: any) => t.id !== id)
    if (task) _tasks.value.push({ ...task, done: false, ...(data || {}) })
  }

  // Archive done task to backlog then delete from tasks
  const archiveAndRemoveDone = async (task: any) => {
    const { archiveTask } = useBacklog()
    await archiveTask(task)
    const { error } = await client.from('tasks').delete().eq('id', task.id)
    if (error) throw error
    _doneTasks.value = _doneTasks.value.filter((t: any) => t.id !== task.id)
  }

  // Permanently delete done task (no backlog)
  const purgeDoneTask = async (id: string) => {
    const { error } = await client.from('tasks').delete().eq('id', id)
    if (error) throw error
    _doneTasks.value = _doneTasks.value.filter((t: any) => t.id !== id)
  }

  const invalidate = () => { _lastFetched.value = 0 }

  return {
    tasks: _tasks,
    doneTasks: _doneTasks,
    evergreenTasks: _evergreenTasks,
    archivedEvergreenTasks: _archivedEvergreenTasks,
    loading: _loading,
    neverLoaded: computed(() => _lastFetched.value === 0),
    fetchTasksForDate,
    fetchTasksForRange,
    fetchAllPending,
    fetchDoneTasks,
    fetchEvergreenTasks,
    fetchArchivedEvergreenTasks,
    rolloverTasks,
    createTask,
    createEvergreenTask,
    updateTask,
    completeTask,
    deleteTask,
    markTaskDone,
    markTaskUndone,
    toggleEvergreenDone,
    archiveEvergreenTask,
    unarchiveEvergreenTask,
    convertEvergreenToTask,
    archiveAndRemoveDone,
    purgeDoneTask,
    invalidate,
  }
}
