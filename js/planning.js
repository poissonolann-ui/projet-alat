/* ============================================================
   ACHIEVE — Planning (Jour / Semaine / Mois / 6 mois / Année)
   Ouvre sur aujourd'hui. Cases entièrement colorées (statuts).
   Tap un jour → choisir le type → ouvrir la séance.
   ============================================================ */

import { boot, mountHeader } from "./app.js";
import { update } from "./lib/store.js";
import { dayMeta, statusFor, isToday, labelForType } from "./lib/schedule.js";
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
  const cls = `is-${st}` + (isToday(iso) ? " is-today" : "");
  const chipColor = st === "done" ? "accent-hud" : st === "miss" ? "accent-red" : "dim";
  return `
    <button class="day-row ${cls}" data-day="${iso}">
      <span class="date">${DAY_LABELS[weekdayIndex(d)]} ${d.getDate()}</span>
      <span class="name">${m.label}</span>
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
    const cls = `month-cell is-${st}` + (c.inMonth ? "" : " out") + (isToday(c.iso) ? " is-today" : "");
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

render();
boot();
