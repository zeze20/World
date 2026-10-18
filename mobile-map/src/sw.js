/* Service Worker — Workbox CDN */
importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/7.1.0/workbox-sw.js"
);

const { precacheAndRoute } = workbox.precaching;
const { registerRoute } = workbox.routing;
const { StaleWhileRevalidate, NetworkFirst, CacheFirst } = workbox.strategies;
const { ExpirationPlugin } = workbox.expiration;
const { CacheableResponsePlugin } = workbox.cacheableResponse;

self.skipWaiting();
workbox.core.clientsClaim();

precacheAndRoute([
  { url: "/index.html", revision: "1" },
  { url: "/src/styles.css", revision: "1" },
  { url: "/src/map.js", revision: "1" },
  { url: "/src/popup.js", revision: "1" },
  { url: "/src/filter.js", revision: "1" },
  { url: "/public/data/turkiye_savunma_sistemleri.geojson", revision: "2" },
  { url: "/public/manifest.webmanifest", revision: "1" },
]);

registerRoute(
  ({ url }) => url.hostname.includes("tile.openstreetmap.org"),
  new StaleWhileRevalidate({
    cacheName: "osm-tiles",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 }),
    ],
  })
);

registerRoute(
  ({ url }) => url.pathname.endsWith(".geojson"),
  new NetworkFirst({
    cacheName: "geojson-data",
    networkTimeoutSeconds: 5,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 3600 }),
    ],
  })
);

registerRoute(
  ({ url }) =>
    url.hostname.includes("unpkg.com") ||
    url.hostname.includes("cdn.jsdelivr.net"),
  new CacheFirst({
    cacheName: "cdn-assets",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 7 * 24 * 60 * 60 }),
    ],
  })
);

self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("/index.html"))
    );
  }
});
