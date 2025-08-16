// Service Worker for push notifications
const CACHE_NAME = 'weather-app-v1';

self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'view' || !event.action) {
    // Open the app when notification is clicked
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clientList) => {
        // If app is already open, focus on it
        for (const client of clientList) {
          if (client.url === self.location.origin + '/' && 'focus' in client) {
            return client.focus();
          }
        }
        // If app is not open, open it
        if (self.clients.openWindow) {
          return self.clients.openWindow('/');
        }
      })
    );
  }
});

self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
});

// Handle background sync for offline notification scheduling
self.addEventListener('sync', (event) => {
  if (event.tag === 'weather-notification') {
    event.waitUntil(
      // Logic for sending notifications when back online
      console.log('Background sync triggered for weather notifications')
    );
  }
});