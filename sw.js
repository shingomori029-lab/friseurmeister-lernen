// Offline-Unterstützung: zuerst das Netz (damit Änderungen sofort ankommen),
// ohne Verbindung die zuletzt geladene Fassung aus dem Cache.
const CACHE = "fm-v2";
const ASSETS = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "icon.svg",
  "css/app.css",
  "js/registry.js",
  "js/data/teil2a.js",
  "js/data/teil2b.js",
  "js/data/teil3.js",
  "js/data/teil4.js",
  "js/data/cards.js",
  "js/store.js",
  "js/app.js",
  "js/views/home.js",
  "js/views/quiz.js",
  "js/views/cards.js",
  "js/views/exam.js",
  "js/views/stats.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  // cache: "no-cache" fragt beim Server nach (304, wenn unverändert). Sonst liefert der
  // HTTP-Cache des Browsers einzelne alte Dateien, und alte und neue Skripte mischen sich.
  e.respondWith(
    fetch(e.request.url, { cache: "no-cache" })
      .then((res) => {
        if (!res.ok) return res;
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
