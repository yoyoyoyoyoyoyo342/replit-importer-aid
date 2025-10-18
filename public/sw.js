// Service Worker for Rainz Weather App
const VERSION = 'v3.0';
const CACHE_NAME = `rainz-weather-${VERSION}`;
const STATIC_CACHE = `rainz-static-${VERSION}`;

self.addEventListener('install', (event) => {
  console.log(`Service Worker ${VERSION} installing...`);
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(['/logo.png', '/favicon.ico']))
      .then(() => self.skipWaiting()) // Force immediate activation
  );
});

self.addEventListener('activate', (event) => {
  console.log(`Service Worker ${VERSION} activating...`);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      // Delete ALL old caches
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Force all clients to be claimed by this new service worker
      return self.clients.claim();
    }).then(() => {
      // Force reload all clients to get fresh content
      return self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'FORCE_RELOAD' });
        });
      });
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  
  // Always fetch fresh for HTML, JS, CSS, and API calls
  if (url.pathname.endsWith('.html') || 
      url.pathname.endsWith('.js') || 
      url.pathname.endsWith('.css') ||
      url.pathname === '/' ||
      url.pathname.startsWith('/assets/') ||
      url.hostname.includes('supabase') ||
      url.hostname.includes('open-meteo')) {
    
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then((response) => {
          // Only cache successful responses
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch((error) => {
          console.log('Fetch failed, trying cache:', error);
          // Fall back to cache only if offline
          return caches.match(event.request);
        })
    );
  } else {
    // Cache-first for static assets like images
    event.respondWith(
      caches.match(event.request)
        .then((response) => response || fetch(event.request))
    );
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If app is already open, focus on it
        for (const client of clientList) {
          if (client.url === self.registration.scope && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow('/');
        }
      })
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
});

// Handle background sync for notifications
self.addEventListener('sync', (event) => {
  if (event.tag === 'weather-sync') {
    event.waitUntil(
      // Perform background weather data sync
      console.log('Background sync triggered for weather data')
    );
  }
});

console.log('Rainz Service Worker loaded successfully');