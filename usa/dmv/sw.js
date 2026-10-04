/* ToolKu DMV 工具离线缓存：4 个 DMV 页面 + 共享资源 */
const CACHE = "toolku-dmv-v2";
const SHELL = [
  "./",
  "./6-points-calculator.html",
  "./real-id-checker.html",
  "./real-id-vs-standard-vs-enhanced.html",
  "./document-checker.html",
  "./manifest.json",
  "../../css/site.css",
  "../../css/usa-tools.css",
  "../../css/dmv-tools.css",
  "../../css/dmv-6-points.css",
  "../../css/dmv-real-id-checker.css",
  "../../css/dmv-id-comparison.css",
  "../../css/dmv-document-checker.css",
  "../../css/engage.css",
  "../../js/usa/dmv-6-points.js",
  "../../js/usa/dmv-real-id-checker.js",
  "../../js/usa/dmv-id-comparison.js",
  "../../js/usa/dmv-document-checker.js",
  "../../js/toolku-engage.js",
  "../../js/openaa-referral.js",
  "../../favicon.svg",
  "../../favicon.ico",
  "../../favicon/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("toolku-dmv-") && key !== CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (
    request.method !== "GET" ||
    new URL(request.url).origin !== self.location.origin
  )
    return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((res) => res || caches.match("./6-points-calculator.html"))),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      });
      return cached || network;
    }),
  );
});
