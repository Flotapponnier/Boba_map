const CACHE_NAME = 'boba-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/boba-mascot.png'
];

// Install: Pre-cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Cache-first for static assets, network-first for others
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and external URLs
  if (request.method !== 'GET' || url.origin !== location.origin) {
    return;
  }

  // Skip API routes - always go to network
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Cache-first strategy for static assets (not the root HTML)
  if (
    url.pathname.match(/\.(js|css|woff2?|png|jpg|jpeg|svg|gif|webp|ico)$/) ||
    url.pathname === '/manifest.json'
  ) {
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) {
          return response;
        }
        return fetch(request).then((fetchResponse) => {
          // Only cache successful same-origin responses
          if (!fetchResponse ||
              (!fetchResponse.ok && fetchResponse.type !== 'opaque')) {
            return fetchResponse;
          }
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, fetchResponse.clone());
            return fetchResponse;
          });
        });
      })
    );
  }
});
