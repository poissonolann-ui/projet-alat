/* ============================================================
   ACHIEVE — Helpers de date (calendrier, semaine ISO, statuts)
   Pas de dépendance : Date natif, semaine commençant lundi.
   ============================================================ */

export const DAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
export const MONTH_LABELS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

/* ISO local "YYYY-MM-DD" (sans décalage UTC). */
export function toISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromISO(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayISO() {
  return toISO(new Date());
}

/* Index Lun=0 … Dim=6 */
export function weekdayIndex(d) {
  return (d.getDay() + 6) % 7;
}

/* Lundi de la semaine contenant d. */
export function startOfWeek(d) {
  const r = new Date(d);
  r.setDate(r.getDate() - weekdayIndex(d));
  r.setHours(0, 0, 0, 0);
  return r;
}

export function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function diffDays(a, b) {
  const ms = fromISO(toISO(a)) - fromISO(toISO(b));
  return Math.round(ms / 86400000);
}

export function isSameDay(a, b) {
  return toISO(a) === toISO(b);
}

export function isPast(iso) {
  return diffDays(fromISO(iso), new Date()) < 0;
}

export function isFuture(iso) {
  return diffDays(fromISO(iso), new Date()) > 0;
}

/* Jours d'un mois (grille calendrier, semaines complètes lundi→dimanche). */
export function monthGrid(year, month /* 0-11 */) {
  const first = new Date(year, month, 1);
  const start = startOfWeek(first);
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = addDays(start, i);
    cells.push({ date: d, iso: toISO(d), inMonth: d.getMonth() === month });
    if (i >= 34 && d.getMonth() !== month) break; // coupe la dernière semaine vide
  }
  return cells;
}

/* Compte à rebours en jours vers une date ISO. */
export function daysUntil(iso) {
  return diffDays(fromISO(iso), new Date());
}
