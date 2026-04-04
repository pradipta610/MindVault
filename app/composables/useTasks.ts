export const useTasks = () => {
  const client: any = useSupabaseClient()
  const tasks = ref<any[]>([])
  const loading = ref(false)

  const getUserId = async (): Promise<string | null> => {
    const { data: { user } } = await client.auth.getUser()
    return user?.id ?? null
  }

  const fetchTasksForDate = async (date: string) => {
    const userId = await getUserId()
    if (!userId) return
    loading.value = true
    try {
      const { data, error } = await client
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .eq('done', false)
        .order('created_at', { ascending: true })
      if (error) throw error
      tasks.value = data || []
    } catch (e) {
      console.error('Failed to fetch tasks:', e)
    } finally {
      loading.value = false
    }
  }

  const fetchAllPending = async () => {
    const userId = await getUserId()
    if (!userId) return
    loading.value = true
    try {
      const { data, error } = await client
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('done', false)
        .order('date', { ascending: true })
        .order('created_at', { ascending: true })
      if (error) throw error
      tasks.value = data || []
    } catch (e) {
      console.error('Failed to fetch all tasks:', e)
    } finally {
      loading.value = false
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
    if (data) tasks.value.push(data)
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
    const idx = tasks.value.findIndex((t: any) => t.id === id)
    if (idx !== -1) tasks.value[idx] = { ...tasks.value[idx], ...data }
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
    tasks.value = tasks.value.filter((t: any) => t.id !== task.id)
  }

  const deleteTask = async (id: string) => {
    const userId = await getUserId()
    if (!userId) return
    const { error } = await client.from('tasks').delete().eq('id', id)
    if (error) {
      console.error('Failed to delete task:', error)
      return
    }
    tasks.value = tasks.value.filter((t: any) => t.id !== id)
  }

  return {
    tasks,
    loading,
    fetchTasksForDate,
    fetchAllPending,
    rolloverTasks,
    createTask,
    updateTask,
    completeTask,
    deleteTask,
  }
}
