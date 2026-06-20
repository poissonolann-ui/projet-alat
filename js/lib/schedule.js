/* ============================================================
   ACHIEVE — Résolution du planning & statuts calendrier
   Combine le gabarit hebdo (data) + les surcharges (store).
   Statuts (cf. §7) :
     done  = validé              → vert
     miss  = passé, non validé, non-repos → rouge
     grey  = repos ou futur      → gris
     today = encadré (drapeau séparé)
   ============================================================ */

import { weekTemplate } from "../../data/weekTemplate.js";
import { getState } from "./store.js";
import { fromISO, weekdayIndex, isPast, todayISO } from "./date.js";

/* Type de séance prévu pour une date (surcharge utilisateur prioritaire). */
export function plannedType(iso) {
  const state = getState();
  if (state.sessionTypeByDate[iso]) return state.sessionTypeByDate[iso];
  const tpl = weekTemplate[weekdayIndex(fromISO(iso))];
  return tpl.type;
}

/* Métadonnées du jour (label, variant course). */
export function dayMeta(iso) {
  const state = getState();
  const tpl = weekTemplate[weekdayIndex(fromISO(iso))];
  const type = state.sessionTypeByDate[iso] || tpl.type;
  return {
    iso,
    type,
    variant: tpl.variant || null,
    label: type === tpl.type ? tpl.label : labelForType(type),
    restable: !!tpl.restable,
  };
}

export function labelForType(type) {
  return {
    course: "Course", pull: "Pull", push: "Push", legs: "Legs",
    upper: "Upper", lower: "Lower", rest: "Repos", test: "Test",
  }[type] || type;
}

/* Statut d'affichage d'une case calendrier. */
export function statusFor(iso) {
  const state = getState();
  const type = plannedType(iso);

  if (state.sessionStatus[iso] === "done") return "done";
  if (type === "rest") return "grey";
  if (isPast(iso)) return "miss"; // passé, non validé, non-repos
  return "grey"; // futur
}

export function isToday(iso) {
  return iso === todayISO();
}

/* Statistiques d'assiduité sur une plage de dates passées. */
export function attendanceStats(fromDate, toDate) {
  const state = getState();
  let done = 0, miss = 0, total = 0;
  const cur = new Date(fromDate);
  const end = new Date(toDate);
  while (cur <= end) {
    const iso = isoLocal(cur);
    const type = plannedType(iso);
    if (type !== "rest" && (isPast(iso) || iso === todayISO())) {
      total++;
      if (state.sessionStatus[iso] === "done") done++;
      else if (isPast(iso)) miss++;
    }
    cur.setDate(cur.getDate() + 1);
  }
  const pct = total ? Math.round((done / total) * 100) : 0;
  return { done, miss, total, pct };
}

function isoLocal(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
