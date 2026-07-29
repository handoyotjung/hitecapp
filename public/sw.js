self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('[SW Kill-Switch] Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      self.clients.claim();
      // Unregister this worker completely to restore native browser networking
      self.registration.unregister();
    })
  );
});

// DO NOT include a 'fetch' event listener. Let the browser handle network natively.
