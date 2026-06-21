/* ============================================================
   ACHIEVE — Cadrans à AIGUILLE (instruments cockpit, style badin)
   Les 3 objectifs deviennent des cadrans : l'aiguille balaie de la
   valeur PRÉCÉDENTE → ACTUELLE vers la cible. Couleur rouge→vert HUD.
   Lit l'historique des tests (store). Remplace les arcs sur l'accueil.
   ============================================================ */

import { goals } from "../../data/profile.js";
import { getState } from "./store.js";
import { animateValue, prefersReducedMotion } from "./motion.js";

const TEST_KEY = { pullups: "pullupsMax", wallsit: "wallsitS", lucleger: "lucleger" };
const clamp01 = (x) => Math.max(0, Math.min(1, x));

function fmt(format, v) {
  if (format === "time") { const m = Math.floor(v / 60), s = Math.round(v % 60); return `${m}’${String(s).padStart(2, "0")}`; }
  if (format === "dec") return Number(v).toFixed(1);
  return Math.round(v).toString();
}

/* rouge-fr → vert HUD selon l'atteinte de la cible. */
function mixColor(ratio) {
  const a = [200, 16, 46], b = [200, 224, 138], t = clamp01(ratio);
  const c = a.map((x, i) => Math.round(x + (b[i] - x) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

function seriesFor(goalId) {
  const key = TEST_KEY[goalId];
  return getState().tests.map((t) => t && t[key]).filter((v) => v != null && !Number.isNaN(Number(v))).map(Number);
}

/* Graduations du demi-cercle (R=40, centre 50,52). */
function ticks() {
  let out = "";
  for (let i = 0; i <= 10; i++) {
    const ang = Math.PI - (i / 10) * Math.PI;          // 180°→0°
    const r1 = 40, r2 = i % 5 === 0 ? 31 : 34;
    const x1 = 50 + r1 * Math.cos(ang), y1 = 52 - r1 * Math.sin(ang);
    const x2 = 50 + r2 * Math.cos(ang), y2 = 52 - r2 * Math.sin(ang);
    out += `<line class="dial-tick${i % 5 === 0 ? " major" : ""}" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
  }
  return out;
}

const ARC_LEN = Math.PI * 40; // ≈125.66

export function buildDials(hostOrSel) {
  const host = typeof hostOrSel === "string" ? document.querySelector(hostOrSel) : hostOrSel;
  if (!host) return;

  host.innerHTML = goals.map((g) => {
    const series = seriesFor(g.id);
    const baseline = g.value;
    const cur = series.length ? series[series.length - 1] : baseline;
    const prev = series.length >= 2 ? series[series.length - 2] : baseline;
    const lo = Math.min(baseline, prev, cur);
    const span = g.target - lo;
    const rPrev = span > 0 ? clamp01((prev - lo) / span) : 1;
    const rCur = span > 0 ? clamp01((cur - lo) / span) : 1;
    const ratioAbs = clamp01(cur / g.target);
    const color = mixColor(ratioAbs);
    const rot0 = (rPrev * 180 - 90).toFixed(1);

    return `
      <div class="dial" data-dial data-prev="${prev}" data-cur="${cur}" data-fmt="${g.format}"
           data-rcur="${rCur}" data-arc="${(ARC_LEN * (1 - rCur)).toFixed(2)}">
        <svg viewBox="0 0 100 64" aria-hidden="true">
          <path class="dial-face" d="M8 52 A42 42 0 0 1 92 52 Z"/>
          ${ticks()}
          <path class="dial-arc dial-arc-bg" d="M10 52 A40 40 0 0 1 90 52" stroke="var(--status-grey)"/>
          <path class="dial-arc dial-arc-fg" d="M10 52 A40 40 0 0 1 90 52" stroke="${color}"
                stroke-dasharray="${ARC_LEN.toFixed(2)}" stroke-dashoffset="${ARC_LEN.toFixed(2)}"/>
          <line class="dial-needle" x1="50" y1="52" x2="50" y2="16" stroke="${color}"
                style="transform: rotate(${rot0}deg)"/>
          <circle class="dial-hub" cx="50" cy="52" r="3.4"/>
        </svg>
        <div class="dial-val"><span data-counter>${fmt(g.format, prev)}</span> <span class="tgt">/ ${fmt(g.format, g.target)}</span></div>
        <div class="dial-lbl">${g.label}</div>
      </div>`;
  }).join("");

  const reduce = prefersReducedMotion();
  const animate = (el) => {
    const fg = el.querySelector(".dial-arc-fg");
    const needle = el.querySelector(".dial-needle");
    const rCur = Number(el.dataset.rcur);
    const apply = () => {
      fg.style.strokeDashoffset = el.dataset.arc;
      needle.style.transform = `rotate(${(rCur * 180 - 90).toFixed(1)}deg)`;
    };
    if (reduce) { apply(); }
    else { requestAnimationFrame(() => requestAnimationFrame(apply)); }
    const cnt = el.querySelector("[data-counter]");
    animateValue(Number(el.dataset.prev), Number(el.dataset.cur), 1300,
      (v) => { cnt.textContent = fmt(el.dataset.fmt, v); });
  };

  if (!("IntersectionObserver" in window) || reduce) {
    host.querySelectorAll("[data-dial]").forEach(animate);
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { animate(e.target); io.unobserve(e.target); } });
  }, { threshold: 0.4 });
  host.querySelectorAll("[data-dial]").forEach((el) => io.observe(el));
}
