/* ============================================================
   ACHIEVE — Nutrition (MODIFIABLE) — univers A330 MRTT « ravitaillement »
   3 journées types selon le type de séance (cf. §7).
   ============================================================ */

export const nutritionDays = {
  muscu: { id: "muscu", label: "Jour muscu",  kcal: 2500, p: 180, g: 290, l: 70 },
  course: { id: "course", label: "Jour course", kcal: 2450, p: 175, g: 295, l: 65 },
  repos: { id: "repos", label: "Jour repos",  kcal: 2150, p: 180, g: 180, l: 70 },
};

/* Mappe un type de séance → journée nutrition. */
export function nutritionForSessionType(type) {
  if (type === "course") return nutritionDays.course;
  if (type === "rest") return nutritionDays.repos;
  if (type === "test") return nutritionDays.course;
  return nutritionDays.muscu; // pull/push/legs/upper/lower
}

/* Checklist compléments + hydratation. PAS de whey (cf. profil). */
export const supplements = [
  { id: "creatine", label: "Créatine 5 g", daily: true, note: "Tous les jours, même repos." },
  { id: "vitd", label: "Vitamine D", daily: true },
  { id: "vitc", label: "Vitamine C", daily: true },
  { id: "omega3", label: "Oméga 3", daily: true },
  { id: "hydration", label: "Hydratation 2,5–3,5 L", daily: true, note: "Ravitaillement en vol : régulier, pas en une fois." },
];

export const nutritionAdvice = [
  "Ancre chaque repas sur la protéine (œufs, viande/poisson, skyr) avant tout le reste.",
  "Chez tes parents (magasin = tentation de produits transformés) : respecte l'enveloppe calorique plutôt que viser la perfection.",
  "Perte saine visée : 0,4–0,6 kg/semaine. Trop vite = perte de muscle et de force aux tractions.",
  "Glucides surtout autour des séances (course/muscu) ; jour repos = on baisse les glucides, on garde la protéine.",
];
