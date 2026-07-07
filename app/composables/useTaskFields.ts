export type TaskFieldType = 'text' | 'number' | 'date' | 'select' | 'checkbox'

export interface TaskFieldOption {
  value: string
  label: string
  color: string
}

const dbFields = ref<any[]>([])
const loaded = ref(false)

const slugify = (label: string): string =>
  label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'field'

const genKey = (label: string): string => {
  const suffix = Math.random().toString(36).slice(2, 6)
  return `${slugify(label)}-${suffix}`
}

export const useTaskFields = () => {
  const client: any = useSupabaseClient()

  const getUserId = async (): Promise<string | null> => {
    const { data: { user } } = await client.auth.getUser()
    return user?.id ?? null
  }

  const fields = computed(() =>
    [...dbFields.value].sort((a: any, b: any) => a.position - b.position)
  )

  const fetchFields = async () => {
    if (loaded.value) return
    const userId = await getUserId()
    if (!userId) return
    try {
      const { data, error } = await client
        .from('task_fields')
        .select('*')
        .eq('user_id', userId)
        .order('position', { ascending: true })
      if (error) throw error
      dbFields.value = data || []
      loaded.value = true
    } catch (e) {
      console.error('Failed to fetch task fields:', e)
    }
  }

  const createField = async (label: string, type: TaskFieldType, options: TaskFieldOption[] = []) => {
    const userId = await getUserId()
    if (!userId) return null
    const trimmed = label.trim()
    if (!trimmed) return null
    const key = genKey(trimmed)
    const position = dbFields.value.length
    const { data, error } = await client
      .from('task_fields')
      .insert({ user_id: userId, key, label: trimmed, type, options, position })
      .select()
      .single()
    if (error) {
      console.error('Failed to create task field:', error)
      return null
    }
    if (data) dbFields.value.push(data)
    return data
  }

  const updateField = async (id: string, updates: { label?: string; options?: TaskFieldOption[] }) => {
    const patch: Record<string, any> = {}
    if (updates.label !== undefined) patch.label = updates.label.trim()
    if (updates.options !== undefined) patch.options = updates.options
    const { data, error } = await client
      .from('task_fields')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (error) {
      console.error('Failed to update task field:', error)
      return null
    }
    if (data) {
      const idx = dbFields.value.findIndex((f: any) => f.id === id)
      if (idx !== -1) dbFields.value[idx] = data
    }
    return data
  }

  const reorderFields = async (orderedIds: string[]) => {
    orderedIds.forEach((id, index) => {
      const idx = dbFields.value.findIndex((f: any) => f.id === id)
      if (idx !== -1) dbFields.value[idx] = { ...dbFields.value[idx], position: index }
    })
    try {
      await Promise.all(
        orderedIds.map((id, index) =>
          client.from('task_fields').update({ position: index }).eq('id', id)
        )
      )
    } catch (e) {
      console.error('Failed to reorder task fields:', e)
    }
  }

  const deleteField = async (id: string) => {
    const field = dbFields.value.find((f: any) => f.id === id)
    if (!field) return
    const { error } = await client.from('task_fields').delete().eq('id', id)
    if (error) {
      console.error('Failed to delete task field:', error)
      return
    }
    dbFields.value = dbFields.value.filter((f: any) => f.id !== id)

    // Strip the field's key from any already-loaded task's custom_fields
    const { tasks, updateTask } = useTasks()
    const affected = tasks.value.filter((t: any) => t.custom_fields && field.key in t.custom_fields)
    for (const task of affected) {
      const rest = { ...task.custom_fields }
      delete rest[field.key]
      try {
        await updateTask(task.id, { custom_fields: rest })
      } catch (e) {
        console.error('Failed to strip deleted field from task:', task.id, e)
      }
    }
  }

  return {
    fields,
    fetchFields,
    createField,
    updateField,
    reorderFields,
    deleteField,
  }
}
