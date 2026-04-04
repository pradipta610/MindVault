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

  const createTask = async (task: { text: string; cat: string; date: string }) => {
    const userId = await getUserId()
    if (!userId) return null
    const { data, error } = await client
      .from('tasks')
      .insert({
        user_id: userId,
        text: task.text,
        cat: task.cat,
        date: task.date,
      })
      .select()
      .single()
    if (error) {
      console.error('Failed to create task:', error)
      return null
    }
    if (data) tasks.value.push(data)
    return data
  }

  const toggleTask = async (id: string, done: boolean) => {
    const userId = await getUserId()
    if (!userId) return null
    const updates: Record<string, any> = { done }
    if (done) updates.done_at = new Date().toISOString()
    else updates.done_at = null

    const { data, error } = await client
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) {
      console.error('Failed to toggle task:', error)
      return null
    }
    if (data) {
      const idx = tasks.value.findIndex((t: any) => t.id === id)
      if (idx !== -1) {
        if (done) {
          tasks.value.splice(idx, 1)
        } else {
          tasks.value[idx] = data
        }
      }
    }
    return data
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

  const fetchBacklog = async () => {
    const userId = await getUserId()
    if (!userId) return
    loading.value = true
    try {
      const { data, error } = await client
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('done', true)
        .order('done_at', { ascending: false })
      if (error) throw error
      tasks.value = data || []
    } catch (e) {
      console.error('Failed to fetch backlog:', e)
    } finally {
      loading.value = false
    }
  }

  const reactivateTask = async (id: string, date: string) => {
    const userId = await getUserId()
    if (!userId) return null
    const { data, error } = await client
      .from('tasks')
      .update({ done: false, done_at: null, date })
      .eq('id', id)
      .select()
      .single()
    if (error) {
      console.error('Failed to reactivate task:', error)
      return null
    }
    tasks.value = tasks.value.filter((t: any) => t.id !== id)
    return data
  }

  const clearBacklog = async () => {
    const userId = await getUserId()
    if (!userId) return
    const { error } = await client
      .from('tasks')
      .delete()
      .eq('user_id', userId)
      .eq('done', true)
    if (error) {
      console.error('Failed to clear backlog:', error)
      return
    }
    tasks.value = []
  }

  return {
    tasks,
    loading,
    fetchTasksForDate,
    fetchAllPending,
    rolloverTasks,
    createTask,
    toggleTask,
    deleteTask,
    reactivateTask,
    fetchBacklog,
    clearBacklog,
  }
}
