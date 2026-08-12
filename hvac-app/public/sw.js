// Service worker: app-shell caching + Background Sync trigger.
// The actual sync logic lives in src/lib/offline/sync.ts and runs on
// the page — this worker's job is (1) let the app boot with zero
// connection, and (2) wake the page to flush the outbox when the
// browser supports Background Sync (Chromium/Android only; iOS Safari
// falls back to the in-page 'online' event listener, which is why
// sync.ts is also called directly from the app, not only from here).

const SHELL_CACHE = 'hvac-app-shell-v2'
const SHELL_ASSETS = ['/offline']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS).catch(() => {}))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== SHELL_CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // API/data calls: network-first, no fallback to stale data — a
  // failed data fetch should surface as "offline," not serve wrong
  // readings to a technician.
  if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase')) {
    event.respondWith(fetch(request).catch(() => new Response(JSON.stringify({ offline: true }), { headers: { 'Content-Type': 'application/json' } })))
    return
  }

  // App shell / static assets: network-first, so a new deploy is always
  // picked up immediately — falling back to the cached copy only when
  // there's truly no connection (that's the offline-support part).
  // Cache-first was tried initially but meant fixes never showed up
  // until the cache was manually cleared, which isn't acceptable for
  // an app still being actively updated.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(SHELL_CACHE).then((cache) => cache.put(request, clone))
        }
        return response
      })
      .catch(() =>
        caches.match(request).then((cached) => cached || caches.match('/offline'))
      )
  )
})

self.addEventListener('sync', (event) => {
  if (event.tag === 'flush-maintenance-outbox') {
    // Wake any open client to run the real sync logic (IndexedDB access
    // from a service worker is possible but the page already has the
    // Supabase client wired up, so we delegate rather than duplicate it).
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => client.postMessage({ type: 'FLUSH_OUTBOX' }))
      })
    )
  }
})
