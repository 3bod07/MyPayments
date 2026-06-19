// Service worker — offline shell + static asset caching.
// Bump CACHE_VERSION whenever index.html or assets change to force an update.
const CACHE_VERSION = 'v2';
const CACHE_NAME = 'mypay-' + CACHE_VERSION;

// App shell precached on install so the app opens with no network.
const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png'
];

// Cross-origin hosts that serve STATIC assets (libs/fonts) — safe to cache.
// NOTE: Supabase (*.supabase.co) is intentionally NOT here so live data/auth
// always go to the network and never get served stale from cache.
const STATIC_HOSTS = [
  'cdn.jsdelivr.net',
  'cdnjs.cloudflare.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;                     // never touch POST/auth/sync

  const url = new URL(req.url);

  // Navigations: network-first so users get the latest app, cache fallback offline.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html').then((r) => r || caches.match('./')))
    );
    return;
  }

  const isSameOrigin = url.origin === self.location.origin;
  const isStaticCdn = STATIC_HOSTS.indexOf(url.hostname) !== -1;
  if (!isSameOrigin && !isStaticCdn) return;            // e.g. Supabase API → straight to network

  // Static assets: cache-first, fall back to network and cache the result.
  e.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res && (res.status === 200 || res.type === 'opaque')) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy));
        }
        return res;
      });
    })
  );
});
