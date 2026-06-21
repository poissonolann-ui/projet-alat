/* ============================================================
   ACHIEVE — RAVITAILLEMENT (A330 MRTT)
   Réservoirs INDÉPENDANTS et animés (eau en litres, protéines,
   glucides, lipides) qui se remplissent au log. Pas de checklist.
   ============================================================ */

import { boot } from "./app.js";
import { getState, update } from "./lib/store.js";
import { dayMeta } from "./lib/schedule.js";
import { nutritionDays, nutritionForSessionType } from "../data/nutrition.js";
import { todayISO } from "./lib/date.js";

const host = document.querySelector("[data-nutrition]");
const iso = todayISO();
const meta = dayMeta(iso);
const today = nutritionForSessionType(meta.type);

const TARGET = { p: today.p, g: today.g, l: today.l, water: 3000 };
const STEP = { p: 20, g: 30, l: 10, water: 250 };

/* Réservoir indépendant : se remplit selon l'apport loggé. */
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

function macroCard(n, active) {
  return `
    <div class="card" ${active ? 'style="border-color:var(--ember)"' : ""}>
      <p class="eyebrow" ${active ? 'style="color:var(--amber)"' : ""}>${n.label}${active ? " · aujourd'hui" : ""}</p>
      <p class="kcal-big">${n.kcal} <span class="g-lbl">kcal</span></p>
      <div class="macro-grid" style="margin-top:var(--sp-3)">
        <div class="macro"><div class="v">${n.p}</div><div class="k">Prot. g</div></div>
        <div class="macro"><div class="v">${n.g}</div><div class="k">Gluc. g</div></div>
        <div class="macro"><div class="v">${n.l}</div><div class="k">Lip. g</div></div>
      </div>
    </div>`;
}

function render() {
  const i = getState().intake[iso] || {};
  const eaten = { p: i.p || 0, g: i.g || 0, l: i.l || 0, water: i.water || 0 };

  host.innerHTML = `
    <p class="pilo-title" style="margin-top:var(--sp-2)">⊕ Ravitaillement · A330 MRTT</p>
    <h1 class="pilo-date">Réservoirs</h1>

    <figure class="ravito-hero">
      <img src="aircraft/ref/mrtt-phenix.jpg" alt="A330 MRTT Phénix de l'Armée de l'Air ravitaillant un chasseur en vol" loading="eager" decoding="async" />
      <figcaption class="rh-label">⊕ Ravitaillement en vol · A330 MRTT « Phénix »</figcaption>
    </figure>

    <div class="fuel-grid">
      ${tank("p", "Prot.", eaten.p, "g")}
      ${tank("g", "Gluc.", eaten.g, "g")}
      ${tank("l", "Lip.", eaten.l, "g")}
      ${tank("water", "Eau", eaten.water, "L", "tank--water")}
    </div>
    <p class="mono dim" style="text-align:center;margin-top:var(--sp-3)">${today.label} · ${today.kcal} kcal · P${today.p} G${today.g} L${today.l}</p>

    <h2 class="section-title" style="margin-top:var(--sp-6)">Journées types</h2>
    <div class="stack">
      ${macroCard(nutritionDays.muscu, today.id === "muscu")}
      ${macroCard(nutritionDays.course, today.id === "course")}
      ${macroCard(nutritionDays.repos, today.id === "repos")}
    </div>
  `;

  // Remplissage indépendant et animé de chaque réservoir.
  requestAnimationFrame(() => {
    host.querySelectorAll("[data-fill]").forEach((n) => { n.style.height = n.dataset.p; });
  });
}

host.addEventListener("click", (e) => {
  const b = e.target.closest("[data-intake]");
  if (!b) return;
  const key = b.dataset.intake, dd = Number(b.dataset.d);
  update((s) => {
    s.intake[iso] = s.intake[iso] || {};
    s.intake[iso][key] = Math.max(0, (s.intake[iso][key] || 0) + dd);
  });
  render();
});

render();
boot();
