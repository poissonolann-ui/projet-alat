/* ============================================================
   ACHIEVE — Bibliothèque d'exercices (MODIFIABLE)
   Charges de référence = niveau "En forme" (cf. §7).
   step = pas de charge de l'exercice (arrondi).
   Niveaux : Fatigué ×0.93 | En forme ×1.00 | Pleine forme ×1.05
   ============================================================ */

export const LEVELS = {
  tired:  { id: "tired",  label: "Fatigué",      mult: 0.93, hint: "On préserve, technique propre." },
  ok:     { id: "ok",     label: "En forme",     mult: 1.0,  hint: "Référence du jour." },
  peak:   { id: "peak",   label: "Pleine forme", mult: 1.05, hint: "On pousse, RIR maîtrisé." },
};

/* Arrondit une charge au pas de l'exercice. */
export function roundToStep(weight, step) {
  if (!step) return Math.round(weight);
  return Math.round(weight / step) * step;
}

/* Charge affichée pour un exercice à un niveau donné, à partir de la
   référence "En forme" (ref). bodyweight = true → libellé PDC. */
export function chargeForLevel(ref, step, levelId) {
  const lvl = LEVELS[levelId] || LEVELS.ok;
  return roundToStep(ref * lvl.mult, step);
}

/* id → exercice. ref en kg (charge ajoutée) sauf note.
   "perSide" = charge par haltère/main. */
export const exercises = {
  // --- PULL ---
  pullups_weighted: { name: "Tractions lestées", scheme: "5×5", rpe: "RPE8 / RIR2", ref: 5, step: 5, bodyweight: true, note: "PDC → +5 → +10 selon niveau" },
  row_barbell:      { name: "Rowing barre",       scheme: "4×8", rpe: "RPE8 / RIR2", ref: 72.5, step: 2.5 },
  lat_pulldown:     { name: "Tirage vertical",    scheme: "3×10", rpe: "RPE8", ref: 60, step: 2.5 },
  curl_ez:          { name: "Curl barre EZ",      scheme: "3×10", rpe: "RPE9", ref: 22.5, step: 2.5 },
  curl_hammer:      { name: "Curl marteau",       scheme: "3×10", rpe: "RPE9", ref: 20, step: 2, perSide: true },
  curl_unilateral:  { name: "Curl unilatéral",    scheme: "3×10", rpe: "RPE9", ref: 10, step: 2, perSide: true },
  face_pull:        { name: "Face pull",          scheme: "3×15", rpe: "RPE8", ref: 24, step: 2 },

  // --- PUSH ---
  bench:            { name: "Développé couché",   scheme: "4×6", rpe: "RPE8 / RIR2", ref: 82.5, step: 2.5, note: "PR connu 105" },
  ohp:             { name: "Développé militaire (OHP)", scheme: "4×8", rpe: "RPE8", ref: 35, step: 2.5 },
  incline_db:       { name: "DC incliné haltères", scheme: "3×10", rpe: "RPE9", ref: 26, step: 2, perSide: true },
  lateral_raise:    { name: "Élévations latérales", scheme: "4×12-15", rpe: "RPE9", ref: 10, step: 2, perSide: true },
  triceps_pushdown: { name: "Extension triceps poulie", scheme: "3×12", rpe: "RPE9", ref: 30, step: 2.5 },
  rear_fly:         { name: "Pec fly inversé (arrière d'épaule)", scheme: "3×15", rpe: "RPE9", ref: 40, step: 5 },

  // --- LEGS / LOWER ---
  hack_squat:       { name: "Hack squat",         scheme: "4×8", rpe: "RPE8", ref: 60, step: 5, note: "+ charge machine ~45-50" },
  rdl:              { name: "Soulevé de terre roumain", scheme: "3×8", rpe: "RPE8 / contrôle", ref: 90, step: 5, note: "déjà fait 130" },
  hip_thrust:       { name: "Hip thrust",         scheme: "3×10", rpe: "RPE8", ref: 110, step: 5, note: "max ~130×6" },
  leg_curl:         { name: "Leg curl",           scheme: "3×12", rpe: "RPE9", ref: 45, step: 5 },
  leg_extension:    { name: "Leg extension",      scheme: "3×12", rpe: "RPE9", ref: 55, step: 5 },
  adductors:        { name: "Adducteurs",         scheme: "3×12", rpe: "RPE8", ref: 57.5, step: 2.5 },
  calf_press:       { name: "Mollets presse",     scheme: "4×12", rpe: "RPE9", ref: 100, step: 5 },
  walking_lunges:   { name: "Fentes marchées",    scheme: "3×12/jambe", rpe: "RPE8", ref: 16, step: 2, perSide: true },

  // --- SPÉ CONCOURS (poids du corps) ---
  pullups_strict:   { name: "Tractions strictes (max)", scheme: "épreuve", rpe: "—", ref: 0, step: 0, bodyweight: true },
  wallsit:          { name: "Chaise (wall sit)", scheme: "tenue", rpe: "—", ref: 0, step: 0, bodyweight: true, isWallsit: true },
  abs_circuit:      { name: "Gainage / abdos", scheme: "3 tours", rpe: "RPE8", ref: 0, step: 0, bodyweight: true },
};

/* Séances muscu → listes d'exercices (ids).
   Types : push, pull, legs, upper, lower */
export const muscleSessions = {
  pull:  { label: "Pull", aircraft: "mirage", items: ["pullups_weighted", "row_barbell", "lat_pulldown", "face_pull", "curl_ez", "curl_hammer"] },
  push:  { label: "Push", aircraft: "mirage", items: ["bench", "ohp", "incline_db", "lateral_raise", "triceps_pushdown", "rear_fly"] },
  legs:  { label: "Legs", aircraft: "caiman", items: ["hack_squat", "rdl", "hip_thrust", "leg_curl", "leg_extension", "calf_press"] },
  upper: { label: "Upper (spé concours)", aircraft: "tigre", items: ["pullups_strict", "wallsit", "bench", "row_barbell", "lateral_raise", "abs_circuit"] },
  lower: { label: "Lower", aircraft: "caiman", items: ["hack_squat", "rdl", "walking_lunges", "leg_curl", "adductors", "calf_press"] },
};
