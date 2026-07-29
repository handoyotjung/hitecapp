const CACHE_VERSION = 'v3-hitecapp-recovery';
const CACHE_KEYS_TO_KEEP = [CACHE_VERSION];

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!CACHE_KEYS_TO_KEEP.includes(cacheName)) {
            console.log('SW: Deleting old legacy cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Always fall back to network immediately to prevent interception failures
  event.respondWith(fetch(event.request).catch(() => {
    // If network fails, return nothing (or handle offline mode)
    return new Response();
  }));
});
