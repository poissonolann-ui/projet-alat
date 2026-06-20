/* ============================================================
   ACHIEVE — Hangar : galerie + viewer zoomable
   Pince (2 doigts), double-tap, glisse, inertie, retour élastique.
   N'anime que transform. Pointer Events.
   ============================================================ */

import { boot, mountHeader } from "./app.js";
import { aircraft, pillarOrder } from "../data/aircraft.js";

mountHeader("Hangar", "⊕ Galerie · pince pour zoomer", "today.html");

const host = document.querySelector("[data-hangar]");

/* Cartes : silhouettes des 5 appareils + photos Rafale réelles. */
const cards = [];
for (const id of pillarOrder) {
  const a = aircraft[id];
  cards.push({
    id, accent: id, name: a.name, role: a.pillar,
    src: a.svg, isPhoto: false, alt: `Silhouette ${a.name}`,
  });
}
cards.unshift(
  { id: "photo1", accent: "rafale", name: "Rafale Solo Display", role: "Livrée tricolore · montée", src: "aircraft/rafale-solo-climb.webp", isPhoto: true, alt: "Rafale tricolore en montée verticale" },
  { id: "photo2", accent: "rafale", name: "Rafale Solo Display", role: "Virage · fumée tricolore", src: "aircraft/rafale-solo-bank.webp", isPhoto: true, alt: "Rafale tricolore en virage avec fumée bleu-blanc-rouge" },
);

host.innerHTML = `
  <p class="dim">Le hangar opérationnel. Tape un appareil pour l'inspecter.</p>
  <div class="hangar-grid">
    ${cards.map((c, i) => `
      <button class="hangar-card" data-accent="${c.accent}" data-open="${i}">
        <span class="hud-tag">${String(i + 1).padStart(2, "0")} · ⊕</span>
        <span class="media">
          ${c.isPhoto
            ? `<img src="${c.src}" alt="${c.alt}" loading="lazy" />`
            : `<span class="silhouette" role="img" aria-label="${c.alt}" style="--m:url('${new URL(c.src, document.baseURI).href}')"></span>`}
        </span>
        <span class="meta">
          <span class="name">${c.name}</span><br/>
          <span class="role">${c.role}</span>
        </span>
      </button>`).join("")}
  </div>
  <a class="btn btn-ghost btn-block" href="today.html" style="margin-top:var(--sp-5)">↩ Aujourd'hui</a>
`;

/* ---------------- Viewer zoomable ---------------- */
const viewer = document.querySelector("[data-viewer]");
const stage = document.querySelector("[data-stage]");
const content = document.querySelector("[data-zoom-content]");
let scale = 1, tx = 0, ty = 0;
const pointers = new Map();
let pinch = null; // { dist, midX, midY, scale, tx, ty }
let lastTap = 0;
let velX = 0, velY = 0, lastX = 0, lastY = 0, lastT = 0, inertiaRAF = null;

const MIN = 1, MAX = 5;

function apply() { content.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`; }
function setTransition(on) { content.style.transition = on ? "transform 260ms cubic-bezier(0.22,1,0.36,1)" : "none"; }

function open(i) {
  const c = cards[i];
  if (c.isPhoto) {
    content.dataset.kind = "photo";
    content.innerHTML = `<img src="${c.src}" alt="${c.alt}" />`;
  } else {
    content.dataset.kind = "silhouette";
    content.innerHTML = `<span class="silhouette" role="img" aria-label="${c.alt}" style="--m:url('${new URL(c.src, document.baseURI).href}')"></span>`;
  }
  scale = 1; tx = 0; ty = 0; apply(); setTransition(false);
  viewer.classList.add("is-open");
  viewer.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}
function close() {
  viewer.classList.remove("is-open");
  viewer.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

host.addEventListener("click", (e) => {
  const b = e.target.closest("[data-open]");
  if (b) open(Number(b.dataset.open));
});
document.querySelector("[data-zoom-close]").addEventListener("click", close);

/* Bornes de translation (soft clamp) selon la taille rendue. */
function clamp() {
  setTransition(true);
  if (scale < MIN) { scale = MIN; tx = 0; ty = 0; apply(); return; }
  if (scale > MAX) scale = MAX;
  const r = content.getBoundingClientRect();
  const sr = stage.getBoundingClientRect();
  // marge max autorisée pour ne pas perdre l'image
  const maxX = Math.max(0, (r.width - sr.width) / 2 + 40);
  const maxY = Math.max(0, (r.height - sr.height) / 2 + 40);
  tx = Math.max(-maxX, Math.min(maxX, tx));
  ty = Math.max(-maxY, Math.min(maxY, ty));
  apply();
}

function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function mid(a, b) { return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; }

/* Point de la scène (relatif au coin haut-gauche du stage). */
function stageCenter() {
  const sr = stage.getBoundingClientRect();
  return { left: sr.left, top: sr.top, cx: sr.width / 2, cy: sr.height / 2 };
}

/* Zoom vers un point focal en gardant ce point fixe (origin = center). */
function zoomTo(newScale, focalClientX, focalClientY) {
  const s = stageCenter();
  const fx = focalClientX - s.left, fy = focalClientY - s.top;
  // vecteur image-espace depuis le centre, sous le point focal
  const vx = (fx - s.cx - tx) / scale;
  const vy = (fy - s.cy - ty) / scale;
  scale = newScale;
  tx = fx - s.cx - vx * scale;
  ty = fy - s.cy - vy * scale;
}

stage.addEventListener("pointerdown", (e) => {
  stage.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (inertiaRAF) cancelAnimationFrame(inertiaRAF);
  setTransition(false);

  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    const m = mid(a, b);
    pinch = { dist: dist(a, b), scale, mx: m.x, my: m.y };
  } else {
    // double-tap ?
    const now = Date.now();
    if (now - lastTap < 300) {
      setTransition(true);
      if (scale > 1.2) { scale = 1; tx = 0; ty = 0; }
      else zoomTo(2.6, e.clientX, e.clientY);
      apply(); clamp();
    }
    lastTap = now;
    lastX = e.clientX; lastY = e.clientY; lastT = now; velX = velY = 0;
  }
});

stage.addEventListener("pointermove", (e) => {
  if (!pointers.has(e.pointerId)) return;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if (pointers.size === 2 && pinch) {
    const [a, b] = [...pointers.values()];
    const nd = dist(a, b);
    const m = mid(a, b);
    const ns = Math.max(MIN * 0.8, Math.min(MAX * 1.1, pinch.scale * (nd / pinch.dist)));
    // ancre le point milieu courant
    zoomTo(ns, m.x, m.y);
    apply();
  } else if (pointers.size === 1 && scale > 1) {
    const now = Date.now();
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    tx += dx; ty += dy;
    const dt = Math.max(1, now - lastT);
    velX = dx / dt * 16; velY = dy / dt * 16;
    lastX = e.clientX; lastY = e.clientY; lastT = now;
    apply();
  }
});

function endPointer(e) {
  pointers.delete(e.pointerId);
  if (pointers.size < 2) pinch = null;
  if (pointers.size === 0) {
    // inertie si on glissait
    if (scale > 1 && (Math.abs(velX) > 0.5 || Math.abs(velY) > 0.5)) {
      const step = () => {
        velX *= 0.92; velY *= 0.92;
        tx += velX; ty += velY;
        apply();
        if (Math.abs(velX) > 0.2 || Math.abs(velY) > 0.2) inertiaRAF = requestAnimationFrame(step);
        else clamp();
      };
      inertiaRAF = requestAnimationFrame(step);
    } else {
      clamp();
    }
  }
}
stage.addEventListener("pointerup", endPointer);
stage.addEventListener("pointercancel", endPointer);

viewer.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && viewer.classList.contains("is-open")) close(); });

boot();
