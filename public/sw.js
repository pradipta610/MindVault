self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

self.addEventListener('push', (event) => {
  let data = { title: 'MindVault', body: '' }
  try { data = event.data?.json() ?? data } catch {}
  event.waitUntil(
    self.registration.showNotification(data.title, { body: data.body, icon: '/favicon.ico' })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const origin = self.location.origin
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const existing = list.find((c) => c.url.startsWith(origin) && 'focus' in c)
      if (existing) return existing.focus()
      return self.clients.openWindow(origin)
    })
  )
})
