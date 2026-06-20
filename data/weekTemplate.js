/* ============================================================
   ACHIEVE — Gabarit hebdomadaire par défaut (MODIFIABLE)
   4 muscu + 3 course. Index 0 = Lundi … 6 = Dimanche.
   type ∈ course | pull | legs | push | upper | lower | rest | test
   ============================================================ */

export const weekTemplate = [
  { day: "Lun", type: "course", variant: "ef",  label: "Course — Endurance" },
  { day: "Mar", type: "pull",   label: "Pull" },
  { day: "Mer", type: "course", variant: "vma", label: "Course — VMA" },
  { day: "Jeu", type: "legs",   label: "Legs" },
  { day: "Ven", type: "push",   label: "Push" },
  { day: "Sam", type: "course", variant: "ef",  label: "Course — Sortie longue" },
  { day: "Dim", type: "upper",  label: "Upper — Spé concours", restable: true },
];

/* Couleurs/labels de statut centralisés. */
export const SESSION_TYPES = {
  course: { label: "Course", color: "var(--sky)" },
  pull:   { label: "Pull",   color: "var(--steel)" },
  push:   { label: "Push",   color: "var(--steel)" },
  legs:   { label: "Legs",   color: "var(--steel)" },
  upper:  { label: "Upper",  color: "var(--hud)" },
  lower:  { label: "Lower",  color: "var(--steel)" },
  rest:   { label: "Rest",   color: "var(--ink-dim)" },
  test:   { label: "Test",   color: "var(--rouge-fr)" },
};
