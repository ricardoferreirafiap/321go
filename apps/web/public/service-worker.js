const CACHE_NAME = "portal-web-offline-v1";
const APP_SHELL_URLS = ["/", "/index.html", "/logo.png"];

async function cacheAppShell() {
  const cache = await caches.open(CACHE_NAME);

  for (const url of APP_SHELL_URLS) {
    try {
      const response = await fetch(url, { cache: "no-cache" });
      if (response.ok) {
        await cache.put(url, response.clone());
      }

      if (url === "/" && response.ok) {
        const html = await response.text();
        const assetUrls = Array.from(html.matchAll(/(?:src|href)="([^"]+)"/g))
          .map((match) => match[1])
          .filter((assetUrl) => assetUrl.startsWith("/"));

        await Promise.allSettled(
          assetUrls.map(async (assetUrl) => {
            const assetResponse = await fetch(assetUrl);
            if (assetResponse.ok) {
              await cache.put(assetUrl, assetResponse);
            }
          }),
        );
      }
    } catch {
      // A previous application shell remains available if installation is offline.
    }
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(cacheAppShell().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.origin === self.location.origin && url.pathname.startsWith("/api/")) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put("/index.html", response.clone());
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          return (
            (await cache.match("/index.html")) ||
            (await cache.match("/")) ||
            new Response("Aplicativo indisponível offline.", {
              status: 503,
              headers: { "Content-Type": "text/plain; charset=utf-8" },
            })
          );
        }),
    );
    return;
  }

  const isStaticAsset =
    url.origin === self.location.origin ||
    request.destination === "image" ||
    request.destination === "font";

  if (!isStaticAsset) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const networkResponse = fetch(request)
        .then(async (response) => {
          if (response.ok || response.type === "opaque") {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, response.clone());
          }
          return response;
        })
        .catch(() => cachedResponse);

      return cachedResponse || networkResponse;
    }),
  );
});
