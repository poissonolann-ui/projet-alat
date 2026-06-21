/* ============================================================
   ACHIEVE — SÉANCE (muscu / course / test / repos)
   Intro aéronef à l'ouverture, puis :
   - poids éditable, reps notées série par série
   - + série / + exercice, charges mémorisées
   - chronomètre gros chiffres (travail / repos)
   ============================================================ */

import { boot, mountHeader } from "./app.js";
import { getState, update } from "./lib/store.js";
import { dayMeta } from "./lib/schedule.js";
import { exercises, muscleSessions, LEVELS, chargeForLevel, roundToStep } from "../data/exercises.js";
import { profile } from "../data/profile.js";
import { runningBlocks, runningSafety } from "../data/running.js";
import { segmentPace, formatSpeed, vmaFromHalfCooper } from "./lib/pace.js";
import { aircraftForType } from "../data/aircraft.js";
import { playIntro } from "./lib/intro.js";
import { todayISO, fromISO, diffDays, DAY_LABELS, MONTH_LABELS, weekdayIndex } from "./lib/date.js";

const params = new URLSearchParams(location.search);
const iso = params.get("date") || todayISO();
const meta = dayMeta(iso);
const host = document.querySelector("[data-session]");
const timerHost = document.querySelector("[data-timer]");

const d = fromISO(iso);
const dateLabel = `${DAY_LABELS[weekdayIndex(d)]} ${d.getDate()} ${MONTH_LABELS[d.getMonth()]}`;
mountHeader(meta.label, dateLabel, "today.html");

/* ---------- Helpers ---------- */
function currentLevel() { return getState().levelByDate[iso] || "ok"; }
function setLevel(id) { update((s) => { s.levelByDate[iso] = id; }); renderMuscle(); }
function refFor(exId, fallback) { const o = getState().chargeRefs[exId]; return o != null ? o : fallback; }

function wallsitTargetSec() {
  const weeks = Math.max(0, Math.floor(diffDays(d, fromISO(profile.prepStartDate)) / 7));
  return Math.min(270, 100 + weeks * 10);
}
function fmtTime(sec) { const m = Math.floor(sec / 60), s = sec % 60; return `${m}’${String(s).padStart(2, "0")}`; }

function parseScheme(scheme) {
  const s = String(scheme);
  const m = s.match(/^(\d+)\s*×\s*(.+)$/);
  if (m) return { sets: Number(m[1]), rep: m[2].replace(/\s*\/.*/, "").trim() };
  if (/tour/.test(s)) { const t = s.match(/(\d+)/); return { sets: t ? Number(t[1]) : 3, rep: "" }; }
  return { sets: 1, rep: "" };
}

/* Liste des exercices du jour = gabarit + exercices ajoutés à la volée. */
function entriesForSession() {
  const def = muscleSessions[meta.type];
  const base = def ? def.items.map((id) => ({ id, ex: exercises[id] })).filter((e) => e.ex) : [];
  const extra = (getState().exExtra[iso] || []).map((x) => ({
    id: x.id,
    ex: { name: x.name, scheme: x.scheme || "3×10", rpe: "", ref: 0, step: 0, bodyweight: true, extra: true },
  }));
  return [...base, ...extra];
}

/* ---------- Rendu MUSCU ---------- */
function renderMuscle() {
  const def = muscleSessions[meta.type];
  const isExtraOnly = !def && (getState().exExtra[iso] || []).length;
  if (!def && !isExtraOnly) { renderUnknown(); return; }

  const level = currentLevel();
  const state = getState();
  const done = state.sessionStatus[iso] === "done";

  const levelBtns = Object.values(LEVELS).map((l) =>
    `<button data-level="${l.id}" aria-pressed="${l.id === level}">${l.label}</button>`
  ).join("");

  const exHtml = entriesForSession().map(({ id: exId, ex }) => {
    const parsed = parseScheme(ex.scheme);
    const extraSets = (state.setsExtra[iso] && state.setsExtra[iso][exId]) || 0;
    const nSets = parsed.sets + extraSets;
    const reps = (state.setReps[iso] && state.setReps[iso][exId]) || [];
    const checks = (state.setsDone[iso] && state.setsDone[iso][exId]) || [];

    // Charge
    let chargeBlock = "";
    if (ex.isWallsit) {
      chargeBlock = `<div class="ex-charge"><span class="val">${fmtTime(wallsitTargetSec())}</span><span class="unit">cible du jour</span></div>`;
    } else if (ex.ref > 0) {
      const val = chargeForLevel(refFor(exId, ex.ref), ex.step, level);
      const unit = ex.perSide ? "kg / côté" : "kg";
      const label = ex.bodyweight ? `PDC +${val}` : `${val}`;
      chargeBlock = `
        <div class="ex-charge">
          <span class="val" data-charge="${exId}">${label}</span>
          <span class="unit">${ex.bodyweight ? "" : unit}</span>
          <span class="stepper">
            <button data-step="${exId}" data-dir="-1" aria-label="Diminuer le poids">–</button>
            <button data-step="${exId}" data-dir="1" aria-label="Augmenter le poids">+</button>
          </span>
        </div>`;
    } else if (ex.bodyweight) {
      chargeBlock = `<div class="ex-charge"><span class="val">Poids du corps</span></div>`;
    }

    const rows = Array.from({ length: nSets }, (_, i) => `
      <div class="set-row">
        <span class="set-n">S${i + 1}</span>
        <input class="rep-input" type="number" inputmode="numeric" min="0" step="1"
               placeholder="${parsed.rep || "reps"}" value="${reps[i] ?? ""}"
               data-rep="${exId}" data-i="${i}" aria-label="Reps série ${i + 1}" />
        <button class="set-check" data-set="${exId}" data-i="${i}" aria-pressed="${!!checks[i]}" aria-label="Valider la série ${i + 1}">✓</button>
      </div>`).join("");

    return `
      <article class="ex">
        <div class="ex-head">
          <span class="ex-name">${ex.name}</span>
          <span class="ex-scheme">${ex.scheme}</span>
        </div>
        <div class="ex-meta">
          ${ex.rpe && ex.rpe !== "—" ? `<span>${ex.rpe}</span>` : ""}
          ${ex.note ? `<span>· ${ex.note}</span>` : ""}
        </div>
        ${chargeBlock}
        <div class="set-table">${rows}</div>
        <div class="ex-actions"><button class="mini-btn" data-addset="${exId}">+ série</button></div>
      </article>`;
  }).join("");

  host.innerHTML = `
    <p class="eyebrow">Niveau du jour · ajuste les charges</p>
    <div class="level-switch">${levelBtns}</div>
    <p class="note">${LEVELS[level].hint} — référence ×${LEVELS[level].mult.toFixed(2)}.</p>
    ${(meta.type === "upper" || meta.type === "lower" || meta.type === "legs")
      ? `<p class="note accent-hud mono">Chaise du jour : ${fmtTime(wallsitTargetSec())} (cible concours 4’20)</p>` : ""}
    <div style="margin-top:var(--sp-4)">${exHtml}</div>
    <button class="add-ex-btn" data-addex>+ Ajouter un exercice</button>
    <button class="btn ${done ? "btn-hud" : "btn-primary"} btn-block" data-validate style="margin-top:var(--sp-5)">
      ${done ? "✓ Séance validée — re-valider" : "Valider la séance"}
    </button>
    <a class="btn btn-ghost btn-block" href="today.html" style="margin-top:var(--sp-3)">↩ Pilotage</a>
  `;
  mountTimer();
}

/* ---------- Rendu COURSE ---------- */
function renderRunning() {
  const vma = getState().settings.vma || profile.vma;
  const variant = meta.variant;
  let session = null;
  for (const blk of runningBlocks) {
    for (const s of blk.sessions) {
      if ((variant === "vma" && /vma|fractionn|200|30”|côtes/i.test(s.name)) ||
          (variant !== "vma" && /ef|souple|endurance/i.test(s.name))) { session = s; break; }
    }
    if (session) break;
  }
  if (!session) session = runningBlocks[0].sessions[0];

  const segs = session.segments.map((seg) => {
    const pace = segmentPace(vma, seg.pct);
    const spd = formatSpeed(vma, seg.pct);
    return `
      <div class="seg zone-${seg.zone}">
        <span class="seg-dur">${seg.duration}</span>
        <span class="seg-label">${seg.label}</span>
        ${pace ? `<span class="seg-pace">≈ ${pace} · ${spd}${seg.pct ? ` · ${Math.round(seg.pct * 100)}% VMA` : ""}</span>` : ""}
      </div>`;
  }).join("");
  const done = getState().sessionStatus[iso] === "done";

  host.innerHTML = `
    <p class="eyebrow">Course · VMA ${vma.toFixed(2)} km/h</p>
    <h2 style="font-size:var(--fs-600)">${session.name}</h2>
    <div class="warn" style="margin:var(--sp-4) 0">${runningSafety}</div>
    <div>${segs}</div>
    <button class="btn ${done ? "btn-hud" : "btn-primary"} btn-block" data-validate style="margin-top:var(--sp-5)">
      ${done ? "✓ Séance validée — re-valider" : "Valider la séance"}
    </button>
    <a class="btn btn-ghost btn-block" href="today.html" style="margin-top:var(--sp-3)">↩ Pilotage</a>
  `;
  mountTimer();
}

/* ---------- Rendu TEST ---------- */
function renderTest() {
  const state = getState();
  const last = state.tests[state.tests.length - 1] || {};
  host.innerHTML = `
    <p class="eyebrow">Test · on mesure les progrès</p>
    <h2 style="font-size:var(--fs-600)">Saisie des résultats</h2>
    <div class="field"><label for="hc">Demi-Cooper — distance en 6 min (m)</label>
      <input id="hc" type="number" inputmode="numeric" placeholder="ex : 1225" value="${last.halfCooperM || ""}" /></div>
    <p class="note">La VMA se met à jour automatiquement (distance ÷ 100).</p>
    <div class="field"><label for="pu">Tractions strictes (max)</label>
      <input id="pu" type="number" inputmode="numeric" placeholder="ex : 14" value="${last.pullupsMax || ""}" /></div>
    <div class="field"><label for="ws">Chaise / wall sit (secondes)</label>
      <input id="ws" type="number" inputmode="numeric" placeholder="ex : 140" value="${last.wallsitS || ""}" /></div>
    <div class="field"><label for="ll">Luc Léger (palier atteint)</label>
      <input id="ll" type="number" step="0.5" inputmode="decimal" placeholder="ex : 7.5" value="${last.lucleger || ""}" /></div>
    <button class="btn btn-primary btn-block" data-savetest style="margin-top:var(--sp-4)">Enregistrer le test</button>
    <p class="note" data-test-feedback></p>
    <a class="btn btn-ghost btn-block" href="tracking.html" style="margin-top:var(--sp-3)">Voir le suivi →</a>
  `;
  host.querySelector("[data-savetest]").addEventListener("click", () => {
    const hc = Number(host.querySelector("#hc").value) || null;
    const pu = Number(host.querySelector("#pu").value) || null;
    const ws = Number(host.querySelector("#ws").value) || null;
    const ll = Number(host.querySelector("#ll").value) || null;
    const vma = hc ? vmaFromHalfCooper(hc) : null;
    update((s) => {
      s.tests.push({ iso, halfCooperM: hc, pullupsMax: pu, wallsitS: ws, lucleger: ll, vma });
      if (vma) s.settings.vma = vma;
      s.sessionStatus[iso] = "done";
    });
    const fb = host.querySelector("[data-test-feedback]");
    fb.classList.add("accent-hud");
    fb.textContent = vma ? `✓ Enregistré. Nouvelle VMA : ${vma.toFixed(2)} km/h.` : "✓ Enregistré.";
  });
}

function renderRest() {
  host.innerHTML = `
    <h2 style="font-size:var(--fs-600)">RTB — Retour à la base</h2>
    <p class="dim">Récupération programmée. Hydrate, dors, marche. Le repos fait partie du plan de vol.</p>
    <a class="btn btn-ghost btn-block" href="today.html" style="margin-top:var(--sp-4)">↩ Pilotage</a>
  `;
}

function renderUnknown() {
  host.innerHTML = `<p class="dim">Type de séance non reconnu.</p>
    <button class="add-ex-btn" data-addex>+ Ajouter un exercice</button>
    <a class="btn btn-ghost btn-block" href="today.html" style="margin-top:var(--sp-4)">↩ Pilotage</a>`;
}

/* ---------- Délégation : clics ---------- */
host.addEventListener("click", (e) => {
  const lvl = e.target.closest("[data-level]");
  if (lvl) { setLevel(lvl.dataset.level); return; }

  const step = e.target.closest("[data-step]");
  if (step) {
    const exId = step.dataset.step, ex = exercises[exId];
    const dir = Number(step.dataset.dir), level = currentLevel();
    const shown = chargeForLevel(refFor(exId, ex.ref), ex.step, level);
    const newShown = Math.max(0, shown + dir * (ex.step || 1));
    const newRef = roundToStep(newShown / LEVELS[level].mult, ex.step);
    update((s) => { s.chargeRefs[exId] = newRef; });
    renderMuscle();
    return;
  }

  const setDot = e.target.closest("[data-set]");
  if (setDot) {
    const exId = setDot.dataset.set, i = Number(setDot.dataset.i);
    update((s) => {
      s.setsDone[iso] = s.setsDone[iso] || {};
      s.setsDone[iso][exId] = s.setsDone[iso][exId] || [];
      s.setsDone[iso][exId][i] = !s.setsDone[iso][exId][i];
    });
    setDot.setAttribute("aria-pressed", String(!(setDot.getAttribute("aria-pressed") === "true")));
    return;
  }

  const addSet = e.target.closest("[data-addset]");
  if (addSet) {
    const exId = addSet.dataset.addset;
    update((s) => {
      s.setsExtra[iso] = s.setsExtra[iso] || {};
      s.setsExtra[iso][exId] = (s.setsExtra[iso][exId] || 0) + 1;
    });
    renderMuscle();
    return;
  }

  if (e.target.closest("[data-addex]")) {
    const name = prompt("Nom de l'exercice :");
    if (!name) return;
    update((s) => {
      s.exExtra[iso] = s.exExtra[iso] || [];
      s.exExtra[iso].push({ id: `x_${Date.now()}`, name: name.trim(), scheme: "3×10" });
    });
    renderMuscle();
    return;
  }

  if (e.target.closest("[data-validate]")) {
    update((s) => { s.sessionStatus[iso] = "done"; });
    const btn = e.target.closest("[data-validate]");
    btn.classList.remove("btn-primary"); btn.classList.add("btn-hud");
    btn.textContent = "✓ Séance validée — re-valider";
  }
});

/* ---------- Délégation : saisie des reps ---------- */
host.addEventListener("input", (e) => {
  const rep = e.target.closest("[data-rep]");
  if (!rep) return;
  const exId = rep.dataset.rep, i = Number(rep.dataset.i);
  const v = rep.value === "" ? null : Math.max(0, Number(rep.value));
  update((s) => {
    s.setReps[iso] = s.setReps[iso] || {};
    s.setReps[iso][exId] = s.setReps[iso][exId] || [];
    s.setReps[iso][exId][i] = v;
  });
});

/* ---------- Chronomètre (gros chiffres, travail / repos) ---------- */
function mountTimer() {
  if (meta.type === "rest" || meta.type === "test") { timerHost.innerHTML = ""; return; }
  if (timerHost.dataset.mounted) return;
  timerHost.dataset.mounted = "1";
  timerHost.innerHTML = `
    <div class="timer-bar">
      <span class="timer-display" data-tdisplay>0:00</span>
      <button class="t-btn primary" data-tstart>Start</button>
      <button class="t-btn" data-treset>Reset</button>
      <span class="stepper" style="margin-left:auto;gap:var(--sp-1)">
        <button class="t-btn" data-rest="60">60″</button>
        <button class="t-btn" data-rest="90">90″</button>
        <button class="t-btn" data-rest="120">2′</button>
        <button class="t-btn" data-rest="180">3′</button>
      </span>
    </div>`;
  let t = 0, id = null, mode = "up";
  const disp = timerHost.querySelector("[data-tdisplay]");
  const startBtn = timerHost.querySelector("[data-tstart]");
  const show = () => { const m = Math.floor(Math.abs(t) / 60), s = Math.abs(t) % 60; disp.textContent = `${m}:${String(s).padStart(2, "0")}`; };
  const tick = () => {
    if (mode === "up") t++;
    else { t--; if (t <= 0) { stop(); disp.classList.add("rest"); navigator.vibrate && navigator.vibrate(200); } }
    show();
  };
  const start = () => { if (id) return; id = setInterval(tick, 1000); startBtn.textContent = "Pause"; };
  const stop = () => { clearInterval(id); id = null; startBtn.textContent = "Start"; };
  startBtn.addEventListener("click", () => { id ? stop() : start(); });
  timerHost.querySelector("[data-treset]").addEventListener("click", () => { stop(); mode = "up"; t = 0; disp.classList.remove("rest"); show(); });
  timerHost.querySelectorAll("[data-rest]").forEach((b) =>
    b.addEventListener("click", () => { stop(); mode = "down"; t = Number(b.dataset.rest); disp.classList.add("rest"); show(); start(); }));
}

/* ---------- Dispatch (+ intro aéronef en surimpression) ---------- */
function dispatch() {
  if (meta.type === "course") renderRunning();
  else if (meta.type === "test") renderTest();
  else if (meta.type === "rest") renderRest();
  else renderMuscle();
}
dispatch();
boot();
playIntro(aircraftForType(meta.type)); // overlay au-dessus de la séance déjà rendue
