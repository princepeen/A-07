/* ============================================================
   SERVICE-WORKER.JS
   Birthday PWA for Ashu
   Strategy:
   - Shell (HTML/CSS/JS/fonts) → Cache First
   - Images → Cache First, fallback to network
   - Audio → Network First (large files, stream better)
   - Everything else → Network First, fallback to cache
   ============================================================ */

const CACHE_NAME    = 'ashu-v2';
const AUDIO_CACHE   = 'ashu-audio-v2';
const IMG_CACHE     = 'ashu-img-v2';

/* Files to pre-cache on install (the app shell) */
const SHELL = [
  '/',
  '/index.html',
  '/password.html',
  '/home.html',
  '/timeline.html',
  '/letters.html',
  '/music.html',
  '/dateideas.html',
  '/surprise.html',
  '/css/style.css',
  '/css/animations.css',
  '/js/app.js',
  '/js/stars.js',
  '/js/counter.js',
  '/js/home.js',
  '/js/music.js',
  '/js/dateideas.js',
  /* Google Fonts are handled separately — cached on first fetch */
];

/* ── Install: pre-cache shell ── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

/* ── Activate: clean old caches ── */
self.addEventListener('activate', event => {
  const VALID = [CACHE_NAME, AUDIO_CACHE, IMG_CACHE];
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => !VALID.includes(k))
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

/* ── Fetch: routing strategies ── */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  /* Skip non-GET and cross-origin (except Google Fonts) */
  if (request.method !== 'GET') return;

  /* ── Google Fonts: cache first ── */
  if (url.origin === 'https://fonts.googleapis.com' ||
      url.origin === 'https://fonts.gstatic.com') {
    event.respondWith(cacheFirst(request, CACHE_NAME));
    return;
  }

  /* ── Audio files: network first, cache fallback ── */
  if (url.pathname.startsWith('/audio/')) {
    event.respondWith(networkFirst(request, AUDIO_CACHE));
    return;
  }

  /* ── Images: cache first ── */
  if (url.pathname.startsWith('/img/')) {
    event.respondWith(cacheFirst(request, IMG_CACHE));
    return;
  }

  /* ── App shell (HTML/CSS/JS): cache first ── */
  if (
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.css')  ||
    url.pathname.endsWith('.js')   ||
    url.pathname === '/'
  ) {
    event.respondWith(cacheFirst(request, CACHE_NAME));
    return;
  }

  /* ── Everything else: network first ── */
  event.respondWith(networkFirst(request, CACHE_NAME));
});

/* ══ Strategy helpers ══════════════════════════════════════ */

async function cacheFirst(request, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response && response.status === 200 && response.type !== 'opaque') {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    /* offline and not cached — return nothing gracefully */
    return new Response('', { status: 408, statusText: 'Offline' });
  }
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response && response.status === 200 && response.type !== 'opaque') {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response('', { status: 408, statusText: 'Offline' });
  }
}
