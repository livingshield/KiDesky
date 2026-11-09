const CACHE_NAME = 'kidesky-cache-v1.1.9';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './css/main.css',
  './css/board.css',
  './css/modals.css',
  './css/mobile.css',
  './js/game-data.js',
  './js/game-boards.js',
  './js/game-engine.js',
  './js/game-combat-ai.js',
  './js/app-audio.js',
  './js/app-board.js',
  './js/app-hud.js',
  './js/app-modals.js',
  './js/app-admin.js',
  './js/app-online.js',
  './js/app-saves.js',
  './js/app-dialog.js',
  './js/app-catalog.js',
  './js/app-musicwidget.js',
  './js/app.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Best-effort pre-cache core assets
      return cache.addAll(CORE_ASSETS).catch((err) => {
        console.warn('[SW] Core assets pre-caching partial warning:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Network-first strategy with cache fallback for offline play
self.addEventListener('fetch', (event) => {
  const req = event.request;
  // Ignore non-GET and cross-origin external API requests (like Firebase / telemetry)
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) {
    return;
  }

  // API calls or dynamic saves should never be served stale
  if (req.url.includes('/api/') || req.url.includes('aspone') || req.url.includes('firebase')) {
    return;
  }

  // Pro HTML, skripty a styly preferujeme vždy síť bez mezilehlé HTTP cache, mezipaměť slouží jako offline záloha
  const fetchPromise = (req.mode === 'navigate' || req.url.includes('.js') || req.url.includes('.css'))
    ? fetch(req, { cache: 'no-cache' })
    : fetch(req);

  event.respondWith(
    fetchPromise
      .then((networkResponse) => {
        // Cache successful responses for local resources
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Network failed (offline) -> look up in cache
        return caches.match(req).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If HTML page failed, serve index.html
          if (req.mode === 'navigate') {
            return caches.match('./index.html');
          }
          return new Response('Offline - asset not cached', { status: 503, statusText: 'Offline' });
        });
      })
  );
});
