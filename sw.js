 // A simple service worker for PWA functionality

const CACHE_NAME = 'pravej-study-tracker-v3';
const urlsToCache = [
  '/',
  '/index.html',
  // आप यहां अन्य महत्वपूर्ण फाइलें (जैसे CSS, JS) भी जोड़ सकते हैं
];

// Install a service worker
self.addEventListener('install', event => {
  self.skipWaiting(); // Force activate new service worker
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Cache and return requests with Network First Strategy
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(function(networkResponse) {
        // Optimization: clone the response and cache it
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(function() {
        // If network fails, try cache
        return caches.match(event.request);
      })
  );
});

// Update a service worker
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});