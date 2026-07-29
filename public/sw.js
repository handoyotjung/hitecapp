const CACHE_VERSION = 'v2-hitecapp-force-reload';
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
  // Pass through all requests - we just want to control caching via invalidation
  // If we wanted offline support, we'd add it here.
});
