const CACHE_NAME = 'kidesky-cache-v1.9.74';
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
  './js/i18n/languages.js',
  './js/core/module-loader.js',
  './js/i18n/cs.js',
  './js/i18n/en.js',
  './js/i18n/sk.js',
  './js/i18n/pl.js',
  './js/i18n/rules-cs.js',
  './js/i18n/rules-en.js',
  './js/i18n/rules-sk.js',
  './js/i18n/rules-pl.js',
  './js/app-i18n.js',
  './js/game-data.js',
  './js/boards/boards-decor-catalog.js',
  './js/boards/boards-geometry.js',
  './js/boards/boards-generator.js',
  './js/boards/boards-builder.js',
  './js/boards/boards-presets.js',
  './js/engine/engine-state.js',
  './js/engine/engine-movement.js',
  './js/engine/engine-economy.js',
  './js/engine/engine-actions.js',
  './js/game-combat-ai.js',
  './js/app-audio.js',
  './js/app-dialog.js',
  './js/app-api.js',
  './js/app-modal-manager.js',
  './js/app.js',
  './js/app/app-music-ui.js',
  './js/app/app-landing.js',
  './js/app/app-profile-cosmetics.js',
  './js/app/app-lobby-session.js',
  './js/app/app-map-studio.js',
  './js/board/board-camera.js',
  './js/board/board-rivers.js',
  './js/board/board-terrain.js',
  './js/board/board-static-svg.js',
  './js/board/board-tokens.js',
  './js/board/board-ambient.js',
  './js/hud/hud-mobile-dock.js',
  './js/hud/hud-inspector.js',
  './js/hud/hud-advisor.js',
  './js/hud/hud-action-panel.js',
  './js/hud/hud-turn-actions.js',
  './js/modals/modal-victory-diploma.js',
  './js/modals/modal-armory.js',
  './js/modals/modal-combat.js',
  './js/modals/modal-festival-chance.js',
  './js/modals/modal-cheatsheet.js',
  './js/app-online.js',
  './js/app-saves.js',
  './js/app-map-editor.js',
  './js/app-catalog.js',
  './js/app-rules-guide.js',
  './js/app-admin.js',
  './js/app-musicwidget.js',
  './assets/terrain/grass.webp',
  './assets/terrain/meadow.webp',
  './assets/terrain/forest_floor.webp',
  './assets/terrain/rock.webp',
  './assets/terrain/dirt.webp',
  './assets/terrain/ash.webp',
  './assets/terrain/snow.webp',
  './assets/terrain/mist.webp'
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
