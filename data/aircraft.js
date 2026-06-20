/* ============================================================
   ACHIEVE — Appareils & piliers (MODIFIABLE)
   Chaque pilier d'entraînement est incarné par un appareil (cf. §4).
   svg = silhouette vectorielle dans /public/aircraft/<id>.svg
   photo = visuel plein cadre optionnel (n'utiliser que des images
           dont tu as les droits).
   ============================================================ */

export const aircraft = {
  rafale: {
    id: "rafale",
    name: "Rafale",
    pillar: "Course / VO2 / souffle",
    idea: "Vitesse, agilité",
    svg: "/aircraft/rafale.svg",
    photo: "/aircraft/rafale-solo-climb.webp",
    accent: "var(--rouge-fr)",
    blurb:
      "Le souffle. La vitesse pure, l'agilité dans le ciel. Ici on travaille " +
      "le moteur aérobie : zone 2 longue, VMA ciselée, respiration maîtrisée.",
  },
  mirage: {
    id: "mirage",
    name: "Mirage 2000",
    pillar: "Force / puissance",
    idea: "Héritage, solidité du delta",
    svg: "/aircraft/mirage2000.svg",
    photo: null,
    accent: "var(--sky)",
    blurb:
      "La structure. L'aile delta, la solidité de l'héritage. On bâtit la force : " +
      "couché, rowing, OHP — du lourd, propre, mémorisé.",
  },
  caiman: {
    id: "caiman",
    name: "NH90 Caïman",
    pillar: "Endurance / volume / charge",
    idea: "Porter, durer (ALAT)",
    svg: "/aircraft/caiman.svg",
    photo: null,
    accent: "var(--olive)",
    blurb:
      "Porter et durer. La machine de transport de l'ALAT. Volume, charge, " +
      "jambes : la base qui tient toute la mission.",
  },
  tigre: {
    id: "tigre",
    name: "Tigre",
    pillar: "Mental / précision / la cible",
    idea: "Le but ALAT, viser juste",
    svg: "/aircraft/tigre.svg",
    photo: null,
    accent: "var(--hud)",
    blurb:
      "La cible. L'hélicoptère de combat, la précision. C'est la destination : " +
      "tractions strictes, chaise, gainage — viser juste, tenir le cap mental.",
  },
  mrtt: {
    id: "mrtt",
    name: "A330 MRTT Phénix",
    pillar: "Nutrition",
    idea: "Ravitaillement en vol",
    svg: "/aircraft/mrtt.svg",
    photo: null,
    accent: "var(--sky)",
    blurb:
      "Le ravitaillement en vol. Sans carburant, pas de mission. Macros, " +
      "compléments, hydratation : on remplit les réservoirs au bon moment.",
  },
};

/* Ordre narratif du scrollytelling d'accueil (chasseurs → ALAT). */
export const pillarOrder = ["rafale", "mirage", "mrtt", "caiman", "tigre"];

/* Destination du « plan de vol ». */
export const destination = {
  unit: "5e RHC — Pau",
  patron: "Sainte Clotilde (4 juin)",
  aircraft: ["tigre", "caiman"],
  label: "ALAT",
};
