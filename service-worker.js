const CACHE_NAME = 'kidesky-cache-v1.9.42';
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
  './js/i18n/cs.js',
  './js/i18n/en.js',
  './js/app-i18n.js',
  './js/game-data.js',
  './js/game-boards.js',
  './js/game-engine.js',
  './js/game-combat-ai.js',
  './js/app-audio.js',
  './js/app-dialog.js',
  './js/app-api.js',
  './js/app.js',
  './js/app-board.js',
  './js/app-hud.js',
  './js/app-modals.js',
  './js/app-online.js',
  './js/app-saves.js',
  './js/app-map-editor.js',
  './js/app-catalog.js',
  './js/app-rules-guide.js',
  './js/app-admin.js',
  './js/app-musicwidget.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Best-effort pre-cache all core assets resiliently
      return Promise.allSettled(
        CORE_ASSETS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('[SW] Core asset pre-caching partial warning for:', url, err);
          })
        )
      );
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
          return null;
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') {
    return;
  }

  let url;
  try {
    url = new URL(req.url);
  } catch (e) {
    return;
  }

  // Ignore cross-origin external requests
  if (url.origin !== self.location.origin) {
    return;
  }

  const pathLower = url.pathname.toLowerCase();

  // API calls, dynamic handlers or remote dynamic hosts should never be cached or served stale
  if (
    pathLower.includes('api.ashx') ||
    pathLower.includes('/api/') ||
    url.hostname.includes('aspone') ||
    url.hostname.includes('firebase')
  ) {
    return;
  }

  // Bypass Range requests and large audio/video media streams
  if (
    req.headers.has('range') ||
    pathLower.includes('/assets/video/') ||
    pathLower.includes('/assets/audio/') ||
    /\.(mp4|webm|mov|mp3|wav|ogg|m4a)$/.test(pathLower)
  ) {
    return;
  }

  // Static images: Stale-While-Revalidate
  if (/\.(png|jpe?g|webp|gif|svg|ico)$/.test(pathLower)) {
    const cacheMatchPromise = caches.match(req).then((c) => c || caches.match(req, { ignoreSearch: true }));
    const networkUpdatePromise = fetch(req).then((networkResponse) => {
      if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
        const responseToCache = networkResponse.clone();
        return caches.open(CACHE_NAME)
          .then((cache) => cache.put(req, responseToCache))
          .catch(() => {})
          .then(() => networkResponse);
      }
      return networkResponse;
    });

    event.waitUntil(networkUpdatePromise.catch(() => {}));
    event.respondWith(
      cacheMatchPromise.then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return networkUpdatePromise.catch(() =>
          new Response('Offline - asset not cached', { status: 503, statusText: 'Offline' })
        );
      })
    );
    return;
  }

  // HTML navigations, JS, CSS, JSON: Network-First with cache fallback (ignoring ?v= on offline hit)
  const fetchPromise = (
    req.mode === 'navigate' ||
    pathLower.endsWith('.js') ||
    pathLower.endsWith('.css') ||
    pathLower.endsWith('.json')
  )
    ? fetch(req, { cache: 'no-cache' })
    : fetch(req);

  event.respondWith(
    fetchPromise
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          const cacheWrite = caches.open(CACHE_NAME)
            .then((cache) => cache.put(req, responseToCache))
            .catch(() => {});
          try {
            event.waitUntil(cacheWrite);
          } catch (e) {}
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(req)
          .then((cachedResponse) => cachedResponse || caches.match(req, { ignoreSearch: true }))
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            if (req.mode === 'navigate') {
              return caches.match('./index.html', { ignoreSearch: true });
            }
            return new Response('Offline - asset not cached', { status: 503, statusText: 'Offline' });
          });
      })
  );
});
