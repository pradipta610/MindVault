export type FocusMethod = 'pomodoro' | '52/17' | '90min' | 'flowtime' | 'deadline'

export interface FocusSession {
  id: string
  user_id: string
  task_id: string | null
  project_id: string | null
  method: FocusMethod
  duration_minutes: number
  started_at: string
  completed_at: string | null
  created_at: string
}

export const useFocusSessions = () => {
  const client: any = useSupabaseClient()

  const getUserId = async (): Promise<string | null> => {
    const { data: { user } } = await client.auth.getUser()
    return user?.id ?? null
  }

  // ── Create session ──────────────────────────────────────────────────────
  const createSession = async (session: {
    method: FocusMethod
    task_id?: string | null
    project_id?: string | null
    started_at: string
  }): Promise<FocusSession | null> => {
    const userId = await getUserId()
    if (!userId) return null
    const { data, error } = await client
      .from('focus_sessions')
      .insert({
        user_id: userId,
        method: session.method,
        task_id: session.task_id || null,
        project_id: session.project_id || null,
        started_at: session.started_at,
      })
      .select()
      .single()
    if (error) {
      console.error('Failed to create focus session:', error)
      return null
    }
    return data
  }

  // ── Complete session ────────────────────────────────────────────────────
  const completeSession = async (id: string, durationMinutes: number): Promise<boolean> => {
    const { error } = await client
      .from('focus_sessions')
      .update({
        duration_minutes: durationMinutes,
        completed_at: new Date().toISOString(),
      })
      .eq('id', id)
    if (error) {
      console.error('Failed to complete focus session:', error)
      return false
    }
    return true
  }

  // ── Delete session ──────────────────────────────────────────────────────
  const deleteSession = async (id: string): Promise<boolean> => {
    const { error } = await client
      .from('focus_sessions')
      .delete()
      .eq('id', id)
    if (error) {
      console.error('Failed to delete focus session:', error)
      return false
    }
    return true
  }

  // ── Fetch today's sessions ──────────────────────────────────────────────
  const fetchTodaySessions = async (): Promise<FocusSession[]> => {
    const userId = await getUserId()
    if (!userId) return []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { data, error } = await client
      .from('focus_sessions')
      .select('id, user_id, task_id, project_id, method, duration_minutes, started_at, completed_at, created_at')
      .eq('user_id', userId)
      .gte('started_at', today.toISOString())
      .not('completed_at', 'is', null)
      .order('started_at', { ascending: false })
    if (error) {
      console.error('Failed to fetch today sessions:', error)
      return []
    }
    return data || []
  }

  // ── Fetch sessions for a date range (for weekly chart) ──────────────────
  const fetchSessionsRange = async (startDate: string, endDate: string): Promise<FocusSession[]> => {
    const userId = await getUserId()
    if (!userId) return []
    const { data, error } = await client
      .from('focus_sessions')
      .select('id, user_id, task_id, project_id, method, duration_minutes, started_at, completed_at, created_at')
      .eq('user_id', userId)
      .gte('started_at', startDate)
      .lte('started_at', endDate)
      .not('completed_at', 'is', null)
      .order('started_at', { ascending: true })
    if (error) {
      console.error('Failed to fetch sessions range:', error)
      return []
    }
    return data || []
  }

  // ── Fetch session count per task ────────────────────────────────────────
  const fetchTaskSessionCounts = async (): Promise<Record<string, number>> => {
    const userId = await getUserId()
    if (!userId) return {}
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { data, error } = await client
      .from('focus_sessions')
      .select('task_id')
      .eq('user_id', userId)
      .not('task_id', 'is', null)
      .not('completed_at', 'is', null)
    if (error) {
      console.error('Failed to fetch task session counts:', error)
      return {}
    }
    const counts: Record<string, number> = {}
    for (const row of data || []) {
      if (row.task_id) {
        counts[row.task_id] = (counts[row.task_id] || 0) + 1
      }
    }
    return counts
  }

  // ── Streak calculation ──────────────────────────────────────────────────
  const fetchStreak = async (): Promise<number> => {
    const userId = await getUserId()
    if (!userId) return 0
    // Fetch distinct dates with completed sessions, last 60 days
    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
    const { data, error } = await client
      .from('focus_sessions')
      .select('started_at')
      .eq('user_id', userId)
      .not('completed_at', 'is', null)
      .gte('started_at', sixtyDaysAgo.toISOString())
      .order('started_at', { ascending: false })
    if (error || !data || data.length === 0) return 0

    // Extract unique dates
    const dates = new Set<string>()
    for (const row of data) {
      dates.add(new Date(row.started_at).toISOString().split('T')[0]!)
    }
    const sortedDates = [...dates].sort().reverse()

    // Count consecutive days from today/yesterday
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]!
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]!

    let streak = 0
    let checkDate = sortedDates[0] === todayStr ? today : (sortedDates[0] === yesterdayStr ? yesterday : null)
    if (!checkDate) return 0

    for (const d of sortedDates) {
      const expected = checkDate.toISOString().split('T')[0]
      if (d === expected) {
        streak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }
    return streak
  }

  return {
    createSession,
    completeSession,
    deleteSession,
    fetchTodaySessions,
    fetchSessionsRange,
    fetchTaskSessionCounts,
    fetchStreak,
  }
}
