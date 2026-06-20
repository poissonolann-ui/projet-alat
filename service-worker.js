/* ============================================================
   ACHIEVE — Service Worker (hors-ligne complet)
   - Précache l'app shell (HTML, CSS, JS, données, polices, silhouettes)
   - Stratégie : cache-first pour les assets, network-first pour la nav
   Aucune requête tierce en usage normal.
   ============================================================ */

const VERSION = "achieve-v1.0.0";
const CACHE = VERSION;

/* App shell à précacher (tout ce qu'il faut pour démarrer hors-ligne). */
const PRECACHE = [
  "/", "/index.html",
  "/today.html", "/planning.html", "/session.html",
  "/nutrition.html", "/hangar.html", "/tracking.html",
  "/manifest.webmanifest",

  // CSS
  "/css/tokens.css", "/css/fonts.css", "/css/base.css",
  "/css/hud.css", "/css/app.css", "/css/home.css",

  // JS libs
  "/js/lib/store.js", "/js/lib/pace.js", "/js/lib/date.js",
  "/js/lib/schedule.js", "/js/lib/motion.js",
  "/js/app.js", "/js/menu.js", "/js/home.js",
  "/js/planning.js", "/js/session.js", "/js/today.js",
  "/js/nutrition.js", "/js/tracking.js", "/js/hangar.js",

  // Données
  "/data/profile.js", "/data/exercises.js", "/data/weekTemplate.js",
  "/data/running.js", "/data/nutrition.js", "/data/aircraft.js",

  // Silhouettes & visuels
  "/aircraft/rafale.svg", "/aircraft/mirage2000.svg",
  "/aircraft/caiman.svg", "/aircraft/tigre.svg", "/aircraft/mrtt.svg",
  "/aircraft/rafale-solo-climb.webp", "/aircraft/rafale-solo-bank.webp",

  // Icônes
  "/icons/icon-192.png", "/icons/icon-512.png",
  "/icons/apple-touch-icon.png", "/icons/favicon-32.png",

  // Polices (latin)
  "/fonts/saira-300-latin.woff2", "/fonts/saira-400-latin.woff2", "/fonts/saira-500-latin.woff2",
  "/fonts/saira-semicondensed-500-latin.woff2", "/fonts/saira-semicondensed-600-latin.woff2", "/fonts/saira-semicondensed-700-latin.woff2",
  "/fonts/jetbrains-mono-400-latin.woff2", "/fonts/jetbrains-mono-500-latin.woff2", "/fonts/jetbrains-mono-700-latin.woff2",

  // Vendor (cinématique accueil)
  "/js/vendor/gsap.min.js", "/js/vendor/ScrollTrigger.min.js", "/js/vendor/lenis.min.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      // addAll échoue si un seul asset manque : on tolère les absents.
      Promise.allSettled(PRECACHE.map((url) => cache.add(url)))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // On ne gère que le même origine.
  if (url.origin !== self.location.origin) return;

  // Navigation : network-first, fallback cache (app shell).
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match("/index.html")))
    );
    return;
  }

  // Assets : cache-first, puis réseau (et on met en cache au passage).
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((res) => {
        if (res && res.status === 200 && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
