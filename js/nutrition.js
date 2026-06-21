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

const WATER_TARGET = 3000; // mL (~3 L), cf. hydratation
const WATER_STEP = 250;

/* Réservoir de carburant (cockpit/fuel) qui se remplit. */
function tank(label, val, unit, fillPct, mod = "") {
  return `
    <div class="tank ${mod}">
      <div class="tank-cyl"><span class="tank-grad"></span><span class="tank-liquid" data-fill data-p="${fillPct}%"></span></div>
      <div class="tank-val">${val}<span class="tank-k"> ${unit}</span></div>
      <div class="tank-k">${label}</div>
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
  const checks = getState().nutritionChecks[iso] || {};
  const water = checks._water || 0;
  const waterPct = Math.min(100, Math.round((water / WATER_TARGET) * 100));

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

    <p class="dim">Sans carburant, pas de mission. On remplit les réservoirs au bon moment — ${today.label.toLowerCase()}.</p>

    <h2 class="section-title" style="margin-top:var(--sp-5)">Réservoirs du jour</h2>
    <div class="fuel-grid">
      ${tank("Prot.", today.p, "g", 100)}
      ${tank("Gluc.", today.g, "g", 100)}
      ${tank("Lip.", today.l, "g", 100)}
      ${tank("Eau", (water / 1000).toFixed(2).replace(".", ","), "L", waterPct, "tank--water")}
    </div>
    <div class="water-ctrl">
      <button data-water="-${WATER_STEP}" aria-label="Retirer ${WATER_STEP} mL">−</button>
      <span class="mono dim" style="align-self:center">${water} / ${WATER_TARGET} mL</span>
      <button data-water="${WATER_STEP}" aria-label="Ajouter ${WATER_STEP} mL">+</button>
    </div>
    <p class="mono dim" style="text-align:center;margin-top:var(--sp-2)">${today.kcal} kcal · plein du jour</p>

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

  // Remplissage animé des réservoirs (0 → niveau).
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
  const w = e.target.closest("[data-water]");
  if (!w) return;
  update((s) => {
    s.nutritionChecks[iso] = s.nutritionChecks[iso] || {};
    const cur = s.nutritionChecks[iso]._water || 0;
    s.nutritionChecks[iso]._water = Math.max(0, cur + Number(w.dataset.water));
  });
  render();
});

render();
boot();
