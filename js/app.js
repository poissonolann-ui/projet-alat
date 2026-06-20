/* ============================================================
   ACHIEVE — Boot partagé des écrans applicatifs
   - Enregistre le service worker (hors-ligne)
   - Monte le menu discret
   - Initialise les révélations au scroll
   - Header retour réutilisable
   ============================================================ */

import { mountMenu } from "./menu.js";
import { initReveals } from "./lib/motion.js";

/* Enregistrement du service worker (hors dev file://). */
export function registerSW() {
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("service-worker.js").catch(() => {});
    });
  }
}

/* En-tête applicatif standard (titre + bouton retour). */
export function mountHeader(title, eyebrow, backHref = "today.html") {
  const header = document.querySelector("[data-app-header]");
  if (!header) return;
  header.classList.add("app-header");
  header.innerHTML = `
    <a class="back" href="${backHref}" aria-label="Retour">
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
    </a>
    <div>
      ${eyebrow ? `<p class="eyebrow">${eyebrow}</p>` : ""}
      <h1>${title}</h1>
    </div>
    <div class="spacer"></div>
  `;
}

export function boot() {
  registerSW();
  mountMenu();
  initReveals();
}
