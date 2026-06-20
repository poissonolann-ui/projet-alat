/* ============================================================
   ACHIEVE — Suivi & réglages
   Assiduité · courbe de poids · réglages · export/import · reset
   ============================================================ */

import { boot, mountHeader } from "./app.js";
import { getState, update, exportJSON, importJSON, resetAll, storageAvailable } from "./lib/store.js";
import { attendanceStats } from "./lib/schedule.js";
import { profile } from "../data/profile.js";
import { fromISO, toISO, todayISO } from "./lib/date.js";

mountHeader("Suivi", "⊕ Débriefing & réglages", "/today.html");

const host = document.querySelector("[data-tracking]");

function render() {
  const state = getState();
  const settings = state.settings;
  const vma = settings.vma || profile.vma;
  const target = settings.weightTargetKg || profile.weightTargetKg;
  const contest = settings.contestDate || profile.contestDate;

  // Assiduité depuis le début de prépa.
  const stats = attendanceStats(fromISO(profile.prepStartDate), new Date());

  host.innerHTML = `
    ${!storageAvailable ? `<div class="warn" style="margin-bottom:var(--sp-4)">⚠ Stockage local indisponible (navigation privée ?) : tes données ne seront pas conservées entre les sessions.</div>` : ""}

    <h2 class="section-title">Assiduité</h2>
    <div class="macro-grid">
      <div class="macro"><div class="v accent-hud">${stats.done}</div><div class="k">réalisées</div></div>
      <div class="macro"><div class="v accent-red">${stats.miss}</div><div class="k">manquées</div></div>
      <div class="macro"><div class="v">${stats.pct}%</div><div class="k">assiduité</div></div>
    </div>

    <h2 class="section-title" style="margin-top:var(--sp-6)">Courbe de poids</h2>
    <div class="card">
      ${weightChart(state.weightLog, target)}
      <form data-weight-form style="display:flex;gap:var(--sp-2);margin-top:var(--sp-4)">
        <input class="field" style="flex:1;margin:0" type="number" step="0.1" inputmode="decimal" placeholder="Poids du jour (kg)" aria-label="Poids du jour" data-weight-input />
        <button class="btn btn-primary" type="submit">+ Ajouter</button>
      </form>
      <p class="note">Actuel cible : ${target} kg · perte saine 0,4–0,6 kg/sem.</p>
    </div>

    <h2 class="section-title" style="margin-top:var(--sp-6)">Réglages</h2>
    <div class="card">
      <div class="field">
        <label for="set-vma">VMA (km/h)</label>
        <input id="set-vma" type="number" step="0.05" inputmode="decimal" value="${vma}" data-set="vma" />
      </div>
      <div class="field">
        <label for="set-target">Poids cible (kg)</label>
        <input id="set-target" type="number" step="0.5" inputmode="decimal" value="${target}" data-set="weightTargetKg" />
      </div>
      <div class="field">
        <label for="set-date">Date du concours ALAT</label>
        <input id="set-date" type="date" value="${contest}" data-set="contestDate" />
      </div>
      <p class="note" data-settings-feedback></p>
    </div>

    <h2 class="section-title" style="margin-top:var(--sp-6)">Sauvegarde</h2>
    <div class="stack">
      <button class="btn btn-block" data-export>⬇ Exporter mes données (JSON)</button>
      <label class="btn btn-block" style="cursor:pointer">
        ⬆ Importer une sauvegarde
        <input type="file" accept="application/json" hidden data-import />
      </label>
      <button class="btn btn-ghost btn-block accent-red" data-reset>⟲ Tout réinitialiser</button>
      <p class="note" data-backup-feedback></p>
    </div>

    <a class="btn btn-ghost btn-block" href="/today.html" style="margin-top:var(--sp-5)">↩ Aujourd'hui</a>
  `;

  wire();
}

/* Courbe SVG simple (transform/opacity-free, pur SVG). */
function weightChart(log, target) {
  if (!log || log.length === 0) {
    return `<p class="dim">Aucun relevé encore. Ajoute ton premier poids ci-dessous.</p>`;
  }
  const W = 320, H = 140, pad = 24;
  const data = [...log].sort((a, b) => a.iso.localeCompare(b.iso));
  const ws = data.map((p) => p.kg);
  let min = Math.min(...ws, target) - 1;
  let max = Math.max(...ws, target) + 1;
  if (max - min < 2) { max += 1; min -= 1; }
  const x = (i) => pad + (data.length === 1 ? (W - 2 * pad) / 2 : (i / (data.length - 1)) * (W - 2 * pad));
  const y = (kg) => pad + (1 - (kg - min) / (max - min)) * (H - 2 * pad);
  const pts = data.map((p, i) => `${x(i)},${y(p.kg)}`).join(" ");
  const dots = data.map((p, i) => `<circle class="pt" cx="${x(i)}" cy="${y(p.kg)}" r="3" />`).join("");
  const ty = y(target);
  return `
    <svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Courbe de poids">
      <line class="grid-line" x1="${pad}" y1="${pad}" x2="${pad}" y2="${H - pad}" />
      <line class="grid-line" x1="${pad}" y1="${H - pad}" x2="${W - pad}" y2="${H - pad}" />
      <line class="target-line" x1="${pad}" y1="${ty}" x2="${W - pad}" y2="${ty}" />
      <text x="${W - pad}" y="${ty - 4}" text-anchor="end" font-family="var(--font-mono)" font-size="9" fill="var(--hud)">cible ${target}kg</text>
      ${data.length > 1 ? `<polyline class="weight-line" points="${pts}" />` : ""}
      ${dots}
    </svg>`;
}

function wire() {
  host.querySelector("[data-weight-form]").addEventListener("submit", (e) => {
    e.preventDefault();
    const inp = host.querySelector("[data-weight-input]");
    const kg = Number(inp.value);
    if (!kg) return;
    update((s) => {
      const iso = todayISO();
      const existing = s.weightLog.find((w) => w.iso === iso);
      if (existing) existing.kg = kg;
      else s.weightLog.push({ iso, kg });
    });
    render();
  });

  host.querySelectorAll("[data-set]").forEach((el) => {
    el.addEventListener("change", () => {
      const key = el.dataset.set;
      const val = el.type === "date" ? el.value : Number(el.value);
      update((s) => { s.settings[key] = val; });
      const fb = host.querySelector("[data-settings-feedback]");
      fb.classList.add("accent-hud");
      fb.textContent = "✓ Réglage enregistré.";
    });
  });

  host.querySelector("[data-export]").addEventListener("click", exportJSON);
  host.querySelector("[data-import]").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    importJSON(file)
      .then(() => { feedback("✓ Sauvegarde importée.", true); render(); })
      .catch(() => feedback("⚠ Fichier invalide.", false));
  });
  host.querySelector("[data-reset]").addEventListener("click", () => {
    if (confirm("Tout réinitialiser ? Cette action efface toutes tes données locales (charges, séances, poids, réglages). Pense à exporter avant.")) {
      resetAll();
      render();
    }
  });
}

function feedback(msg, ok) {
  const fb = host.querySelector("[data-backup-feedback]");
  fb.className = "note " + (ok ? "accent-hud" : "accent-red");
  fb.textContent = msg;
}

render();
boot();
