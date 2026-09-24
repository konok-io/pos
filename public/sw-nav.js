// Navigation: always try network first; offline.html ONLY when network fails
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (req.mode !== 'navigate' && req.destination !== 'document') return;
  // Let API pass through (Workbox NetworkOnly also handles /api/)
  if (req.url.includes('/api/')) return;
  event.respondWith(
    fetch(req).then((res) => res).catch(() =>
      caches.match('/offline.html').then((cached) =>
        cached || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } })
      )
    )
  );
});
