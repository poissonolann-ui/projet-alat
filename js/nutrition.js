/* ============================================================
   ACHIEVE — Nutrition (A330 MRTT · ravitaillement en vol)
   ============================================================ */

import { boot, mountHeader } from "./app.js";
import { getState, update } from "./lib/store.js";
import { dayMeta } from "./lib/schedule.js";
import { nutritionDays, nutritionForSessionType, supplements, nutritionAdvice } from "../data/nutrition.js";
import { todayISO } from "./lib/date.js";

mountHeader("Nutrition", "⊕ A330 MRTT · Ravitaillement", "/today.html");

const host = document.querySelector("[data-nutrition]");
const iso = todayISO();
const meta = dayMeta(iso);
const today = nutritionForSessionType(meta.type);

function macroCard(n, highlight) {
  return `
    <div class="card ${highlight ? "" : ""}" style="${highlight ? "border-color:var(--sky)" : ""}">
      <p class="eyebrow">${n.label}${highlight ? " · aujourd'hui" : ""}</p>
      <p class="kcal-big">${n.kcal} <span class="g-lbl">kcal</span></p>
      <div class="macro-grid" style="margin-top:var(--sp-3)">
        <div class="macro"><div class="v">${n.p}</div><div class="k">Prot. g</div></div>
        <div class="macro"><div class="v">${n.g}</div><div class="k">Gluc. g</div></div>
        <div class="macro"><div class="v">${n.l}</div><div class="k">Lip. g</div></div>
      </div>
    </div>`;
}

const checks = (getState().nutritionChecks[iso]) || {};
const checklist = supplements.map((s) =>
  `<li><label>
     <input type="checkbox" data-supp="${s.id}" ${checks[s.id] ? "checked" : ""} />
     <span>${s.label}${s.note ? ` <span class="dim mono">— ${s.note}</span>` : ""}</span>
   </label></li>`
).join("");

host.innerHTML = `
  <p class="dim">Sans carburant, pas de mission. On remplit les réservoirs au bon moment, sans whey.</p>

  ${macroCard(today, true)}

  <h2 class="section-title" style="margin-top:var(--sp-6)">Ravitaillement du jour</h2>
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

  <a class="btn btn-ghost btn-block" href="/today.html" style="margin-top:var(--sp-5)">↩ Aujourd'hui</a>
`;

host.addEventListener("change", (e) => {
  const c = e.target.closest("[data-supp]");
  if (!c) return;
  update((s) => {
    s.nutritionChecks[iso] = s.nutritionChecks[iso] || {};
    s.nutritionChecks[iso][c.dataset.supp] = c.checked;
  });
});

boot();
