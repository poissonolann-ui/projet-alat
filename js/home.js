/* ============================================================
   ACHIEVE — ACCUEIL (écran d'atterrissage Top Gun)
   Hero post-combustion · compteur de mission J−XXX (défilant) ·
   cadrans objectifs · tuile pas du jour. Peu de texte, gros impact.
   ============================================================ */

import { boot } from "./app.js";
import { profile } from "../data/profile.js";
import { getState, update } from "./lib/store.js";
import { buildDials } from "./lib/dials.js";
import { daysUntil, todayISO } from "./lib/date.js";
import { prefersReducedMotion } from "./lib/motion.js";

const iso = todayISO();
const STEP_GOAL = 8000;

/* CTA « ENTRER » → accès direct à la séance du jour. */
const launch = document.querySelector("[data-launch]");
if (launch) launch.href = `session.html?date=${iso}`;

/* ---------- Compteur de mission (odomètre J−XXX) ---------- */
function buildCountdown() {
  const host = document.querySelector("[data-countdown]");
  if (!host) return;
  const contest = getState().settings.contestDate || profile.contestDate;
  const dleft = Math.max(0, daysUntil(contest));
  const digits = String(dleft).split("").map(Number);

  const reel = (d) =>
    `<span class="odo-reel"><span class="odo-strip" data-d="${d}">${
      Array.from({ length: 10 }, (_, n) => `<span>${n}</span>`).join("")
    }</span></span>`;

  host.innerHTML = `
    <div>
      <p class="mt-label">Mission · Sélection ALAT</p>
      <p class="mt-sub">${profile.coords.label} → 5ᵉ RHC Pau</p>
    </div>
    <div class="odo" role="timer" aria-label="J moins ${dleft} jours avant le concours">
      <span class="dminus">J−</span>
      ${digits.map(reel).join("")}
      <span class="odo-unit">jours</span>
      <span class="odo-tick" aria-hidden="true"></span>
    </div>`;

  // Défilement des rouleaux vers leur chiffre (départ 0 → valeur).
  host.querySelectorAll(".odo-strip").forEach((strip, i) => {
    const set = () => { strip.style.transform = `translateY(-${strip.dataset.d}em)`; };
    if (prefersReducedMotion()) set();
    else { strip.style.transform = "translateY(0)"; setTimeout(set, 120 + i * 90); }
  });
}

/* ---------- Tuile « Pas du jour » ---------- */
function buildStepTile() {
  const host = document.querySelector("[data-steptile]");
  if (!host) return;

  const render = () => {
    const steps = getState().steps[iso] || 0;
    const pct = Math.min(100, Math.round((steps / STEP_GOAL) * 100));
    const reached = steps >= STEP_GOAL;
    host.innerHTML = `
      <div class="steptile">
        <div class="steptile-head">
          <span class="st-title">⊕ Pas du jour</span>
          <span class="st-count">${steps.toLocaleString("fr-FR")}<span class="st-goal"> / ${STEP_GOAL.toLocaleString("fr-FR")}</span></span>
        </div>
        <div class="st-bar"><span class="st-fill ${reached ? "reached" : ""}" data-fill style="width:0%" data-p="${pct}%"></span></div>
        <div class="st-actions">
          <button data-step="-500">− 500</button>
          <button data-step="500">+ 500</button>
          <button data-step="1000">+ 1000</button>
          <button data-step="set">Saisir</button>
        </div>
      </div>`;
    requestAnimationFrame(() => {
      const f = host.querySelector("[data-fill]");
      if (f) f.style.width = f.dataset.p;
    });
  };

  host.addEventListener("click", (e) => {
    const b = e.target.closest("[data-step]");
    if (!b) return;
    const v = b.dataset.step;
    update((s) => {
      const cur = s.steps[iso] || 0;
      if (v === "set") {
        const inp = prompt("Pas du jour :", cur || "");
        if (inp == null) return;
        s.steps[iso] = Math.max(0, parseInt(inp, 10) || 0);
      } else {
        s.steps[iso] = Math.max(0, cur + Number(v));
      }
    });
    render();
  });

  render();
}

/* ---------- Boot ---------- */
buildCountdown();
buildDials("[data-dials]");
buildStepTile();
boot();
