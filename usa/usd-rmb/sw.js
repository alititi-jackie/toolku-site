const CACHE_NAME = 'toolku-usd-rmb-v3';
const CORE_ASSETS = ['./'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('toolku-usd-rmb-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const acceptsHtml = request.headers.get('accept')?.includes('text/html');

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
      const response = await fetch(request);
      if (response.ok && (acceptsHtml || ['style','script','image','font'].includes(request.destination))) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone()).catch(() => undefined);
      }
      return response;
    } catch (error) {
      // Only HTML navigations fall back to the cached app shell. API/assets
      // must not receive an unrelated HTML document when the network fails.
      if (acceptsHtml) {
        const fallback = await caches.match('./');
        if (fallback) return fallback;
      }
      return new Response('Network unavailable', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {'Content-Type': 'text/plain; charset=utf-8'}
      });
    }
  })());
});
