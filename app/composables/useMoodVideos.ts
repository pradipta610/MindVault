// Mood video management: generate via HF, upload to Supabase Storage,
// persist URLs in user_settings, expose reactive state for Focus page.

type MoodMode = 'working' | 'resting'

const moodWorkingUrl = ref<string | null>(null)
const moodRestingUrl = ref<string | null>(null)
const loadedOnce = ref(false)

export const useMoodVideos = () => {
  const client = useSupabaseClient()
  const user = useSupabaseUser()

  // In Nuxt 4 / @nuxtjs/supabase, useSupabaseUser() returns JWT claims where
  // the user id is in `.sub`, not `.id`. Handle both shapes just in case.
  const getUserId = async (): Promise<string | null> => {
    const u: any = user.value
    if (u?.id) return u.id
    if (u?.sub) return u.sub
    // Fallback to fetching session directly
    const { data: { session } } = await client.auth.getSession()
    return session?.user?.id || null
  }

  // Load current mood URLs from user_settings
  const loadMoodUrls = async () => {
    const userId = await getUserId()
    if (!userId) return
    const { data, error } = await client
      .from('user_settings')
      .select('mood_working_url, mood_resting_url')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('loadMoodUrls error', error)
      return
    }
    moodWorkingUrl.value = (data as any)?.mood_working_url || null
    moodRestingUrl.value = (data as any)?.mood_resting_url || null
    loadedOnce.value = true
  }

  // Upload a user-provided file (GIF/MP4/WebM) to Supabase Storage, return public URL
  const uploadFile = async (file: File, mode: MoodMode): Promise<string> => {
    const userId = await getUserId()
    if (!userId) throw new Error('Belum login atau session expired. Silakan logout & login ulang.')

    const ext = (file.name.split('.').pop() || 'mp4').toLowerCase()
    const path = `${userId}/${mode}-${Date.now()}.${ext}`

    const { error: uploadErr } = await client.storage
      .from('mood-videos')
      .upload(path, file, {
        contentType: file.type || 'application/octet-stream',
        upsert: true,
      })

    if (uploadErr) throw uploadErr

    const { data } = client.storage.from('mood-videos').getPublicUrl(path)
    return data.publicUrl
  }

  // Save URL to user_settings (upsert)
  const saveMoodUrl = async (mode: MoodMode, url: string) => {
    const userId = await getUserId()
    if (!userId) throw new Error('User session not loaded yet')
    const col = mode === 'working' ? 'mood_working_url' : 'mood_resting_url'

    const { error } = await (client as any)
      .from('user_settings')
      .upsert(
        { user_id: userId, [col]: url },
        { onConflict: 'user_id' }
      )

    if (error) throw error

    if (mode === 'working') moodWorkingUrl.value = url
    else moodRestingUrl.value = url
  }

  // Full flow: upload file + save URL
  const uploadAndSave = async (file: File, mode: MoodMode): Promise<string> => {
    const publicUrl = await uploadFile(file, mode)
    await saveMoodUrl(mode, publicUrl)
    return publicUrl
  }

  // Remove a mood video URL (clears DB + optionally storage)
  const clearMoodUrl = async (mode: MoodMode) => {
    const userId = await getUserId()
    if (!userId) return
    const col = mode === 'working' ? 'mood_working_url' : 'mood_resting_url'
    await (client as any)
      .from('user_settings')
      .upsert({ user_id: userId, [col]: null }, { onConflict: 'user_id' })

    if (mode === 'working') moodWorkingUrl.value = null
    else moodRestingUrl.value = null
  }

  return {
    moodWorkingUrl,
    moodRestingUrl,
    loadedOnce,
    loadMoodUrls,
    uploadAndSave,
    clearMoodUrl,
  }
}
