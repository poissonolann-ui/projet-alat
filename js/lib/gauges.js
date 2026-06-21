/* ============================================================
   ACHIEVE — Jauges des 3 objectifs (cadrans SVG, partagées)
   Lit l'historique des tests (store) pour faire progresser la jauge
   de la VALEUR PRÉCÉDENTE → VALEUR ACTUELLE vers la cible.
   Utilisé sur l'accueil ET dans l'onglet Suivi.
   ============================================================ */

import { goals } from "../../data/profile.js";
import { getState } from "./store.js";
import { animateValue } from "./motion.js";

/* Clé de l'historique de test correspondant à chaque objectif. */
const TEST_KEY = { pullups: "pullupsMax", wallsit: "wallsitS", lucleger: "lucleger" };

const clamp01 = (x) => Math.max(0, Math.min(1, x));

function fmtGoal(g, v) {
  if (g.format === "time") {
    const m = Math.floor(v / 60), s = Math.round(v % 60);
    return `${m}’${String(s).padStart(2, "0")}`;
  }
  if (g.format === "dec") return v.toFixed(1);
  return Math.round(v).toString();
}

/* Interpolation rouge-fr → vert HUD selon le ratio d'atteinte. */
function mixColor(ratio) {
  const a = [200, 16, 46];   // rouge-fr
  const b = [200, 224, 138]; // hud
  const t = clamp01(ratio);
  const c = a.map((x, i) => Math.round(x + (b[i] - x) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

/* Série de valeurs mesurées pour un objectif (ordre chronologique). */
function seriesFor(goalId) {
  const key = TEST_KEY[goalId];
  return getState().tests
    .map((t) => t && t[key])
    .filter((v) => v != null && !Number.isNaN(Number(v)))
    .map(Number);
}

export function buildGauges(hostOrSelector) {
  const host = typeof hostOrSelector === "string"
    ? document.querySelector(hostOrSelector)
    : hostOrSelector;
  if (!host) return;

  host.innerHTML = goals.map((g) => {
    const series = seriesFor(g.id);
    const baseline = g.value;                                   // référence de départ
    const cur = series.length ? series[series.length - 1] : baseline;
    const prev = series.length >= 2 ? series[series.length - 2] : baseline;
    const lo = Math.min(baseline, prev, cur);                   // borne basse de la trajectoire
    const ratio = clamp01(cur / g.target);                      // atteinte absolue → arc
    const span = g.target - lo;
    const prog = span > 0 ? clamp01((cur - lo) / span) : 1;     // progrès relatif → trajectoire
    const L = 131.95;                                           // longueur du demi-cercle r=42
    const color = mixColor(ratio);
    return `
      <div class="gauge" data-gauge data-prev="${prev}" data-cur="${cur}" data-fmt="${g.format}">
        <svg viewBox="0 0 100 64" aria-hidden="true">
          <path class="gauge-arc-bg" d="M8 50 A42 42 0 0 1 92 50"/>
          <path class="gauge-arc-fg" d="M8 50 A42 42 0 0 1 92 50"
                stroke="${color}" stroke-dasharray="${L}" stroke-dashoffset="${L}"
                data-target-offset="${L * (1 - ratio)}"/>
        </svg>
        <div class="g-val"><span data-counter>${fmtGoal(g, prev)}</span> <span class="g-lbl">/ ${fmtGoal(g, g.target)}</span></div>
        <div class="g-lbl">${g.label}</div>
        <div class="g-traj" style="--p:0%">
          <span class="g-traj-fill" data-traj data-p="${(prog * 100).toFixed(1)}%"></span>
          <span class="g-traj-knob" data-knob data-p="${(prog * 100).toFixed(1)}%"></span>
        </div>
        <div class="g-ends"><span>${fmtGoal(g, lo)}</span><span>${fmtGoal(g, g.target)}</span></div>
      </div>`;
  }).join("");

  // Animation à l'apparition : arc + compteur (précédent → actuel) + trajectoire.
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      el.querySelectorAll(".gauge-arc-fg").forEach((arc) => {
        requestAnimationFrame(() => { arc.style.strokeDashoffset = arc.dataset.targetOffset; });
      });
      el.querySelectorAll("[data-traj],[data-knob]").forEach((n) => {
        requestAnimationFrame(() => {
          n.style.setProperty(n.hasAttribute("data-knob") ? "left" : "width", n.dataset.p);
        });
      });
      const cnt = el.querySelector("[data-counter]");
      const prev = Number(el.dataset.prev), cur = Number(el.dataset.cur);
      animateValue(prev, cur, 1100, (v) => { cnt.textContent = fmtGoal({ format: el.dataset.fmt }, v); });
      io.unobserve(el);
    });
  }, { threshold: 0.4 });
  host.querySelectorAll("[data-gauge]").forEach((el) => io.observe(el));
}
