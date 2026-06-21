/* ============================================================
   ACHIEVE — Aujourd'hui (poste de pilotage quotidien)
   "Que dois-je faire aujourd'hui ?" + compte à rebours + accès direct.
   ============================================================ */

import { boot } from "./app.js";
import { profile } from "../data/profile.js";
import { getState, setSetting } from "./lib/store.js";
import { dayMeta, statusFor, labelForType, workDayAdvice } from "./lib/schedule.js";
import { nutritionForSessionType } from "../data/nutrition.js";
import { todayISO, daysUntil, fromISO, DAY_LABELS, MONTH_LABELS, weekdayIndex } from "./lib/date.js";

// Premier lancement : on montre l'intro cinématique une seule fois,
// puis l'app ouvre toujours directement sur le Poste de pilotage.
if (!getState().settings.seenIntro) {
  setSetting("seenIntro", true);
  location.replace("index.html");
}

const host = document.querySelector("[data-today]");
const iso = todayISO();
const meta = dayMeta(iso);
const d = fromISO(iso);
const contestDate = getState().settings.contestDate || profile.contestDate;
const dleft = daysUntil(contestDate);
const status = statusFor(iso);
const nut = nutritionForSessionType(meta.type);
const advice = workDayAdvice(iso);

const dateLabel = `${DAY_LABELS[weekdayIndex(d)]} ${d.getDate()} ${MONTH_LABELS[d.getMonth()]}`;
const sessionHref = `session.html?date=${iso}`;

const statusChip = {
  done: '<span class="chip accent-hud">✓ Validée</span>',
  miss: '<span class="chip accent-red">Manquée</span>',
  grey: meta.type === "rest" ? '<span class="chip dim">Repos</span>' : '<span class="chip dim">À faire</span>',
}[status];

host.innerHTML = `
  <header style="display:flex;align-items:baseline;justify-content:space-between;gap:1rem">
    <div>
      <p class="eyebrow">⊕ ACHIEVE</p>
      <h1 style="font-size:var(--fs-700)">Aujourd'hui</h1>
      <p class="mono dim">${dateLabel}</p>
    </div>
  </header>

  <section class="card" data-reveal style="margin-top:var(--sp-5)">
    <p class="eyebrow">Compte à rebours · Sélection ALAT</p>
    <div class="countdown">
      <span class="num accent-red">${dleft > 0 ? dleft : 0}</span>
      <span class="lbl">jours<br/>avant le jour J</span>
    </div>
    <p class="dim" style="margin-top:var(--sp-2)">${profile.mission}</p>
  </section>

  <section class="card ${status === "done" ? "is-done" : ""}" data-reveal style="margin-top:var(--sp-4)">
    <p class="eyebrow">Séance du jour ${statusChip}</p>
    <h2 style="font-size:var(--fs-600);margin-top:var(--sp-1)">${meta.label}</h2>
    <p class="dim">${sessionSubtitle(meta)}</p>
    ${advice ? `<p class="note">💼 ${advice}</p>` : ""}
    ${meta.type === "rest"
      ? `<p class="note">Jour de récupération. Hydrate, dors, marche un peu.</p>`
      : `<a class="btn btn-primary btn-block" href="${sessionHref}" style="margin-top:var(--sp-4)">
           Ouvrir la séance →
         </a>`}
  </section>

  <section class="card" data-reveal style="margin-top:var(--sp-4)">
    <p class="eyebrow">Ravitaillement · ${nut.label}</p>
    <div class="macro-grid" style="margin-top:var(--sp-3)">
      <div class="macro"><div class="v">${nut.p}</div><div class="k">Prot. g</div></div>
      <div class="macro"><div class="v">${nut.g}</div><div class="k">Gluc. g</div></div>
      <div class="macro"><div class="v">${nut.l}</div><div class="k">Lip. g</div></div>
    </div>
    <p class="dim" style="margin-top:var(--sp-3)">${nut.kcal} kcal · objectif du jour</p>
    <a class="btn btn-ghost btn-block" href="nutrition.html" style="margin-top:var(--sp-3)">Détail nutrition →</a>
  </section>

  <nav class="stack" data-reveal style="margin-top:var(--sp-5)">
    <a class="btn btn-block" href="planning.html">Planning</a>
    <a class="btn btn-block" href="tracking.html">Suivi &amp; réglages</a>
    <a class="btn btn-ghost btn-block" href="index.html">↩ Retour à l'accueil</a>
  </nav>
`;

function sessionSubtitle(m) {
  if (m.type === "course") {
    return m.variant === "vma" ? "Séance VMA — fractionné, prudence zone haute." : "Course en endurance — beaucoup de zone 2.";
  }
  if (m.type === "upper") return "Spé concours : tractions, chaise, gainage.";
  if (m.type === "rest") return "Repos programmé.";
  if (m.type === "test") return "Jour de test — on mesure les progrès.";
  return "Musculation — charges adaptées à ta forme du jour.";
}

boot();
