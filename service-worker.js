/* ============================================================
   SERVICE WORKER (GitHub Pages SAFE)
   Base path: /A-07/
   ============================================================ */

const BASE = "/A-07";

const CACHE_NAME  = "ashu-v6";
const IMG_CACHE   = "ashu-img-v6";
const AUDIO_CACHE = "ashu-audio-v6";

/* Core app shell (minimal = install-safe) */
const CORE = [
  BASE + "/",
  BASE + "/index.html",
  BASE + "/manifest.json",
  BASE + "/css/style.css",
  BASE + "/js/app.js"
];

/* ── INSTALL ── */
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      // safer than addAll → prevents total failure on one bad file
      for (const url of CORE) {
        try {
          const res = await fetch(url);
          if (res.ok) await cache.put(url, res.clone());
        } catch (e) {
          // ignore failures (important for install success)
        }
      }
    }).then(() => self.skipWaiting())
  );
});

/* ── ACTIVATE ── */
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(k => {
          if (![CACHE_NAME, IMG_CACHE, AUDIO_CACHE].includes(k)) {
            return caches.delete(k);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

/* ── FETCH ── */
self.addEventListener("fetch", event => {
  const req = event.request;

  if (req.method !== "GET") return;

  const url = new URL(req.url);

  /* Images */
  if (url.pathname.startsWith(BASE + "/img/")) {
    event.respondWith(cacheFirst(req, IMG_CACHE));
    return;
  }

  /* Audio */
  if (url.pathname.startsWith(BASE + "/audio/")) {
    event.respondWith(networkFirst(req, AUDIO_CACHE));
    return;
  }

  /* HTML/CSS/JS */
  if (
    url.pathname.endsWith(".html") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js") ||
    url.pathname === BASE + "/"
  ) {
    event.respondWith(cacheFirst(req, CACHE_NAME));
    return;
  }

  /* fallback */
  event.respondWith(networkFirst(req, CACHE_NAME));
});

/* ── STRATEGIES ── */

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) return cached;

  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    return new Response("Offline", { status: 408 });
  }
}

async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    const cached = await cache.match(req);
    return cached || new Response("Offline", { status: 408 });
  }
}
