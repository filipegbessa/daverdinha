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
