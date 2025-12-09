// --- RAYEN PREMIUM SERVICE WORKER: V7.0 (Performance Optimized) ---
const CACHE_NAME = 'rayen-study-tracker-v7-premium';

// GitHub Pages Safe Paths
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

// 1. INSTALL: Cache Critical Assets & Take Control
self.addEventListener('install', event => {
    console.log('[Rayen SW] Installing Service Worker...');
    self.skipWaiting(); // Forces the new SW to activate immediately

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[Rayen SW] Caching core assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .catch(err => console.error('[Rayen SW] Cache Error:', err))
    );
});

// 2. ACTIVATE: Cleanup Old Caches (Removes old Pravej data)
self.addEventListener('activate', event => {
    console.log('[Rayen SW] Activating & Cleaning old caches...');
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    // Delete any cache that doesn't match the current premium version
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Rayen SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('[Rayen SW] Now controlling the page.');
            return self.clients.claim(); // Take control of all clients immediately
        })
    );
});

// 3. FETCH: Stale-While-Revalidate Strategy (Fastest User Experience)
// This serves from cache instantly, then updates in the background.
self.addEventListener('fetch', event => {
    
    // HTML Navigation: Network First (to get fresh updates), fallback to Cache
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then(networkResponse => {
                    return caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                })
                .catch(() => caches.match('./index.html')) // Offline fallback
        );
        return;
    }

    // Assets (Images, JS, CSS): Cache First, fallback to Network
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            // Return cached response immediately if found
            if (cachedResponse) {
                return cachedResponse;
            }

            // Otherwise fetch from network
            return fetch(event.request).then(networkResponse => {
                // Don't cache invalid responses
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse;
                }

                // Cache the new asset for next time
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseToCache);
                });

                return networkResponse;
            });
        })
    );
});