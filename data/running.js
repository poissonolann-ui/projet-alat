/* ============================================================
   ACHIEVE — Plan course (MODIFIABLE)
   Bloc 1 défini (4 semaines). Bloc 2 = placeholder.
   Allures calculées depuis la VMA via lib/pace.js :
     allure (min/km à p% VMA) = 60 / (VMA × p)
   Chaque segment porte un pct (0–1.1) → l'app affiche l'allure ≈.
   ============================================================ */

// Note de prudence affichée sur les séances course (asthme d'effort résiduel).
export const runningSafety =
  "Cœur qui monte vite + asthme d'effort résiduel : privilégie la zone 2, " +
  "respiration nasale en EF, échauffe progressivement, n'enchaîne pas les zones hautes sans récup complète.";

/* zone : ef (endurance fondamentale) | seuil | vma | recup | gammes
   pct : % de la VMA pour le calcul d'allure (null = pas d'allure cible) */
export const runningBlocks = [
  {
    id: "bloc1",
    title: "Bloc 1 — Reprise & base aérobie",
    weeks: 4,
    note: "Beaucoup de zone 2, introduction progressive de l'intensité.",
    sessions: [
      {
        week: 1, idx: 1, name: "EF souple",
        segments: [{ label: "Endurance fondamentale", duration: "30’", zone: "ef", pct: 0.62 }],
      },
      {
        week: 1, idx: 2, name: "Pyramide d'allures",
        segments: [
          { label: "EF", duration: "15’", zone: "ef", pct: 0.60 },
          { label: "Tempo", duration: "8’", zone: "seuil", pct: 0.70 },
          { label: "Allure soutenue", duration: "4’", zone: "seuil", pct: 0.80 },
          { label: "Allure VMA", duration: "2’", zone: "vma", pct: 0.90 },
        ],
      },
      {
        week: 1, idx: 3, name: "EF souple",
        segments: [{ label: "Endurance fondamentale", duration: "30’", zone: "ef", pct: 0.62 }],
      },

      {
        week: 2, idx: 1, name: "EF",
        segments: [{ label: "Endurance fondamentale", duration: "35’", zone: "ef", pct: 0.62 }],
      },
      {
        week: 2, idx: 2, name: "Fractionné court",
        segments: [
          { label: "EF + gammes/accélérations", duration: "15’ + 5’", zone: "gammes", pct: 0.60 },
          { label: "4×30”/30” @100% (récup <60%)", duration: "4×30”", zone: "vma", pct: 1.0 },
          { label: "8×20”/10” @110%", duration: "8×20”", zone: "vma", pct: 1.10 },
          { label: "4×40”/20” @100%", duration: "4×40”", zone: "vma", pct: 1.0 },
        ],
      },
      {
        week: 2, idx: 3, name: "EF + côtes",
        segments: [
          { label: "Endurance fondamentale", duration: "35’", zone: "ef", pct: 0.62 },
          { label: "5-6 côtes (50 m vite)", duration: "5-6×", zone: "vma", pct: 1.0 },
        ],
      },

      {
        week: 3, idx: 1, name: "EF",
        segments: [{ label: "Endurance fondamentale", duration: "40’", zone: "ef", pct: 0.62 }],
      },
      {
        week: 3, idx: 2, name: "VMA 2×(8×30”/30”)",
        segments: [
          { label: "Échauffement", duration: "20’", zone: "ef", pct: 0.60 },
          { label: "2×(8×30”/30” @100%, récup <60%, 3’ entre blocs)", duration: "2×8×30”", zone: "vma", pct: 1.0 },
        ],
      },
      {
        week: 3, idx: 3, name: "EF ou repos",
        segments: [{ label: "EF souple (ou repos)", duration: "30-40’", zone: "ef", pct: 0.62 }],
      },

      {
        week: 4, idx: 1, name: "EF",
        segments: [{ label: "Endurance fondamentale", duration: "45’", zone: "ef", pct: 0.62 }],
      },
      {
        week: 4, idx: 2, name: "2×(8×200 m)",
        segments: [
          { label: "Échauffement", duration: "15’", zone: "ef", pct: 0.60 },
          { label: "2×(8×200 m), récup 40”, 3’ entre séries", duration: "2×8×200m", zone: "vma", pct: 1.0 },
        ],
      },
      {
        week: 4, idx: 3, name: "Vélo zone 2",
        segments: [{ label: "Vélo zone 2 (transfert, ménage l'impact)", duration: "50’", zone: "ef", pct: null }],
      },
    ],
  },
  {
    id: "bloc2",
    title: "Bloc 2 — à construire ensemble",
    weeks: 4,
    placeholder: true,
    note: "Bloc 2 à construire ensemble. En attendant, EF par défaut 3×/semaine.",
    sessions: [
      {
        week: 1, idx: 1, name: "EF par défaut",
        segments: [{ label: "Endurance fondamentale (défaut)", duration: "35-40’", zone: "ef", pct: 0.62 }],
      },
    ],
  },
];
