// Service Worker for Rainz Weather App with Infrastructure-Level Analytics
const VERSION = 'v4.0';
const CACHE_NAME = `rainz-weather-${VERSION}`;
const STATIC_CACHE = `rainz-static-${VERSION}`;

// Analytics configuration
const ANALYTICS_ENDPOINT = 'https://ohwtbkudpkfbakynikyj.supabase.co/functions/v1/track-analytics';
const ANALYTICS_BATCH_SIZE = 10;
const ANALYTICS_BATCH_TIMEOUT = 5000; // 5 seconds
let analyticsBatch = [];
let batchTimer = null;

// Generate session ID
const getSessionId = () => {
  let sessionId = self.sessionId;
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    self.sessionId = sessionId;
  }
  return sessionId;
};

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

// Send analytics batch
const sendAnalyticsBatch = async () => {
  if (analyticsBatch.length === 0) return;
  
  const batch = [...analyticsBatch];
  analyticsBatch = [];
  
  try {
    await fetch(ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ events: batch }),
    });
  } catch (error) {
    console.error('Failed to send analytics batch:', error);
  }
};

// Track analytics event
const trackAnalytics = (eventData) => {
  analyticsBatch.push(eventData);
  
  // Send batch if it reaches size limit
  if (analyticsBatch.length >= ANALYTICS_BATCH_SIZE) {
    clearTimeout(batchTimer);
    sendAnalyticsBatch();
  } else {
    // Reset timer
    clearTimeout(batchTimer);
    batchTimer = setTimeout(sendAnalyticsBatch, ANALYTICS_BATCH_TIMEOUT);
  }
};

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const startTime = Date.now();
  
  // Determine request type
  let requestType = 'other';
  if (url.hostname === self.location.hostname) {
    if (url.pathname === '/' || url.pathname.match(/^\/(weather|auth|admin)/)) {
      requestType = 'pageview';
    } else if (url.pathname.match(/\.(js|css|woff|woff2|ttf)$/)) {
      requestType = 'asset';
    } else if (url.pathname.match(/\.(jpg|jpeg|png|gif|svg|webp|ico)$/)) {
      requestType = 'image';
    } else {
      requestType = 'resource';
    }
  } else if (url.hostname.includes('supabase.co')) {
    if (url.pathname.includes('/rest/')) {
      requestType = 'api_database';
    } else if (url.pathname.includes('/functions/')) {
      requestType = 'api_function';
    } else if (url.pathname.includes('/storage/')) {
      requestType = 'api_storage';
    } else {
      requestType = 'api_other';
    }
  } else {
    requestType = 'external';
  }
  
  // Skip analytics tracking for analytics endpoint itself
  if (url.href.includes('track-analytics')) {
    return;
  }
  
  // Track the request
  const sessionId = getSessionId();
  
  // Handle the fetch
  if (event.request.method !== 'GET') {
    // Track non-GET requests but don't intercept
    trackAnalytics({
      event_type: requestType,
      page_path: url.pathname,
      session_id: sessionId,
      method: event.request.method,
      hostname: url.hostname,
      query: url.search,
    });
    return;
  }
  
  // Skip service worker for external API requests - let browser handle them
  if (url.hostname !== self.location.hostname) {
    // Track external requests but don't intercept
    trackAnalytics({
      event_type: requestType,
      page_path: url.pathname,
      session_id: sessionId,
      method: event.request.method,
      hostname: url.hostname,
      query: url.search,
    });
    return;
  }
  
  // ALWAYS fetch fresh - network-first for app resources
  event.respondWith(
    fetch(event.request, { 
      cache: 'no-store',
      headers: {
        ...event.request.headers,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
      .then((response) => {
        const duration = Date.now() - startTime;
        
        // Track successful request
        trackAnalytics({
          event_type: requestType,
          page_path: url.pathname,
          session_id: sessionId,
          method: event.request.method,
          hostname: url.hostname,
          status_code: response.status,
          duration_ms: duration,
          query: url.search,
        });
        
        // Don't cache anything - always fresh
        return response;
      })
      .catch((error) => {
        console.log('Fetch failed, trying cache:', error);
        
        // Track failed request
        trackAnalytics({
          event_type: requestType,
          page_path: url.pathname,
          session_id: sessionId,
          method: event.request.method,
          hostname: url.hostname,
          status_code: 0,
          error: error.message,
          query: url.search,
        });
        
        // Only fall back to cache if completely offline
        return caches.match(event.request);
      })
  );
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