// Module-level timer registry so timers survive across composable calls
const timers = new Map<string, ReturnType<typeof setTimeout>>()

interface StoredReminder {
  title: string
  body: string
  at: string // ISO string
}

const STORAGE_KEY = 'mv_reminders'
const VAPID_PUBLIC_KEY = 'BChL9cbK8YyNG_LYr2FYrmQdMJoZ6rr55kR9N7Yid9GPm8AP7Q33LQIgfUJzGmeU9NMrSTl2oewERBso5fSmp-Y'

const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

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
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  const permission = ref<NotificationPermission | 'unsupported'>(
    isSupported ? Notification.permission : 'unsupported'
  )

  // Subscribe to Web Push and store in Supabase
  const subscribePush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push not supported')
      return
    }
    if (!user.value?.id) {
      console.warn('No user logged in, skipping push subscribe')
      return
    }
    try {
      const reg = await navigator.serviceWorker.ready
      const existing = await reg.pushManager.getSubscription()
      const sub = existing || await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
      const json = sub.toJSON()
      if (!json.endpoint || !json.keys) {
        console.warn('Push subscription has no endpoint/keys', json)
        return
      }
      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id: user.value.id,
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
      }, { onConflict: 'user_id,endpoint' })
      if (error) console.error('Failed to save push subscription:', error)
      else console.log('Push subscription saved')
    } catch (e) {
      console.error('Push subscription failed:', e)
    }
  }

  const requestPermission = async (): Promise<NotificationPermission | 'unsupported'> => {
    if (!isSupported) return 'unsupported'
    if (Notification.permission === 'granted') {
      permission.value = 'granted'
      await subscribePush()
      return 'granted'
    }
    if (Notification.permission === 'denied') {
      permission.value = 'denied'
      return 'denied'
    }
    const result = await Notification.requestPermission()
    permission.value = result
    if (result === 'granted') await subscribePush()
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

    if (Notification.permission !== 'granted') {
      const p = await requestPermission()
      if (p !== 'granted') return
    }

    cancel(id)

    const stored = getStored()
    stored[id] = { title, body, at: at.toISOString() }
    saveStored(stored)

    const delay = at.getTime() - Date.now()
    if (delay <= 0) {
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

  const init = async () => {
    if (!isSupported) return
    permission.value = Notification.permission
    if (Notification.permission !== 'granted') return

    // Re-register push subscription in case it expired
    await subscribePush()

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

  return { isSupported, permission, requestPermission, schedule, cancel, init, showNow, subscribePush }
}
