/* ============================================================
   ACHIEVE — Accueil : génération du contenu + cinématique
   ============================================================ */

import { registerSW } from "./app.js";
import { mountMenu } from "./menu.js";
import { initReveals, prefersReducedMotion } from "./lib/motion.js";
import { aircraft, pillarOrder, destination } from "../data/aircraft.js";
import { goals, profile } from "../data/profile.js";
import { getState } from "./lib/store.js";
import { daysUntil, fromISO, MONTH_LABELS } from "./lib/date.js";

/* ---------- Helpers de format ---------- */
function fmtGoal(g, v) {
  if (g.format === "time") {
    const m = Math.floor(v / 60), s = Math.round(v % 60);
    return `${m}’${String(s).padStart(2, "0")}`;
  }
  if (g.format === "dec") return v.toFixed(1);
  return Math.round(v).toString();
}

/* Interpolation couleur rouge → vert HUD selon le ratio d'atteinte. */
function mixColor(ratio) {
  const a = [200, 16, 46];   // rouge-fr
  const b = [200, 224, 138]; // hud
  const t = Math.max(0, Math.min(1, ratio));
  const c = a.map((x, i) => Math.round(x + (b[i] - x) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

/* ---------- Jauges-instruments (cadrans SVG) ---------- */
function buildGauges() {
  const host = document.querySelector("[data-gauges]");
  if (!host) return;
  const state = getState();
  // Valeurs courantes éventuellement mises à jour par les tests.
  const lastTest = state.tests[state.tests.length - 1];

  host.innerHTML = goals.map((g) => {
    let cur = g.value;
    if (lastTest) {
      if (g.id === "pullups" && lastTest.pullupsMax != null) cur = lastTest.pullupsMax;
      if (g.id === "wallsit" && lastTest.wallsitS != null) cur = lastTest.wallsitS;
    }
    const ratio = Math.max(0, Math.min(1, cur / g.target));
    const L = 131.95; // longueur du demi-cercle r=42
    const color = mixColor(ratio);
    return `
      <div class="gauge" data-gauge data-ratio="${ratio}">
        <svg viewBox="0 0 100 64" aria-hidden="true">
          <path class="gauge-arc-bg" d="M8 50 A42 42 0 0 1 92 50"/>
          <path class="gauge-arc-fg" d="M8 50 A42 42 0 0 1 92 50"
                stroke="${color}" stroke-dasharray="${L}" stroke-dashoffset="${L}"
                data-len="${L}" data-target-offset="${L * (1 - ratio)}"/>
        </svg>
        <div class="g-val">${fmtGoal(g, cur)} <span class="g-lbl">/ ${fmtGoal(g, g.target)}</span></div>
        <div class="g-lbl">${g.label}</div>
      </div>`;
  }).join("");

  // Animation de remplissage à l'apparition.
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.querySelectorAll(".gauge-arc-fg").forEach((arc) => {
        const off = prefersReducedMotion() ? arc.dataset.targetOffset : arc.dataset.targetOffset;
        requestAnimationFrame(() => { arc.style.strokeDashoffset = off; });
      });
      io.unobserve(e.target);
    });
  }, { threshold: 0.4 });
  host.querySelectorAll("[data-gauge]").forEach((el) => io.observe(el));
}

/* ---------- Piliers / appareils ---------- */
function buildPillars() {
  const host = document.querySelector("[data-pillars]");
  if (!host) return;
  host.innerHTML = pillarOrder.map((id, i) => {
    const a = aircraft[id];
    return `
      <section class="pillar" data-accent="${id}" data-pillar>
        <div class="pillar-figure">
          <div class="reticle" data-reticle>
            <svg viewBox="0 0 56 56" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true">
              <circle cx="28" cy="28" r="20" stroke-opacity="0.6"/>
              <path d="M28 4v10M28 42v10M4 28h10M42 28h10"/>
              <circle cx="28" cy="28" r="3" fill="currentColor" stroke="none"/>
            </svg>
          </div>
          <span class="silhouette" role="img" aria-label="Silhouette ${a.name}" data-parallax style="--m:url(${a.svg})"></span>
        </div>
        <p class="eyebrow" data-reveal><span class="num">0${i + 1}</span> · ${a.pillar}</p>
        <p class="pillar-aircraft" data-reveal>${a.name}</p>
        <h2 data-reveal data-reveal-delay="60">${a.idea}</h2>
        <p data-reveal data-reveal-delay="120">${a.blurb}</p>
      </section>`;
  }).join("");
}

/* ---------- Plan de vol (waypoints) ---------- */
function buildFlightplan() {
  const host = document.querySelector("[data-flightplan]");
  if (!host) return;

  const start = fromISO(profile.prepStartDate);
  const contest = fromISO(getState().settings.contestDate || profile.contestDate);
  const now = new Date();

  const waypoints = [
    { code: "WP00", title: "Départ — Base aérobie & force", desc: "Zone 2, charges de référence, on installe la routine." },
    { code: "WP01", title: "Bloc 1 course terminé", desc: "Reprise du moteur aérobie, premières séances VMA." },
    { code: "WP02", title: "Volume & charge (Caïman)", desc: "On porte et on dure : jambes, dos, endurance." },
    { code: "WP03", title: "Intensité VMA (Rafale)", desc: "Affinage du souffle, paliers Luc Léger qui montent." },
    { code: "WP04", title: "Affûtage & tests (Tigre)", desc: "On vise juste : tractions strictes, chaise 4’20." },
    { code: "DEST", title: `${destination.label} — Sélection`, desc: `${destination.unit}. Achieve your dream.`, dest: true },
  ];

  // "Tu es ici" : position relative dans la fenêtre de prépa.
  const totalMs = contest - start;
  const elapsed = Math.max(0, Math.min(1, (now - start) / totalMs));
  const hereIndex = Math.min(waypoints.length - 2, Math.floor(elapsed * (waypoints.length - 1)));

  const line = host.querySelector(".fp-line");
  host.innerHTML = "";
  host.appendChild(line);

  waypoints.forEach((wp, i) => {
    const here = i === hereIndex;
    const el = document.createElement("div");
    el.className = `waypoint${here ? " is-here" : ""}${wp.dest ? " is-dest" : ""}`;
    el.setAttribute("data-reveal", "");
    el.innerHTML = `
      <span class="wp-code">${wp.code}</span>
      <h3>${wp.title}</h3>
      <p class="dim">${wp.desc}</p>
      ${here ? `<span class="wp-here">⊕ Tu es ici</span>` : ""}
    `;
    host.appendChild(el);
  });
}

/* ---------- Cinématique GSAP + Lenis (accueil uniquement) ---------- */
function loadScript(src) {
  return new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = src; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
}

async function initCinematic() {
  if (prefersReducedMotion()) return; // tout coupé proprement
  try {
    await loadScript("/js/vendor/gsap.min.js");
    await loadScript("/js/vendor/ScrollTrigger.min.js");
    await loadScript("/js/vendor/lenis.min.js");
  } catch (_e) {
    return; // pas de cinématique → l'app reste pleinement utilisable
  }
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  const Lenis = window.Lenis;
  if (!gsap || !ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  // Smooth-scroll Lenis synchronisé avec ScrollTrigger.
  if (Lenis) {
    const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothTouch: false });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // 1) Hero Ken Burns piloté par le scroll (transform only).
  const heroImg = document.querySelector("[data-hero-media] img");
  if (heroImg) {
    gsap.to(heroImg, {
      scale: 1.28, yPercent: 8,
      ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });
  }
  // Bloc HUD du hero : entre en fondu au scroll.
  gsap.fromTo("[data-hero-hud]",
    { autoAlpha: 0, y: -10 },
    { autoAlpha: 1, y: 0, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "20% top", scrub: true } });

  // 2) Parallaxe des silhouettes + verrouillage réticule.
  document.querySelectorAll("[data-pillar]").forEach((p) => {
    const sil = p.querySelector("[data-parallax]");
    if (sil) {
      gsap.fromTo(sil, { yPercent: 14 }, {
        yPercent: -14, ease: "none",
        scrollTrigger: { trigger: p, start: "top bottom", end: "bottom top", scrub: true },
      });
    }
    const ret = p.querySelector("[data-reticle]");
    if (ret) {
      ScrollTrigger.create({
        trigger: p, start: "top 60%",
        onEnter: () => ret.classList.add("is-locked"),
      });
    }
  });

  // 3) Plan de vol : la ligne se trace au scroll.
  const prog = document.querySelector("[data-fp-progress]");
  if (prog) {
    gsap.to(prog, {
      height: "100%", ease: "none",
      scrollTrigger: { trigger: ".fp-track", start: "top 70%", end: "bottom 70%", scrub: true },
    });
  }
}

/* ---------- Boot ---------- */
registerSW();
mountMenu();
buildGauges();
buildPillars();
buildFlightplan();
initReveals();
initCinematic();
