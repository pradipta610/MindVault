export default defineNuxtPlugin(async () => {
  if (!('serviceWorker' in navigator)) return

  try {
    await navigator.serviceWorker.register('/sw.js', { scope: '/' })
  } catch (e) {
    console.error('Service worker registration failed:', e)
  }

  // Force session restore from storage for all contexts so auth is ready
  // before any page component or route middleware tries to fetch data
  try {
    const client: any = useSupabaseClient()
    await client.auth.getSession()
  } catch (e) {
    console.warn('Session restore failed:', e)
  }

  // Reschedule any stored reminders that survived a page reload
  const { init } = useNotifications()
  await init()
})
