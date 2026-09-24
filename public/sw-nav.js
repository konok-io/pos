// Navigation: network-first with retry; offline.html ONLY when still failing
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (req.mode !== 'navigate' && req.destination !== 'document') return;
  if (req.url.includes('/api/')) return;
  event.respondWith(
    (async () => {
      try {
        return await fetch(req);
      } catch (e) {
        // Browser thinks we are online — retry once before showing offline
        if (self.navigator && self.navigator.onLine) {
          try {
            await new Promise((r) => setTimeout(r, 400));
            return await fetch(req);
          } catch (e2) { /* fall through */ }
        }
        const cached = await caches.match('/offline.html');
        return cached || new Response('Offline', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' }
        });
      }
    })()
  );
});
