/* ============================================================
   ACHIEVE — Curseur HUD « visière de casque de chasse »
   Un réticule de visée suit la souris ET le doigt (tactile),
   avec un léger glissé facon pointeur laser + verrouillage à l'appui.
   Point d'injection unique : appelé depuis mountMenu() (toutes les pages).
   ============================================================ */

import { prefersReducedMotion } from "./motion.js";

let mounted = false;

export function mountCursor() {
  if (mounted) return;
  mounted = true;

  // Réticule (visière + croix + crochets de lock + pipper central).
  const root = document.createElement("div");
  root.className = "hud-cursor";
  root.setAttribute("aria-hidden", "true");
  root.innerHTML = `
    <span class="hud-cursor__glow"></span>
    <svg class="hud-cursor__svg" viewBox="0 0 64 64" width="64" height="64">
      <g class="hud-cursor__ring" fill="none" stroke="currentColor" stroke-linecap="round">
        <circle cx="32" cy="32" r="20" stroke-width="1.4"/>
        <path class="hud-cursor__visor" d="M13 27a20 20 0 0 1 38 0" stroke-width="2.6"/>
        <line x1="32" y1="3"  x2="32" y2="13" stroke-width="1.4"/>
        <line x1="32" y1="51" x2="32" y2="61" stroke-width="1.4"/>
        <line x1="3"  y1="32" x2="13" y2="32" stroke-width="1.4"/>
        <line x1="51" y1="32" x2="61" y2="32" stroke-width="1.4"/>
      </g>
      <g class="hud-cursor__brackets" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
        <path d="M13 21v-8h8"/><path d="M43 13h8v8"/><path d="M51 43v8h-8"/><path d="M21 51h-8v-8"/>
      </g>
      <circle class="hud-cursor__pip" cx="32" cy="32" r="1.9"/>
    </svg>`;

  // Point laser secondaire (traine plus molle → effet pointeur laser).
  const trail = document.createElement("span");
  trail.className = "hud-cursor__trail";
  trail.setAttribute("aria-hidden", "true");

  document.body.append(trail, root);

  const reduce = prefersReducedMotion();
  let tX = innerWidth / 2, tY = innerHeight / 2;   // cible (position pointeur)
  let cX = tX, cY = tY;                              // réticule lissé
  let lX = tX, lY = tY;                              // traine laser
  let visible = false, hideTimer = 0, touch = false;

  const show = () => {
    if (visible) return;
    visible = true;
    root.classList.add("is-on");
    trail.classList.add("is-on");
  };
  const hide = () => {
    visible = false;
    root.classList.remove("is-on", "is-lock", "is-hot");
    trail.classList.remove("is-on");
  };
  const fadeLater = (ms) => { clearTimeout(hideTimer); hideTimer = setTimeout(hide, ms); };

  function move(x, y) {
    tX = x; tY = y;
    show();
    if (reduce) { cX = lX = x; cY = lY = y; render(); }
  }
  function render() {
    root.style.transform = `translate3d(${cX}px, ${cY}px, 0)`;
    trail.style.transform = `translate3d(${lX}px, ${lY}px, 0)`;
  }
  function loop() {
    cX += (tX - cX) * 0.38; cY += (tY - cY) * 0.38;   // réticule : suit vite
    lX += (tX - lX) * 0.16; lY += (tY - lY) * 0.16;   // laser : reste en retard
    render();
    requestAnimationFrame(loop);
  }
  if (!reduce) requestAnimationFrame(loop);

  // --- Pointeur unifié (souris + stylet + tactile) ---
  addEventListener("pointermove", (e) => {
    touch = e.pointerType === "touch";
    move(e.clientX, e.clientY);
    if (touch) fadeLater(1300);
  }, { passive: true });

  addEventListener("pointerdown", (e) => {
    touch = e.pointerType === "touch";
    move(e.clientX, e.clientY);
    root.classList.add("is-lock");
  }, { passive: true });

  addEventListener("pointerup", () => {
    root.classList.remove("is-lock");
    if (touch) fadeLater(1000);
  }, { passive: true });

  // Filet de sécurité tactile iOS : touchmove continue de tirer même quand
  // le flux pointer est interrompu par un scroll.
  addEventListener("touchmove", (e) => {
    const t = e.touches[0];
    if (!t) return;
    touch = true;
    move(t.clientX, t.clientY);
    fadeLater(1300);
  }, { passive: true });

  // --- Desktop : disparait hors fenetre, se « chauffe » sur les cibles ---
  document.addEventListener("mouseleave", hide);
  document.addEventListener("mouseover", (e) => {
    if (touch) return;
    const hot = e.target.closest(
      "a, button, label, summary, select, [role=button], input, textarea, [data-day], [data-type], [data-nav], [data-navmonth], .wp-head"
    );
    root.classList.toggle("is-hot", !!hot);
  });

  // Activé seulement maintenant : on masque alors le curseur natif (desktop).
  document.documentElement.classList.add("hud-cursor-on");
}
