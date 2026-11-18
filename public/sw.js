/* LumiNest offline shell + update manager.
 *
 * v6 changes that matter:
 * - Navigation HTML is NO LONGER cached. A cached HTML document references
 *   /_next/static/chunks/<hash>.js files that Vercel deletes on the next
 *   deploy. Serving that stale HTML produced a permanent white screen (the
 *   app could not hydrate because its chunks 404'd). Online navigation now
 *   always hits the network, so the document and its chunks always match.
 * - Offline now falls back to the dedicated /offline page rather than a
 *   possibly-broken cached app page.
 * - Install never aborts on one missing asset.
 */
const CACHE_NAME = "luminest-shell-v7";
const OFFLINE_URL = "/offline";

const PRECACHE = [
  OFFLINE_URL,
  "/open",
  "/manifest.json",
  "/branding/luminest-icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/apple-touch-icon.png",
  "/mascot/states/welcome.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await Promise.all(
        PRECACHE.map((url) =>
          cache.add(new Request(url, { cache: "reload" })).catch(() => undefined)
        )
      );
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/") ||
    url.pathname.startsWith("/s/")
  ) {
    return;
  }

  // Navigations: network only. This is the fix for the white screen.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const offline = await caches.match(OFFLINE_URL);
        if (offline) return offline;
        return new Response(
          "<!doctype html><meta charset=utf-8><meta name=viewport content='width=device-width,initial-scale=1'>" +
            "<title>LumiNest</title><body style='font-family:system-ui;padding:2rem;text-align:center'>" +
            "<h1>You are offline</h1><p>Reconnect, then reopen LumiNest.</p></body>",
          { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
        );
      })
    );
    return;
  }

  const cacheable =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/branding/") ||
    url.pathname.startsWith("/mascot/") ||
    url.pathname === "/manifest.json" ||
    url.pathname === "/pdf.worker.min.mjs";

  if (!cacheable) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
