/* ============================================================
   ACHIEVE — Planning (Jour / Semaine / Mois / 6 mois / Année)
   Ouvre sur aujourd'hui. Cases entièrement colorées (statuts).
   Tap un jour → choisir le type → ouvrir la séance.
   ============================================================ */

import { boot, mountHeader } from "./app.js";
import { update, getState } from "./lib/store.js";
import { dayMeta, statusFor, isToday, labelForType, isWorkDay, missionProgress } from "./lib/schedule.js";
import { profile } from "../data/profile.js";
import { destination } from "../data/aircraft.js";
import {
  todayISO, fromISO, toISO, addDays, startOfWeek, monthGrid,
  DAY_LABELS, MONTH_LABELS, weekdayIndex,
} from "./lib/date.js";

mountHeader("Planning", "⊕ Navigation", "today.html");

const VIEWS = ["Jour", "Semaine", "Mois", "6 mois", "Année"];
let view = "Semaine";        // s'ouvre sur la semaine d'aujourd'hui
let cursor = fromISO(todayISO());

const tabsEl = document.querySelector("[data-tabs]");
const calEl = document.querySelector("[data-cal]");
const sheet = document.querySelector("[data-sheet]");
const typeGrid = document.querySelector("[data-type-grid]");
const sheetDate = document.querySelector("[data-sheet-date]");

const SESSION_TYPES = ["course", "pull", "push", "legs", "upper", "lower", "rest", "test"];

function renderTabs() {
  tabsEl.innerHTML = VIEWS.map((v) =>
    `<button class="cal-tab" role="tab" aria-selected="${v === view}" data-view="${v}">${v}</button>`
  ).join("");
}

/* Une ligne-jour (Jour / Semaine). */
function dayRow(iso) {
  const m = dayMeta(iso);
  const st = statusFor(iso);
  const d = fromISO(iso);
  const cls = `is-${st}` + (isToday(iso) ? " is-today" : "") + (isWorkDay(iso) ? " is-work" : "");
  const chipColor = st === "done" ? "accent-hud" : st === "miss" ? "accent-red" : "dim";
  return `
    <button class="day-row ${cls}" data-day="${iso}">
      <span class="date">${DAY_LABELS[weekdayIndex(d)]} ${d.getDate()}</span>
      <span class="name">${m.label}${isWorkDay(iso) ? ' <span class="work-badge">travail</span>' : ""}</span>
      <span class="chip ${chipColor}">${chipText(st, m)}</span>
    </button>`;
}

function chipText(st, m) {
  if (st === "done") return "✓";
  if (st === "miss") return "manqué";
  if (m.type === "rest") return "repos";
  return labelForType(m.type);
}

function renderDay() {
  const iso = toISO(cursor);
  const d = fromISO(iso);
  calEl.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--sp-3)">
      <button class="btn btn-ghost" data-nav="-1">‹</button>
      <strong class="display">${DAY_LABELS[weekdayIndex(d)]} ${d.getDate()} ${MONTH_LABELS[d.getMonth()]}</strong>
      <button class="btn btn-ghost" data-nav="1">›</button>
    </div>
    ${dayRow(iso)}
    <p class="dim mono" style="margin-top:var(--sp-3)">Tape le jour pour choisir le type ou ouvrir la séance.</p>
  `;
}

function renderWeek() {
  const start = startOfWeek(cursor);
  const iso0 = toISO(start);
  let rows = "";
  for (let i = 0; i < 7; i++) rows += dayRow(toISO(addDays(start, i)));
  const end = addDays(start, 6);
  calEl.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--sp-3)">
      <button class="btn btn-ghost" data-nav="-7">‹</button>
      <strong class="display">${start.getDate()}–${end.getDate()} ${MONTH_LABELS[start.getMonth()]}</strong>
      <button class="btn btn-ghost" data-nav="7">›</button>
    </div>
    ${rows}
  `;
}

function renderMonth() {
  const y = cursor.getFullYear(), mo = cursor.getMonth();
  const cells = monthGrid(y, mo);
  const dow = DAY_LABELS.map((d) => `<div class="dow">${d[0]}</div>`).join("");
  const grid = cells.map((c) => {
    const st = statusFor(c.iso);
    const cls = `month-cell is-${st}` + (c.inMonth ? "" : " out") + (isToday(c.iso) ? " is-today" : "") + (isWorkDay(c.iso) ? " is-work" : "");
    return `<button class="${cls}" data-day="${c.iso}">${fromISO(c.iso).getDate()}</button>`;
  }).join("");
  calEl.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--sp-3)">
      <button class="btn btn-ghost" data-navmonth="-1">‹</button>
      <strong class="display">${MONTH_LABELS[mo]} ${y}</strong>
      <button class="btn btn-ghost" data-navmonth="1">›</button>
    </div>
    <div class="month-grid">${dow}${grid}</div>
    ${legend()}
  `;
}

/* Mini-mois pour 6 mois / Année (lecture d'assiduité d'un coup d'œil). */
function miniMonth(y, mo) {
  const cells = monthGrid(y, mo).filter((c) => c.inMonth);
  const lead = weekdayIndex(new Date(y, mo, 1));
  const pad = Array.from({ length: lead }, () => `<div class="mini-cell" style="visibility:hidden"></div>`).join("");
  const body = cells.map((c) => {
    const st = statusFor(c.iso);
    const cls = `mini-cell is-${st}` + (isToday(c.iso) ? " is-today" : "");
    return `<div class="${cls}" title="${c.iso}"></div>`;
  }).join("");
  return `<div class="mini-month"><div class="mini-title">${MONTH_LABELS[mo].slice(0,3)} ${y}</div><div class="mini-cells">${pad}${body}</div></div>`;
}

function renderMulti(count) {
  const base = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  let out = "";
  for (let i = 0; i < count; i++) {
    const m = new Date(base.getFullYear(), base.getMonth() + i, 1);
    out += miniMonth(m.getFullYear(), m.getMonth());
  }
  calEl.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--sp-3)">
      <button class="btn btn-ghost" data-navmonth="-${count}">‹</button>
      <strong class="display">${count === 12 ? "Année" : "6 mois"} · dès ${MONTH_LABELS[base.getMonth()].slice(0,3)} ${base.getFullYear()}</strong>
      <button class="btn btn-ghost" data-navmonth="${count}">›</button>
    </div>
    <div class="multi-grid">${out}</div>
    ${legend()}
  `;
}

function legend() {
  return `
    <div class="mono dim" style="display:flex;gap:var(--sp-4);flex-wrap:wrap;margin-top:var(--sp-4)">
      <span><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:var(--status-done);vertical-align:middle"></span> réalisée</span>
      <span><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:var(--status-miss);vertical-align:middle"></span> manquée</span>
      <span><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:var(--status-grey);vertical-align:middle"></span> repos / à venir</span>
    </div>`;
}

/* ---------- Carte de navigation (route horizontale → ALAT) ---------- */
const NAV_WP = [
  { code: "WP00", name: "Départ" },
  { code: "WP01", name: "Bloc 1" },
  { code: "WP02", name: "Volume" },
  { code: "WP03", name: "VMA" },
  { code: "WP04", name: "Affûtage" },
  { code: "DEST", name: destination.label, dest: true },
];

function buildNavmap() {
  const host = document.querySelector("[data-navmap]");
  if (!host) return;
  const start = fromISO(profile.prepStartDate);
  const contest = fromISO((getState().settings && getState().settings.contestDate) || profile.contestDate);
  const now = new Date();
  const n = NAV_WP.length;
  // Avancement piloté par l'assiduité (séances réalisées / prévues), pas le temps.
  const { frac, pct, done, total } = missionProgress(start, contest);
  const hereIndex = Math.min(n - 2, Math.floor(frac * (n - 1)));
  const daysLeft = Math.max(0, Math.ceil((contest - now) / 86400000));

  const wps = NAV_WP.map((wp, i) => {
    const left = (i / (n - 1)) * 100;
    const status = wp.dest ? "dest" : i < hereIndex ? "done" : i === hereIndex ? "here" : "todo";
    return `<div class="nm-wp ${status}" style="left:${left}%"><span class="nm-dot"></span><span class="nm-code">${wp.code}</span></div>`;
  }).join("");

  host.innerHTML = `
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
      <span>J−${daysLeft} · concours</span>
    </div>
  `;
  // Tracé progressif de la route + repère mobile.
  requestAnimationFrame(() => {
    const pr = host.querySelector("[data-nmprog]"); if (pr) pr.style.width = pr.dataset.p;
    const pl = host.querySelector("[data-nmplane]"); if (pl) pl.style.left = pl.dataset.p;
  });
}

function render() {
  renderTabs();
  if (view === "Jour") renderDay();
  else if (view === "Semaine") renderWeek();
  else if (view === "Mois") renderMonth();
  else if (view === "6 mois") renderMulti(6);
  else renderMulti(12);
}

/* ---------- Bottom sheet : choisir le type / ouvrir ---------- */
let sheetISO = null;
function openSheet(iso) {
  sheetISO = iso;
  const m = dayMeta(iso);
  const d = fromISO(iso);
  sheetDate.textContent = `${DAY_LABELS[weekdayIndex(d)]} ${d.getDate()} ${MONTH_LABELS[d.getMonth()]} · actuellement : ${m.label}`;
  typeGrid.innerHTML =
    SESSION_TYPES.map((t) => `<button data-type="${t}">${labelForType(t)}</button>`).join("") +
    `<button class="${isWorkDay(iso) ? "work-on" : ""}" style="grid-column:1/-1" data-toggle-work>${isWorkDay(iso) ? "✓ Jour de travail (dispo réduite)" : "💼 Marquer jour de travail"}</button>` +
    `<button class="btn-primary" style="grid-column:1/-1" data-open>Ouvrir la séance →</button>`;
  sheet.classList.add("is-open");
  sheet.setAttribute("aria-hidden", "false");
}
function closeSheet() {
  sheet.classList.remove("is-open");
  sheet.setAttribute("aria-hidden", "true");
}

/* ---------- Événements ---------- */
tabsEl.addEventListener("click", (e) => {
  const b = e.target.closest("[data-view]");
  if (!b) return;
  view = b.dataset.view;
  render();
});

calEl.addEventListener("click", (e) => {
  const nav = e.target.closest("[data-nav]");
  if (nav) { cursor = addDays(cursor, Number(nav.dataset.nav)); render(); return; }
  const navm = e.target.closest("[data-navmonth]");
  if (navm) { cursor = new Date(cursor.getFullYear(), cursor.getMonth() + Number(navm.dataset.navmonth), 1); render(); return; }
  const day = e.target.closest("[data-day]");
  if (day) openSheet(day.dataset.day);
});

typeGrid.addEventListener("click", (e) => {
  if (e.target.closest("[data-toggle-work]")) {
    update((s) => {
      if (s.workDays[sheetISO]) delete s.workDays[sheetISO];
      else s.workDays[sheetISO] = true;
    });
    openSheet(sheetISO); // rafraîchit le libellé du bouton
    render();            // rafraîchit le marquage calendrier
    return;
  }
  const t = e.target.closest("[data-type]");
  if (t) {
    update((s) => { s.sessionTypeByDate[sheetISO] = t.dataset.type; });
    if (t.dataset.type === "rest") { closeSheet(); render(); return; }
    location.href = `session.html?date=${sheetISO}`;
    return;
  }
  if (e.target.closest("[data-open]")) {
    location.href = `session.html?date=${sheetISO}`;
  }
});
sheet.addEventListener("click", (e) => { if (e.target === sheet) closeSheet(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeSheet(); });

buildNavmap();
render();
boot();
