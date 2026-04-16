export default defineNuxtPlugin(async () => {
  if (!('serviceWorker' in navigator)) return

  try {
    await navigator.serviceWorker.register('/sw.js', { scope: '/' })
  } catch (e) {
    console.error('Service worker registration failed:', e)
  }

  // In PWA standalone mode, force a session refresh so auth is ready
  // before any page component tries to fetch data
  const isPWA = window.matchMedia('(display-mode: standalone)').matches
    || (navigator as any).standalone === true
  if (isPWA) {
    try {
      const client: any = useSupabaseClient()
      await client.auth.getSession()
    } catch (e) {
      console.warn('PWA session refresh failed:', e)
    }
  }

  // Reschedule any stored reminders that survived a page reload
  const { init } = useNotifications()
  await init()
})
