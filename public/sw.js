// SW version — bump to force update on clients
const SW_VERSION = 'v3'
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(
  Promise.all([
    self.clients.claim(),
    // Clear any old caches that may contain stale /api/ responses
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
  ])
))

// We do NOT intercept fetch at all — let the browser handle everything natively.
// Calling event.respondWith(fetch(event.request)) breaks POST requests with bodies
// (multipart/form-data, etc.) because the request body is a one-time stream.

self.addEventListener('push', (event) => {
  let data = { title: 'MindVault', body: '' }
  try { data = event.data?.json() ?? data } catch {}
  event.waitUntil(
    self.registration.showNotification(data.title, { body: data.body })
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
