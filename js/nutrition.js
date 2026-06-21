/* ============================================================
   ACHIEVE — Nutrition (A330 MRTT · ravitaillement en vol)
   ============================================================ */

import { boot, mountHeader } from "./app.js";
import { getState, update } from "./lib/store.js";
import { dayMeta } from "./lib/schedule.js";
import { nutritionDays, nutritionForSessionType, supplements, nutritionAdvice } from "../data/nutrition.js";
import { todayISO } from "./lib/date.js";

mountHeader("Nutrition", "⊕ A330 MRTT · Ravitaillement", "today.html");

const host = document.querySelector("[data-nutrition]");
const iso = todayISO();
const meta = dayMeta(iso);
const today = nutritionForSessionType(meta.type);

// Cibles du jour (g / g / g / mL) et pas de log par tap.
const TARGET = { p: today.p, g: today.g, l: today.l, water: 3000 };
const STEP = { p: 20, g: 30, l: 10, water: 250 };

/* Réservoir de carburant qui se remplit selon l'apport loggé.
   Fournit aussi la donnée brute pour le design : % atteint par macro. */
function tank(key, label, eaten, unit, mod = "") {
  const target = TARGET[key];
  const pct = Math.min(100, Math.round((eaten / target) * 100));
  const disp = key === "water" ? (eaten / 1000).toFixed(2).replace(".", ",") : eaten;
  const tdisp = key === "water" ? "3 L" : `${target} g`;
  return `
    <div class="tank ${mod}">
      <div class="tank-cyl"><span class="tank-grad"></span><span class="tank-liquid" data-fill data-p="${pct}%"></span></div>
      <div class="tank-val">${disp}<span class="tank-k"> ${unit}</span></div>
      <div class="tank-k">${label} · ${pct}%</div>
      <div class="tank-k" style="opacity:.65">/ ${tdisp}</div>
      <div class="tank-ctrl">
        <button data-intake="${key}" data-d="-${STEP[key]}" aria-label="Retirer ${label}">−</button>
        <button data-intake="${key}" data-d="${STEP[key]}" aria-label="Ajouter ${label}">+</button>
      </div>
    </div>`;
}

/* Carte « journée type » (macros en chiffres). */
function macroCard(n) {
  return `
    <div class="card">
      <p class="eyebrow">${n.label}</p>
      <p class="kcal-big">${n.kcal} <span class="g-lbl">kcal</span></p>
      <div class="macro-grid" style="margin-top:var(--sp-3)">
        <div class="macro"><div class="v">${n.p}</div><div class="k">Prot. g</div></div>
        <div class="macro"><div class="v">${n.g}</div><div class="k">Gluc. g</div></div>
        <div class="macro"><div class="v">${n.l}</div><div class="k">Lip. g</div></div>
      </div>
    </div>`;
}

function render() {
  const state = getState();
  const checks = state.nutritionChecks[iso] || {};
  const i = state.intake[iso] || {};
  const eaten = { p: i.p || 0, g: i.g || 0, l: i.l || 0, water: i.water || 0 };

  const checklist = supplements
    .filter((s) => s.id !== "hydration")
    .map((s) =>
      `<li><label>
         <input type="checkbox" data-supp="${s.id}" ${checks[s.id] ? "checked" : ""} />
         <span>${s.label}${s.note ? ` <span class="dim mono">— ${s.note}</span>` : ""}</span>
       </label></li>`
    ).join("");

  host.innerHTML = `
    <div class="mrtt-dock" aria-hidden="true">
      <span class="mrtt-tanker" style="--m:url('aircraft/mrtt.svg')"></span>
      <span class="mrtt-boom"></span>
      <span class="mrtt-fuel"></span>
      <span class="mrtt-receiver" style="--m:url('aircraft/caiman.svg')"></span>
      <span class="dock-label">⊕ Arrimage · transfert</span>
    </div>

    <p class="dim">Sans carburant, pas de mission. Logge tes apports — les réservoirs se remplissent (${today.label.toLowerCase()}).</p>

    <h2 class="section-title" style="margin-top:var(--sp-5)">Réservoirs du jour</h2>
    <div class="fuel-grid">
      ${tank("p", "Prot.", eaten.p, "g")}
      ${tank("g", "Gluc.", eaten.g, "g")}
      ${tank("l", "Lip.", eaten.l, "g")}
      ${tank("water", "Eau", eaten.water, "L", "tank--water")}
    </div>
    <p class="mono dim" style="text-align:center;margin-top:var(--sp-3)">Cible ${today.label.toLowerCase()} · ${today.kcal} kcal · P${today.p} G${today.g} L${today.l}</p>

    <h2 class="section-title" style="margin-top:var(--sp-6)">Checklist compléments</h2>
    <ul class="check-list">${checklist}</ul>

    <h2 class="section-title" style="margin-top:var(--sp-6)">Les 3 journées types</h2>
    <div class="stack">
      ${macroCard(nutritionDays.muscu)}
      ${macroCard(nutritionDays.course)}
      ${macroCard(nutritionDays.repos)}
    </div>

    <h2 class="section-title" style="margin-top:var(--sp-6)">Briefing carburant</h2>
    <div class="card">
      <ul style="margin:0;padding-left:1.1rem;display:grid;gap:var(--sp-3)">
        ${nutritionAdvice.map((a) => `<li>${a}</li>`).join("")}
      </ul>
    </div>
  `;

  // Remplissage animé des réservoirs (0 → niveau loggé).
  requestAnimationFrame(() => {
    host.querySelectorAll("[data-fill]").forEach((n) => { n.style.height = n.dataset.p; });
  });
}

host.addEventListener("change", (e) => {
  const c = e.target.closest("[data-supp]");
  if (!c) return;
  update((s) => {
    s.nutritionChecks[iso] = s.nutritionChecks[iso] || {};
    s.nutritionChecks[iso][c.dataset.supp] = c.checked;
  });
});

host.addEventListener("click", (e) => {
  const b = e.target.closest("[data-intake]");
  if (!b) return;
  const key = b.dataset.intake;
  const d = Number(b.dataset.d);
  update((s) => {
    s.intake[iso] = s.intake[iso] || {};
    s.intake[iso][key] = Math.max(0, (s.intake[iso][key] || 0) + d);
  });
  render();
});

render();
boot();
