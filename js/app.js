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

/* Barre d'onglets basse — navigation principale (cf. brief §C).
   4 entrées, icônes fines + label mono. Absente des sous-écrans
   (séance) où un chrono occupe déjà le bas. */
const TABS = [
  ["today.html", "Pilotage", '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16a8 8 0 0 1 16 0"/><path d="M12 16l4.5-4"/><circle cx="12" cy="16" r="1.3" fill="currentColor" stroke="none"/></svg>'],
  ["nutrition.html", "Ravitaillement", '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3s5 5.8 5 9.8a5 5 0 0 1-10 0C7 8.8 12 3 12 3z"/></svg>'],
  ["planning.html", "Plan de vol", '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="18" r="2.4"/><circle cx="18" cy="6" r="2.4"/><path d="M8 16l8-8" stroke-dasharray="2 2.4"/></svg>'],
  ["tracking.html", "Suivi", '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5v14h16"/><path d="M7 15l3.5-4 3 2L20 7"/></svg>'],
];
const TABBAR_PAGES = new Set(["today.html", "nutrition.html", "planning.html", "tracking.html", "hangar.html"]);

export function mountTabBar() {
  if (document.querySelector(".tabbar")) return;
  const current = location.pathname.split("/").pop() || "index.html";
  if (!TABBAR_PAGES.has(current)) return;
  const nav = document.createElement("nav");
  nav.className = "tabbar";
  nav.setAttribute("aria-label", "Navigation principale");
  nav.innerHTML = TABS.map(([href, label, icon]) => {
    const active = href === current ? ' aria-current="page"' : "";
    return `<a href="${href}"${active}>${icon}<span>${label}</span></a>`;
  }).join("");
  document.body.appendChild(nav);
}

export function boot() {
  registerSW();
  mountMenu();
  mountTabBar();
  initReveals();
}
