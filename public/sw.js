const CACHE_NAME = "aiws-pwa-v2.2";
const PRECACHE_URLS = [
  "/",
  "/site.webmanifest",
  "/icon.svg",
  "/favicon.ico",
  "/android-chrome-192x192.png",
  "/android-chrome-512x512.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch(() => undefined)
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Never intercept non-GET requests or event-stream / range requests
  if (
    request.method !== "GET" ||
    request.headers.get("accept")?.includes("text/event-stream") ||
    request.headers.has("range")
  ) {
    return;
  }

  const url = new URL(request.url);

  // Only handle same-origin HTTP(S) requests; bypass all /api/* routes completely
  if (
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/webpack-hmr")
  ) {
    return;
  }

  // 1. Cache-First for immutable Next.js static chunks & icons
  const isImmutableStatic =
    url.pathname.startsWith("/_next/static/") ||
    /\.(?:png|svg|ico|webp|woff2?)$/i.test(url.pathname);

  if (isImmutableStatic) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
      )
    );
    return;
  }

  // 2. Network-First with cache fallback for HTML page navigations
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match("/"))
        )
    );
  }
});
