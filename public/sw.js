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

  const { title, body, url, timestamp } = event.data.json();
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192.png',
      // O badge é o símbolo pequeno da barra de status, e o Android descarta a
      // cor dele: desenha só o canal alpha, em branco. Usar o ícone colorido
      // aqui dava uma bolinha branca sólida, porque o alpha dele é um quadrado
      // cheio. Este é o cacto sozinho, sem fundo.
      badge: '/icons/badge-96.png',
      data: { url },
      // When the customer actually wrote, not when the push arrived. Undefined
      // is treated as absent, and the browser then uses the delivery time —
      // which is what made a late push read as a brand-new message.
      timestamp,
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
