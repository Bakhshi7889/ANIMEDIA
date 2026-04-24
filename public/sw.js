const CACHE_NAME = 'animedia-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME && key !== 'tmdb-images').map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (!url.protocol.startsWith('http')) {
    return;
  }

  if (request.method !== 'GET') {
    return;
  }

  // Cache TMDB images using a cache-first strategy
  if (url.hostname === 'image.tmdb.org') {
    event.respondWith(
      caches.open('tmdb-images').then((cache) => {
        return cache.match(request).then((response) => {
          if (response) return response;
          return fetch(request, { mode: 'no-cors' }).then((networkResponse) => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          }).catch(() => {
            return new Response('', { status: 404 });
          });
        });
      })
    );
    return;
  }

  // For other requests, use stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const cacheCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, cacheCopy);
          });
        }
        return networkResponse;
      }).catch(() => null);
      
      return cachedResponse || fetchPromise || new Response('', { status: 404 });
    })
  );
});
