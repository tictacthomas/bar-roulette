// Bar Roulette service worker: lets the app open instantly and work without signal.
// Always tries the network first so updates you upload show up right away,
// and falls back to the saved copy when offline.
const CACHE = "site-v2";
const SHELL = ["./", "index.html", "bar.html", "mafia.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];

self.addEventListener("install", ev => {
  ev.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", ev => {
  ev.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", ev => {
  const req = ev.request;
  const url = new URL(req.url);
  // Only handle this site's own files; map servers, fonts and Google Maps go straight to the network.
  if (req.method !== "GET" || url.origin !== self.location.origin) return;
  ev.respondWith(
    fetch(req)
      .then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req).then(hit => hit || caches.match("./")))
  );
});
