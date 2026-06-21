/* ============================================================
   ACHIEVE — Store local (localStorage + fallback mémoire)
   100 % sur l'appareil. Aucune requête réseau.
   Si localStorage est indisponible (mode privé Safari, quota),
   on bascule en mémoire sans casser l'app (cf. §9).
   ============================================================ */

const KEY = "achieve.v1";

// Détection robuste de localStorage.
let backend = null;
let memory = {};
try {
  const t = "__achieve_probe__";
  localStorage.setItem(t, "1");
  localStorage.removeItem(t);
  backend = localStorage;
} catch (_e) {
  backend = null; // fallback mémoire
  console.warn("[ACHIEVE] localStorage indisponible → stockage en mémoire (non persistant).");
}

export const storageAvailable = backend !== null;

/* État par défaut. Tout ce que l'utilisateur modifie vit ici. */
function defaultState() {
  return {
    version: 1,
    // overrides de charges de référence "En forme" par exercice : { [exId]: kg }
    chargeRefs: {},
    // niveau du jour mémorisé par date ISO : { [iso]: "tired|ok|peak" }
    levelByDate: {},
    // séries cochées : { [iso]: { [exId]: [bool, bool, ...] } }
    setsDone: {},
    // reps notées par série : { [iso]: { [exId]: [reps, reps, ...] } }
    setReps: {},
    // séries ajoutées au-delà du gabarit : { [iso]: { [exId]: nbSupplément } }
    setsExtra: {},
    // exercices ajoutés à la volée : { [iso]: [{ id, name }] }
    exExtra: {},
    // pas du jour : { [iso]: nombre }
    steps: {},
    // RETEX hebdo (clé = lundi ISO) : { [isoLundi]: texte }
    retex: {},
    // statut de séance par date : { [iso]: "done" } (validée)
    sessionStatus: {},
    // type de séance surchargé par date : { [iso]: "push|pull|..." }
    sessionTypeByDate: {},
    // jours de travail (dispo réduite) : { [iso]: true }
    workDays: {},
    // apport alimentaire loggé par date : { [iso]: { p, g, l, water } } (g et mL)
    intake: {},
    // poids relevés : [{ iso, kg }]
    weightLog: [],
    // résultats de tests : [{ iso, halfCooperM, pullupsMax, wallsitS, vma }]
    tests: [],
    // checklist nutrition par date : { [iso]: { [suppId]: bool } }
    nutritionChecks: {},
    // réglages utilisateur (surchargent data/profile.js)
    settings: {}, // { vma, weightTargetKg, contestDate }
  };
}

function read() {
  if (!backend) return memory.__state || (memory.__state = defaultState());
  try {
    const raw = backend.getItem(KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return { ...defaultState(), ...parsed };
  } catch (_e) {
    return defaultState();
  }
}

function write(state) {
  if (!backend) {
    memory.__state = state;
    return;
  }
  try {
    backend.setItem(KEY, JSON.stringify(state));
  } catch (_e) {
    // quota / mode privé : on garde au moins la session en mémoire
    memory.__state = state;
  }
}

/* ---- API publique ---- */

const subscribers = new Set();
export function subscribe(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}
function notify() {
  subscribers.forEach((fn) => {
    try { fn(read()); } catch (_e) {}
  });
}

export function getState() {
  return read();
}

/* Mise à jour fonctionnelle : update(state => mutate). */
export function update(mutator) {
  const state = read();
  mutator(state);
  write(state);
  notify();
  return state;
}

export function getSetting(key, fallback) {
  const s = read();
  return s.settings && s.settings[key] != null ? s.settings[key] : fallback;
}

export function setSetting(key, value) {
  return update((s) => { s.settings[key] = value; });
}

/* ---- Export / Import JSON (sauvegarde manuelle) ---- */

export function exportJSON() {
  const state = read();
  const stamp = new Date().toISOString().slice(0, 10);
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `achieve-sauvegarde-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function importJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (typeof data !== "object" || data === null) throw new Error("Format invalide");
        write({ ...defaultState(), ...data });
        notify();
        resolve(data);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

export function resetAll() {
  write(defaultState());
  notify();
}
