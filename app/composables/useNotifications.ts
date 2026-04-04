// Module-level timer registry so timers survive across composable calls
const timers = new Map<string, ReturnType<typeof setTimeout>>()

interface StoredReminder {
  title: string
  body: string
  at: string // ISO string
}

const STORAGE_KEY = 'mv_reminders'

const getStored = (): Record<string, StoredReminder> => {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }
  catch { return {} }
}

const saveStored = (r: Record<string, StoredReminder>) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(r))
}

export const useNotifications = () => {
  const isSupported = typeof window !== 'undefined' && 'Notification' in window

  const permission = ref<NotificationPermission | 'unsupported'>(
    isSupported ? Notification.permission : 'unsupported'
  )

  const requestPermission = async (): Promise<NotificationPermission | 'unsupported'> => {
    if (!isSupported) return 'unsupported'
    if (Notification.permission === 'granted') {
      permission.value = 'granted'
      return 'granted'
    }
    if (Notification.permission === 'denied') {
      permission.value = 'denied'
      return 'denied'
    }
    const result = await Notification.requestPermission()
    permission.value = result
    return result
  }

  const showNow = async (title: string, body: string, tag?: string) => {
    if (!isSupported || Notification.permission !== 'granted') return
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready
        await reg.showNotification(title, { body, tag })
      } else {
        new Notification(title, { body, tag })
      }
    } catch (e) {
      console.error('Failed to show notification:', e)
    }
  }

  const _fire = (id: string, title: string, body: string) => {
    timers.delete(id)
    const stored = getStored()
    delete stored[id]
    saveStored(stored)
    showNow(title, body, id)
  }

  const schedule = async (id: string, title: string, body: string, at: Date) => {
    if (!isSupported) return

    // Ensure we have permission before storing
    if (Notification.permission !== 'granted') {
      const p = await requestPermission()
      if (p !== 'granted') return
    }

    // Cancel any existing timer for this id
    cancel(id)

    const stored = getStored()
    stored[id] = { title, body, at: at.toISOString() }
    saveStored(stored)

    const delay = at.getTime() - Date.now()
    if (delay <= 0) {
      // Already past — show immediately
      _fire(id, title, body)
      return
    }

    const timer = setTimeout(() => _fire(id, title, body), delay)
    timers.set(id, timer)
  }

  const cancel = (id: string) => {
    const timer = timers.get(id)
    if (timer) { clearTimeout(timer); timers.delete(id) }
    const stored = getStored()
    delete stored[id]
    saveStored(stored)
  }

  // Call once on app startup — reschedules all stored reminders
  const init = async () => {
    if (!isSupported) return
    permission.value = Notification.permission
    if (Notification.permission !== 'granted') return

    const stored = getStored()
    const now = Date.now()
    const overdue: string[] = []

    for (const [id, r] of Object.entries(stored)) {
      const fireAt = new Date(r.at).getTime()
      const delay = fireAt - now

      if (delay <= 0) {
        overdue.push(id)
        await showNow(r.title, r.body, id)
      } else {
        // Avoid duplicate timers if init() called more than once
        if (!timers.has(id)) {
          const timer = setTimeout(() => _fire(id, r.title, r.body), delay)
          timers.set(id, timer)
        }
      }
    }

    if (overdue.length) {
      const cleaned = getStored()
      overdue.forEach((id) => delete cleaned[id])
      saveStored(cleaned)
    }
  }

  return { isSupported, permission, requestPermission, schedule, cancel, init, showNow }
}
