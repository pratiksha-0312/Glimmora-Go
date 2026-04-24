// Glimmora Go — Partner PWA service worker
// Scope is limited to /p/ (set via Service-Worker-Allowed header in next.config.js).
// Strategy:
//   - Static assets (_next/static, icons): cache-first
//   - API under /api/partner/*: network-first with short cache fallback for GETs
//   - Navigations inside /p/*: network-first with offline fallback
//   - Everything else (e.g. /api/track/*, admin): bypass

const VERSION = "v2";
const STATIC_CACHE = `glimmora-partner-static-${VERSION}`;
const RUNTIME_CACHE = `glimmora-partner-runtime-${VERSION}`;
const OFFLINE_URL = "/offline.html";

const PRECACHE = [
  OFFLINE_URL,
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE).catch(() => null))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== RUNTIME_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.webmanifest"
  );
}

function isPartnerNavigation(request, url) {
  return (
    request.mode === "navigate" &&
    (url.pathname === "/p" || url.pathname.startsWith("/p/"))
  );
}

function isPartnerApi(url) {
  return url.pathname.startsWith("/api/partner/");
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(STATIC_CACHE).then((c) => c.put(request, copy));
            return res;
          })
      )
    );
    return;
  }

  if (isPartnerApi(url)) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  if (isPartnerNavigation(request, url)) {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_URL).then(
          (cached) =>
            cached ||
            new Response("Offline", {
              status: 503,
              headers: { "Content-Type": "text/plain" },
            })
        )
      )
    );
  }
});
