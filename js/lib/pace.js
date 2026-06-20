/* ============================================================
   ACHIEVE — Allures depuis la VMA
   allure (min/km à p% VMA) = 60 / (VMA × p)
   ============================================================ */

/* Vitesse (km/h) à un pourcentage de VMA. */
export function speedAt(vma, pct) {
  return vma * pct;
}

/* Allure en minutes décimales par km. */
export function paceMinPerKm(vma, pct) {
  if (!vma || !pct) return null;
  return 60 / (vma * pct);
}

/* Formate une allure décimale (min/km) en "m:ss". */
export function formatPace(minPerKm) {
  if (minPerKm == null || !isFinite(minPerKm)) return "—";
  const totalSec = Math.round(minPerKm * 60);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}/km`;
}

/* Allure formatée directe pour un segment (pct = % VMA). */
export function segmentPace(vma, pct) {
  if (pct == null) return null;
  return formatPace(paceMinPerKm(vma, pct));
}

/* Vitesse formatée (ex : "12.3 km/h"). */
export function formatSpeed(vma, pct) {
  if (pct == null) return null;
  return `${(vma * pct).toFixed(1)} km/h`;
}

/* Demi-Cooper → VMA : distance (m) ÷ 100. */
export function vmaFromHalfCooper(distanceM) {
  if (!distanceM) return null;
  return Math.round((distanceM / 100) * 100) / 100;
}
