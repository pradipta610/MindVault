export default defineNuxtPlugin(async () => {
  if (!('serviceWorker' in navigator)) return

  try {
    await navigator.serviceWorker.register('/sw.js', { scope: '/' })
  } catch (e) {
    console.error('Service worker registration failed:', e)
  }

  // Reschedule any stored reminders that survived a page reload
  const { init } = useNotifications()
  await init()
})
