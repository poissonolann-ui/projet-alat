/* ============================================================
   ACHIEVE — Menu discret (petit logo avion ~transparent)
   Injecté sur chaque écran applicatif. Ouvre la navigation.
   ============================================================ */

const PLANE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2c.8 0 1.3 1.4 1.4 3.2l.2 4.3 7.4 4v2l-7.3-2.2-.2 4.2 2.1 1.6v1.6L12 19.4 8.4 20.7v-1.6l2.1-1.6-.2-4.2L3 15.5v-2l7.4-4 .2-4.3C10.7 3.4 11.2 2 12 2z"/></svg>`;

const LINKS = [
  ["01", "Aujourd'hui", "today.html"],
  ["02", "Planning", "planning.html"],
  ["03", "Nutrition", "nutrition.html"],
  ["04", "Hangar", "hangar.html"],
  ["05", "Suivi", "tracking.html"],
  ["06", "Accueil", "index.html"],
];

export function mountMenu() {
  const current = location.pathname.replace(/\/$/, "") || "index.html";

  const trigger = document.createElement("button");
  trigger.className = "menu-trigger";
  trigger.setAttribute("aria-label", "Ouvrir le menu");
  trigger.setAttribute("aria-expanded", "false");
  trigger.innerHTML = PLANE_ICON;

  const panel = document.createElement("nav");
  panel.className = "menu-panel";
  panel.setAttribute("aria-label", "Navigation principale");
  panel.setAttribute("aria-hidden", "true");
  panel.innerHTML = `
    <button class="menu-close" aria-label="Fermer le menu">
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
    </button>
    ${LINKS.map(([idx, label, href]) => {
      const active = href === current ? ' aria-current="page"' : "";
      return `<a href="${href}"${active}><span class="idx">${idx}</span>${label}</a>`;
    }).join("")}
    <p class="coord" style="margin-top:1.5rem">⊕ ACHIEVE · <strong>48°34′N 4°45′W</strong></p>
  `;

  document.body.append(trigger, panel);

  const open = () => {
    panel.classList.add("is-open");
    panel.setAttribute("aria-hidden", "false");
    trigger.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    panel.querySelector(".menu-close").focus();
  };
  const close = () => {
    panel.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
    trigger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    trigger.focus();
  };

  trigger.addEventListener("click", open);
  panel.querySelector(".menu-close").addEventListener("click", close);
  panel.addEventListener("click", (e) => { if (e.target === panel) close(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && panel.classList.contains("is-open")) close();
  });
}
