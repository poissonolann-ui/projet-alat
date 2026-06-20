/* ============================================================
   ACHIEVE — Utilitaires de mouvement (vanilla)
   - Détection prefers-reduced-motion (réactive)
   - Révélations au scroll (IntersectionObserver) : fade + translate
   N'anime que transform / opacity. Listeners passifs.
   ============================================================ */

const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
export function prefersReducedMotion() {
  return mq.matches;
}

/* Révélations : ajoute .is-in aux éléments [data-reveal] quand ils
   entrent dans le viewport. En reduced-motion, tout est révélé direct. */
export function initReveals(root = document) {
  const items = root.querySelectorAll("[data-reveal]");
  if (!items.length) return;

  if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-in"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = el.dataset.revealDelay || 0;
          el.style.transitionDelay = `${delay}ms`;
          el.classList.add("is-in");
          io.unobserve(el);
        }
      });
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
  );

  items.forEach((el) => io.observe(el));
}

/* rAF throttle générique pour les handlers de scroll. */
export function rafThrottle(fn) {
  let ticking = false;
  return function (...args) {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      fn.apply(this, args);
      ticking = false;
    });
  };
}

/* Anime un nombre de from→to (ex : compteurs). Coupé si reduced-motion. */
export function animateValue(from, to, duration, onUpdate, onDone) {
  if (prefersReducedMotion()) {
    onUpdate(to);
    onDone && onDone();
    return;
  }
  const start = performance.now();
  function frame(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
    onUpdate(from + (to - from) * eased);
    if (t < 1) requestAnimationFrame(frame);
    else onDone && onDone();
  }
  requestAnimationFrame(frame);
}
