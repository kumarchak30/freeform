const CACHE = 'freeform-v1'

// App shell files to cache on install
const PRECACHE = [
  '/freeform/',
  '/freeform/index.html',
  '/freeform/manifest.json',
  '/freeform/icons/icon-192.png',
  '/freeform/icons/icon-512.png',
]

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url)

  // Let Supabase API & audio requests go straight to network — never cache audio
  if (url.hostname.includes('supabase.co')) {
    e.respondWith(fetch(e.request))
    return
  }

  // For everything else: cache-first for app shell, network-first for JS/CSS assets
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached
      return fetch(e.request).then(res => {
        // Only cache same-origin GET requests
        if (e.request.method !== 'GET' || !url.origin.includes(self.location.origin)) return res
        const clone = res.clone()
        caches.open(CACHE).then(c => c.put(e.request, clone))
        return res
      }).catch(() => cached) // offline fallback
    })
  )
})
