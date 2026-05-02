const backlogItems = ref<any[]>([])
const backlogLoaded = ref(false)
const backlogLoading = ref(false)

export const useBacklog = () => {
  const client: any = useSupabaseClient()

  const getUserId = async (): Promise<string | null> => {
    const { data: { user } } = await client.auth.getUser()
    return user?.id ?? null
  }

  const fetchBacklog = async () => {
    const userId = await getUserId()
    if (!userId) return
    backlogLoading.value = true
    try {
      const { data, error } = await client
        .from('backlog')
        .select('id, user_id, source_type, source_data, deleted_at, created_at')
        .eq('user_id', userId)
        .order('deleted_at', { ascending: false })
      if (error) throw error
      backlogItems.value = data || []
      backlogLoaded.value = true
    } catch (e) {
      console.error('Failed to fetch backlog:', e)
    } finally {
      backlogLoading.value = false
    }
  }

  const archiveDump = async (note: any) => {
    const userId = await getUserId()
    if (!userId) throw new Error('Not authenticated')

    const sourceData = {
      id: note.id,
      raw: note.raw,
      title: note.title,
      tag: note.tag,
      images: note.images || [],
      poin: note.poin,
      action: note.action,
      fokus: note.fokus,
      created_at: note.created_at,
      reminder_at: note.reminder_at || null,
    }

    // Step 1: INSERT into backlog — must succeed before deleting
    const { data, error: insertError } = await client
      .from('backlog')
      .insert({
        user_id: userId,
        source_type: 'dump',
        source_data: sourceData,
        deleted_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to insert into backlog:', insertError)
      throw new Error('Failed to archive note to backlog')
    }

    // Step 2: DELETE from notes — only after backlog insert succeeded
    const { error: deleteError } = await client
      .from('notes')
      .delete()
      .eq('id', note.id)

    if (deleteError) {
      console.error('Failed to delete note after archiving:', deleteError)
      // Backlog entry exists but note wasn't deleted — not ideal but data is safe
      throw new Error('Note archived but failed to remove from dump')
    }

    // Update local state
    if (data) backlogItems.value.unshift(data)
    return data
  }

  const archiveTask = async (task: any) => {
    const userId = await getUserId()
    if (!userId) throw new Error('Not authenticated')

    const sourceData = {
      id: task.id,
      text: task.text,
      cat: task.cat,
      date: task.date,
      done_at: new Date().toISOString(),
      rolled_from: task.rolled_from,
      created_at: task.created_at,
      images: task.images || [],
      deadline_at: task.deadline_at || null,
    }

    const { data, error } = await client
      .from('backlog')
      .insert({
        user_id: userId,
        source_type: 'todo',
        source_data: sourceData,
        deleted_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to archive task:', error)
      throw new Error('Failed to archive task to backlog')
    }

    if (data) backlogItems.value.unshift(data)
    return data
  }

  const reactivateToTask = async (item: any, date: string) => {
    const userId = await getUserId()
    if (!userId) throw new Error('Not authenticated')

    const sd = item.source_data || {}
    const { data, error } = await client
      .from('tasks')
      .insert({
        user_id: userId,
        text: sd.text || '',
        cat: sd.cat || null,
        date,
        done: false,
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to reactivate task:', error)
      throw new Error('Failed to reactivate task')
    }

    // Remove from backlog after successful task creation
    await client.from('backlog').delete().eq('id', item.id)
    backlogItems.value = backlogItems.value.filter((i: any) => i.id !== item.id)
    return data
  }

  const permanentDelete = async (id: string, images?: string[]) => {
    const userId = await getUserId()
    if (!userId) return

    // Clean up storage images if any
    if (images && images.length > 0) {
      for (const imageUrl of images) {
        try {
          const bucketBase = '/dump-images/'
          const idx = imageUrl.indexOf(bucketBase)
          if (idx === -1) continue
          const path = imageUrl.substring(idx + bucketBase.length)
          await client.storage.from('dump-images').remove([path])
        } catch (e) {
          console.error('Failed to delete image from storage:', e)
        }
      }
    }

    const { error } = await client.from('backlog').delete().eq('id', id)
    if (error) {
      console.error('Failed to permanently delete backlog item:', error)
      return
    }
    backlogItems.value = backlogItems.value.filter((i: any) => i.id !== id)
  }

  const restoreToNote = async (item: any) => {
    const userId = await getUserId()
    if (!userId) return null

    const sd = item.source_data || {}
    const isTodo = item.source_type === 'todo'

    const insert: Record<string, any> = {
      user_id: userId,
      raw: isTodo ? (sd.text || '') : (sd.raw || ''),
      tag: isTodo ? (sd.cat || null) : (sd.tag || null),
    }
    if (!isTodo) {
      if (sd.title) insert.title = sd.title
      if (sd.poin) insert.poin = sd.poin
      if (sd.action) insert.action = sd.action
      if (sd.fokus) insert.fokus = sd.fokus
    }
    if (sd.images && sd.images.length > 0) insert.images = sd.images

    const { data, error } = await client
      .from('notes')
      .insert(insert)
      .select()
      .single()

    if (error) {
      console.error('Failed to restore note:', error)
      return null
    }

    // Remove from backlog
    await client.from('backlog').delete().eq('id', item.id)
    backlogItems.value = backlogItems.value.filter((i: any) => i.id !== item.id)
    return data
  }

  const clearAll = async () => {
    const userId = await getUserId()
    if (!userId) return

    // Clean up images for dump items
    for (const item of backlogItems.value) {
      if (item.source_type === 'dump' && item.source_data?.images?.length) {
        for (const imageUrl of item.source_data.images) {
          try {
            const bucketBase = '/dump-images/'
            const idx = imageUrl.indexOf(bucketBase)
            if (idx === -1) continue
            const path = imageUrl.substring(idx + bucketBase.length)
            await client.storage.from('dump-images').remove([path])
          } catch (e) {
            console.error('Failed to delete image:', e)
          }
        }
      }
    }

    const { error } = await client
      .from('backlog')
      .delete()
      .eq('user_id', userId)

    if (error) {
      console.error('Failed to clear backlog:', error)
      return
    }
    backlogItems.value = []
  }

  return {
    backlogItems,
    backlogLoaded,
    backlogLoading,
    fetchBacklog,
    archiveDump,
    archiveTask,
    permanentDelete,
    restoreToNote,
    reactivateToTask,
    clearAll,
  }
}
