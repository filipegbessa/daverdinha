// Minimal service worker: exists only to make the app installable as a PWA
// today. Push notification handling (the actual point of this file) is
// planned separately — see docs/superpowers/plans/2026-09-14-daverdinha-admin-push-notifications.md.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  // No caching strategy on purpose — the admin always needs fresh data,
  // and there's no offline mode. This handler only needs to exist for
  // installability.
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  const { title, body, url } = event.data.json();
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/admin';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => client.url.endsWith(url));
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    }),
  );
});
