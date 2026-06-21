/* ============================================================
   ACHIEVE — SUIVI (débriefing)
   Cadrans objectifs · assiduité · courbe de poids animée ·
   RETEX hebdo · carte de progression (plan de vol) · réglages.
   ============================================================ */

import { boot } from "./app.js";
import { getState, update, exportJSON, importJSON, resetAll, storageAvailable } from "./lib/store.js";
import { attendanceStats, missionProgress } from "./lib/schedule.js";
import { buildDials } from "./lib/dials.js";
import { profile } from "../data/profile.js";
import { destination } from "../data/aircraft.js";
import { fromISO, toISO, todayISO, startOfWeek, addDays, MONTH_LABELS } from "./lib/date.js";

const host = document.querySelector("[data-tracking]");
let retexOffset = 0; // 0 = semaine courante, négatif = passées

/* ---------- Carte de progression (plan de vol → ALAT) ---------- */
const NAV_WP = [
  { code: "WP00", name: "Départ" },
  { code: "WP01", name: "Run fractionné" },
  { code: "WP02", name: "Volume" },
  { code: "WP03", name: "Test VMA" },
  { code: "WP04", name: "Évaluation" },
  { code: "DEST", name: destination.label, dest: true },
];

function navmap() {
  const start = fromISO(profile.prepStartDate);
  const contest = fromISO(getState().settings.contestDate || profile.contestDate);
  const { pct, done, total } = missionProgress(start, contest);
  const n = NAV_WP.length;
  const hereIndex = Math.min(n - 2, Math.floor((pct / 100) * (n - 1)));
  const daysLeft = Math.max(0, Math.ceil((contest - new Date()) / 86400000));

  const wps = NAV_WP.map((wp, i) => {
    const left = (i / (n - 1)) * 100;
    const status = wp.dest ? "dest" : i < hereIndex ? "done" : i === hereIndex ? "here" : "todo";
    return `<div class="nm-wp ${status}" style="left:${left}%"><span class="nm-dot"></span><span class="nm-code">${wp.code}</span></div>`;
  }).join("");

  return `
    <div class="navmap" data-navmap>
      <div class="navmap-head">
        <span class="nm-title">Plan de vol · ${destination.unit}</span>
        <span class="nm-pct">${pct}%</span>
      </div>
      <div class="nm-route">
        <span class="nm-line"></span>
        <span class="nm-progress" data-nmprog data-p="${pct}%"></span>
        ${wps}
        <span class="nm-plane" data-nmplane data-p="${pct}%"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c.8 0 1.3 1.4 1.4 3.2l.2 4.3 7.4 4v2l-7.3-2.2-.2 4.2 2.1 1.6v1.6L12 19.4 8.4 20.7v-1.6l2.1-1.6-.2-4.2L3 15.5v-2l7.4-4 .2-4.3C10.7 3.4 11.2 2 12 2z"/></svg></span>
      </div>
      <div class="nm-foot">
        <span>Étape : <span class="here-name">${NAV_WP[hereIndex].name}</span> · ${done}/${total} séances</span>
        <span>J−${daysLeft}</span>
      </div>
    </div>`;
}

/* ---------- Courbe de poids ---------- */
function weightChart(log, target) {
  if (!log || log.length === 0) return `<p class="dim">Aucun relevé. Ajoute ton premier poids ci-dessous.</p>`;
  const W = 320, H = 140, pad = 24;
  const data = [...log].sort((a, b) => a.iso.localeCompare(b.iso));
  let min = Math.min(...data.map((p) => p.kg), target) - 1;
  let max = Math.max(...data.map((p) => p.kg), target) + 1;
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

/* ---------- RETEX hebdo ---------- */
function retexBlock() {
  const monday = toISO(addDays(startOfWeek(new Date()), retexOffset * 7));
  const md = fromISO(monday), end = addDays(md, 6);
  const label = `Sem. ${md.getDate()} ${MONTH_LABELS[md.getMonth()].slice(0, 3)} – ${end.getDate()} ${MONTH_LABELS[end.getMonth()].slice(0, 3)}`;
  const val = (getState().retex[monday] || "").replace(/"/g, "&quot;");
  return `
    <div class="card">
      <div class="retex-nav">
        <button data-retex-nav="-1" aria-label="Semaine précédente">‹</button>
        <span class="retex-week">${label}${retexOffset === 0 ? " · en cours" : ""}</span>
        <button data-retex-nav="1" ${retexOffset >= 0 ? "disabled style=opacity:.3" : ""} aria-label="Semaine suivante">›</button>
      </div>
      <textarea class="retex-box" data-retex="${monday}" placeholder="RETEX : sensations, perfs, ce qui a marché / à corriger…">${val}</textarea>
      <p class="note" data-retex-fb></p>
    </div>`;
}

function render() {
  const state = getState();
  const settings = state.settings;
  const vma = settings.vma || profile.vma;
  const target = settings.weightTargetKg || profile.weightTargetKg;
  const contest = settings.contestDate || profile.contestDate;
  const stats = attendanceStats(fromISO(profile.prepStartDate), new Date());

  host.innerHTML = `
    <p class="pilo-title" style="margin-top:var(--sp-2)">⊕ Suivi · Débriefing</p>
    <h1 class="pilo-date">Progression</h1>
    ${!storageAvailable ? `<div class="warn" style="margin-bottom:var(--sp-4)">⚠ Stockage local indisponible : données non conservées entre sessions.</div>` : ""}

    ${navmap()}

    <h2 class="section-title">Objectifs</h2>
    <div class="dials" data-dials></div>

    <h2 class="section-title" style="margin-top:var(--sp-6)">Assiduité</h2>
    <div class="macro-grid">
      <div class="macro"><div class="v accent-hud">${stats.done}</div><div class="k">réalisées</div></div>
      <div class="macro"><div class="v accent-red">${stats.miss}</div><div class="k">manquées</div></div>
      <div class="macro"><div class="v">${stats.pct}%</div><div class="k">assiduité</div></div>
    </div>

    <h2 class="section-title" style="margin-top:var(--sp-6)">Poids</h2>
    <div class="card">
      ${weightChart(state.weightLog, target)}
      <form data-weight-form style="display:flex;gap:var(--sp-2);margin-top:var(--sp-4)">
        <input class="field" style="flex:1;margin:0" type="number" step="0.1" inputmode="decimal" placeholder="Poids du jour (kg)" aria-label="Poids du jour" data-weight-input />
        <button class="btn btn-primary" type="submit">+ Ajouter</button>
      </form>
    </div>

    <h2 class="section-title" style="margin-top:var(--sp-6)">RETEX hebdo</h2>
    ${retexBlock()}

    <h2 class="section-title" style="margin-top:var(--sp-6)">Réglages</h2>
    <div class="card">
      <div class="field"><label for="set-vma">VMA (km/h)</label>
        <input id="set-vma" type="number" step="0.05" inputmode="decimal" value="${vma}" data-set="vma" /></div>
      <div class="field"><label for="set-target">Poids cible (kg)</label>
        <input id="set-target" type="number" step="0.5" inputmode="decimal" value="${target}" data-set="weightTargetKg" /></div>
      <div class="field"><label for="set-date">Date du concours ALAT</label>
        <input id="set-date" type="date" value="${contest}" data-set="contestDate" /></div>
      <p class="note" data-settings-feedback></p>
    </div>

    <h2 class="section-title" style="margin-top:var(--sp-6)">Sauvegarde</h2>
    <div class="stack">
      <button class="btn btn-block" data-export>⬇ Exporter (JSON)</button>
      <label class="btn btn-block" style="cursor:pointer">⬆ Importer une sauvegarde
        <input type="file" accept="application/json" hidden data-import /></label>
      <button class="btn btn-ghost btn-block accent-red" data-reset>⟲ Tout réinitialiser</button>
      <p class="note" data-backup-feedback></p>
    </div>
  `;

  buildDials("[data-dials]");
  requestAnimationFrame(() => {
    const pr = host.querySelector("[data-nmprog]"); if (pr) pr.style.width = pr.dataset.p;
    const pl = host.querySelector("[data-nmplane]"); if (pl) pl.style.left = pl.dataset.p;
  });
  wire();
}

function wire() {
  host.querySelector("[data-weight-form]").addEventListener("submit", (e) => {
    e.preventDefault();
    const inp = host.querySelector("[data-weight-input]");
    const kg = Number(inp.value);
    if (!kg) return;
    update((s) => {
      const i = todayISO();
      const ex = s.weightLog.find((w) => w.iso === i);
      if (ex) ex.kg = kg; else s.weightLog.push({ iso: i, kg });
    });
    render();
  });

  host.querySelectorAll("[data-set]").forEach((el) => {
    el.addEventListener("change", () => {
      const key = el.dataset.set;
      const val = el.type === "date" ? el.value : Number(el.value);
      update((s) => { s.settings[key] = val; });
      const fb = host.querySelector("[data-settings-feedback]");
      fb.classList.add("accent-hud"); fb.textContent = "✓ Réglage enregistré.";
    });
  });

  // RETEX : sauvegarde au fil de la frappe + navigation entre semaines.
  const ta = host.querySelector("[data-retex]");
  if (ta) ta.addEventListener("input", () => {
    update((s) => { s.retex[ta.dataset.retex] = ta.value; });
    const fb = host.querySelector("[data-retex-fb]");
    fb.classList.add("accent-hud"); fb.textContent = "✓ Enregistré.";
  });
  host.querySelectorAll("[data-retex-nav]").forEach((b) =>
    b.addEventListener("click", () => {
      const dir = Number(b.dataset.retexNav);
      if (dir > 0 && retexOffset >= 0) return;
      retexOffset += dir; render();
    }));

  host.querySelector("[data-export]").addEventListener("click", exportJSON);
  host.querySelector("[data-import]").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    importJSON(file).then(() => { feedback("✓ Sauvegarde importée.", true); render(); })
      .catch(() => feedback("⚠ Fichier invalide.", false));
  });
  host.querySelector("[data-reset]").addEventListener("click", () => {
    if (confirm("Tout réinitialiser ? Efface toutes tes données locales. Exporte avant.")) { resetAll(); render(); }
  });
}

function feedback(msg, ok) {
  const fb = host.querySelector("[data-backup-feedback]");
  fb.className = "note " + (ok ? "accent-hud" : "accent-red");
  fb.textContent = msg;
}

render();
boot();
