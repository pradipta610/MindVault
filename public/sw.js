self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

// Network-first for Supabase API calls — never serve stale data
self.addEventListener('fetch', (event) => {
  const url = event.request.url
  // Bypass cache entirely for Supabase REST/Auth/Storage and our own API
  if (
    url.includes('supabase.co') ||
    url.includes('supabase.in') ||
    url.includes('/rest/') ||
    url.includes('/auth/') ||
    url.includes('/storage/') ||
    url.includes('/api/')
  ) {
    event.respondWith(fetch(event.request))
    return
  }
  // Let everything else pass through normally (browser default)
})

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
