/* ============================================================
   ACHIEVE — Profil & objectifs (MODIFIABLE)
   Modifie librement ces valeurs : elles pilotent les calculs,
   le compte à rebours et les jauges-instruments.
   ============================================================ */

export const profile = {
  name: "Pilote",
  age: 27,
  heightCm: 182,
  weightKg: 82,
  weightTargetKg: 77,
  bodyFatTargetPct: 10,
  morpho: "ectomorphe",

  // VMA estimée (km/h) — mise à jour auto par le test demi-Cooper (distance ÷ 100).
  vma: 12.25,

  // Date repère du concours ALAT (non fixée → ajustable dans Réglages).
  // Format ISO. Pilote le compte à rebours et le "tu es ici" du plan de vol.
  contestDate: "2026-11-16",

  // Date de début de préparation (ancre le plan de vol 6 mois).
  prepStartDate: "2026-06-01",

  // Fil rouge émotionnel.
  tagline: "Achieve your dream",
  mission:
    "Réussir la sélection pilote ALAT — dernière tentative. " +
    "Cap sur le 5e RHC de Pau : Tigre & NH90 Caïman.",

  // Coordonnées HUD (Portsall) — signature visuelle.
  coords: { label: "PORTSALL", dms: "48°34′N 4°45′W" },
};

/* Les 3 épreuves physiques visées → jauges-instruments.
   value = actuel, target = objectif. unit/format pour l'affichage. */
export const goals = [
  {
    id: "pullups",
    label: "Tractions strictes",
    aircraft: "tigre",
    value: 14,
    target: 17,
    unit: "reps",
    format: "int",
  },
  {
    id: "wallsit",
    label: "Chaise (wall sit)",
    aircraft: "caiman",
    value: 120, // secondes (2'00)
    target: 260, // 4'20
    unit: "s",
    format: "time",
  },
  {
    id: "lucleger",
    label: "Luc Léger",
    aircraft: "rafale",
    value: 7.5,
    target: 10,
    unit: "palier",
    format: "dec",
  },
];
