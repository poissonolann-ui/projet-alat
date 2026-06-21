/* ============================================================
   ACHIEVE — PILOTAGE (hub des séances)
   Séance du jour + override 1-tap + bande semaine + plan complet.
   "ENTRER" → intro aéronef → séance.
   ============================================================ */

import { boot } from "./app.js";
import { getState, update } from "./lib/store.js";
import { dayMeta, statusFor } from "./lib/schedule.js";
import { aircraftForType } from "../data/aircraft.js";
import { muscleSessions } from "../data/exercises.js";
import {
  todayISO, fromISO, toISO, startOfWeek, addDays,
  DAY_LABELS, MONTH_LABELS, weekdayIndex,
} from "./lib/date.js";

const host = document.querySelector("[data-pilotage]");
const iso = todayISO();
const d = fromISO(iso);
const dateLabel = `${DAY_LABELS[weekdayIndex(d)]} ${d.getDate()} ${MONTH_LABELS[d.getMonth()]}`;

const TYPES = [
  ["course", "Run"], ["push", "Push"], ["pull", "Pull"], ["legs", "Legs"],
  ["upper", "Spé"], ["lower", "Lower"], ["rest", "Rest"], ["test", "Test"],
];
const ACCENT = {
  course: "var(--rouge-fr)", push: "var(--ember)", pull: "var(--olive)", legs: "var(--steel)",
  upper: "var(--sky)", lower: "var(--amber)", rest: "var(--ink-dim)", test: "var(--rouge-fr)",
};

function sessionMeta(meta) {
  if (meta.type === "course") return meta.variant === "vma" ? "Fractionné · VMA" : "Endurance fondamentale";
  if (meta.type === "rest") return "Récupération programmée";
  if (meta.type === "test") return "Évaluation des progrès";
  const def = muscleSessions[meta.type];
  return def ? `${def.items.length} exercices` : "Séance";
}

function render() {
  const meta = dayMeta(iso);
  const craft = aircraftForType(meta.type);
  const accent = ACCENT[meta.type] || "var(--ember)";
  const isRest = meta.type === "rest";

  const card = `
    <section class="sess-card ${isRest ? "is-rest" : ""}" style="--accent:${accent}">
      <span class="sess-craft" style="--m:url('${craft.svg}')"></span>
      <p class="sess-kind">${craft.name} · ${craft.line}</p>
      <h2>${meta.label}</h2>
      <p class="sess-meta">${sessionMeta(meta)}</p>
      ${isRest
        ? `<p class="note" style="margin-top:var(--sp-4)">RTB — retour à la base. Hydrate, dors, marche.</p>`
        : `<button class="cta-launch" data-enter><span class="glyph">▸▸</span> Entrer</button>`}
    </section>`;

  const switchBtns = TYPES.map(([t, lbl]) =>
    `<button data-type="${t}" class="${t === meta.type ? "is-active" : ""}">${lbl}</button>`
  ).join("");

  // Bande semaine.
  const start = startOfWeek(d);
  let week = "";
  for (let i = 0; i < 7; i++) {
    const wIso = toISO(addDays(start, i));
    const wm = dayMeta(wIso);
    const st = statusFor(wIso);
    const cls = `wk-day is-${st}` + (wIso === iso ? " is-today" : "") + (wm.type === "rest" ? " is-rest" : "");
    const wd = fromISO(wIso);
    week += `<button class="${cls}" data-day="${wIso}">
        <span class="wd-name">${DAY_LABELS[i][0]}</span>
        <span class="wd-num">${wd.getDate()}</span>
        <span class="wd-dot"></span>
      </button>`;
  }

  host.innerHTML = `
    <p class="pilo-title">⊕ Pilotage</p>
    <h1 class="pilo-date">${dateLabel}</h1>
    ${card}

    <p class="home-eyebrow" style="margin-top:var(--sp-5)">Changer la séance · 1 tap</p>
    <div class="type-switch">${switchBtns}</div>

    <p class="home-eyebrow" style="margin-top:var(--sp-5)">Semaine</p>
    <div class="week-strip">${week}</div>

    <a class="deep-link" href="planning.html">Plan de vol complet <span class="arr">→</span></a>
  `;
}

/* ---------- Lancer la séance (l'intro aéronef joue à l'ouverture) ---------- */
function enterSession(targetIso) {
  location.href = `session.html?date=${targetIso}`;
}

host.addEventListener("click", (e) => {
  const t = e.target.closest("[data-type]");
  if (t) {
    update((s) => { s.sessionTypeByDate[iso] = t.dataset.type; });
    render();
    return;
  }
  if (e.target.closest("[data-enter]")) { enterSession(iso); return; }
  const day = e.target.closest("[data-day]");
  if (day) { enterSession(day.dataset.day); return; }
});

render();
boot();
