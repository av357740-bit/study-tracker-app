// --- SERVICE WORKER: V6 (Crash Fix & Auto Update) ---
const CACHE_NAME = 'pravej-study-tracker-v6-stable';

// Relative paths are safer for GitHub Pages (./ instead of /)
const URLS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json'
];

// 1. INSTALL: Cache core files & Force activation
self.addEventListener('install', event => {
    self.skipWaiting(); // Forces this new SW to take control immediately
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(URLS_TO_CACHE);
            })
            .catch(err => console.error('Cache addAll error:', err))
    );
});

// 2. ACTIVATE: Delete OLD caches to prevent Crash due to mismatched versions
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName); // Wipe old data
                    }
                })
            );
        }).then(() => {
            console.log('Service Worker Activated & Claiming Clients');
            return self.clients.claim(); // Take control of all open tabs
        })
    );
});

// 3. FETCH: Network First Strategy for HTML (Prevents loading old buggy code)
self.addEventListener('fetch', event => {
    
    // For the HTML page (Navigation), always try Network first
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then(networkResponse => {
                    // Update cache with the new fresh version
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                    return networkResponse;
                })
                .catch(() => {
                    // If offline, use cached version
                    return caches.match('./index.html');
                })
        );
        return;
    }

    // For other assets (images, scripts), try Cache first, then Network
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});