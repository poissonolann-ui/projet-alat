/* ============================================================
   ACHIEVE — Chrome partagé (Top Gun)
   - Service worker (hors-ligne)
   - Logo avion = bouton ACCUEIL (toutes pages)
   - Barre d'onglets basse à 3 entrées (SUIVI · PILOTAGE · RAVITO)
   - Réticule HUD (souris + doigt)
   - En-tête retour pour les écrans profonds (séance, plan)
   ============================================================ */

import { initReveals } from "./lib/motion.js";
import { mountCursor } from "./lib/cursor.js";

const PLANE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2c.8 0 1.3 1.4 1.4 3.2l.2 4.3 7.4 4v2l-7.3-2.2-.2 4.2 2.1 1.6v1.6L12 19.4 8.4 20.7v-1.6l2.1-1.6-.2-4.2L3 15.5v-2l7.4-4 .2-4.3C10.7 3.4 11.2 2 12 2z"/></svg>`;

/* Enregistrement du service worker (hors dev file://). */
export function registerSW() {
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("service-worker.js").catch(() => {});
    });
  }
}

/* Logo avion fixe (haut-gauche) → retour à l'accueil. */
export function mountHomeLogo() {
  if (document.querySelector(".home-logo")) return;
  const a = document.createElement("a");
  a.className = "home-logo";
  a.href = "index.html";
  a.setAttribute("aria-label", "Accueil");
  a.innerHTML = PLANE_ICON;
  document.body.appendChild(a);
}

/* Barre d'onglets basse — 3 entrées, PILOTAGE central surélevé. */
const SUIVI_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5v14h16"/><path d="M7 15l3.5-4 3 2L20 7"/></svg>';
const PILOTAGE_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><path d="M12 4v3M12 17v3M4 12h3M17 12h3"/></svg>';
const RAVITO_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3s5 5.8 5 9.8a5 5 0 0 1-10 0C7 8.8 12 3 12 3z"/></svg>';

const TABBAR_PAGES = new Set(["index.html", "today.html", "nutrition.html", "tracking.html"]);

export function mountTabBar() {
  if (document.querySelector(".tabbar")) return;
  const current = location.pathname.split("/").pop() || "index.html";
  if (!TABBAR_PAGES.has(current)) return;

  const tab = (href, label, icon, center) => {
    const active = href === current ? ' aria-current="page"' : "";
    if (center) {
      return `<a class="tab-center" href="${href}"${active}><span class="tab-disc">${icon}</span><span>${label}</span></a>`;
    }
    return `<a href="${href}"${active}>${icon}<span>${label}</span></a>`;
  };

  const nav = document.createElement("nav");
  nav.className = "tabbar";
  nav.setAttribute("aria-label", "Navigation principale");
  nav.innerHTML =
    tab("tracking.html", "Suivi", SUIVI_ICON, false) +
    tab("today.html", "Pilotage", PILOTAGE_ICON, true) +
    tab("nutrition.html", "Ravito", RAVITO_ICON, false);
  document.body.appendChild(nav);
}

/* En-tête applicatif (titre + bouton retour) pour écrans profonds. */
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

export function mountChrome() {
  mountHomeLogo();
  mountCursor();
  mountTabBar();
}

export function boot() {
  registerSW();
  mountChrome();
  initReveals();
}
