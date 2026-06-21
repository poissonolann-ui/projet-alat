/* ============================================================
   ACHIEVE — Accueil : génération du contenu + cinématique
   ============================================================ */

import { registerSW } from "./app.js";
import { mountMenu } from "./menu.js";
import { initReveals, prefersReducedMotion } from "./lib/motion.js";
import { buildGauges } from "./lib/gauges.js";
import { aircraft, pillarOrder, destination } from "../data/aircraft.js";
import { profile } from "../data/profile.js";
import { getState } from "./lib/store.js";
import { daysUntil, fromISO, MONTH_LABELS } from "./lib/date.js";

/* ---------- Piliers / appareils ---------- */
function buildPillars() {
  const host = document.querySelector("[data-pillars]");
  if (!host) return;
  host.innerHTML = pillarOrder.map((id, i) => {
    const a = aircraft[id];
    // Fond photographique heure dorée si dispo, sinon emplacement clair
    // + silhouette élégante de l'appareil (dérivée d'un vrai planform).
    const media = a.photo
      ? `<div class="pillar-media" style="background-image:url('${new URL(a.photo, document.baseURI).href}')" data-parallax-media aria-hidden="true"></div>`
      : `<div class="pillar-figure">
           <span class="silhouette" role="img" aria-label="Silhouette ${a.name}" data-parallax style="--m:url('${new URL(a.svg, document.baseURI).href}')"></span>
           <span class="pillar-ph">Photo ${a.name} · heure dorée</span>
         </div>`;
    return `
      <section class="pillar" data-accent="${id}" data-pillar>
        ${media}
        <div class="pillar-body">
          <p class="eyebrow" data-reveal><span class="num">0${i + 1}</span> · ${a.pillar}</p>
          <p class="pillar-aircraft" data-reveal>${a.name}</p>
          <h2 data-reveal data-reveal-delay="60">${a.idea}</h2>
          <p data-reveal data-reveal-delay="120">${a.blurb}</p>
        </div>
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
  // Repère mobile (hélico) qui suit la tête de la progression de route.
  const prog = line.querySelector(".fp-progress");
  if (prog && !prog.querySelector(".fp-plane")) {
    prog.insertAdjacentHTML("beforeend",
      `<span class="fp-plane" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c.8 0 1.3 1.4 1.4 3.2l.2 4.3 7.4 4v2l-7.3-2.2-.2 4.2 2.1 1.6v1.6L12 19.4 8.4 20.7v-1.6l2.1-1.6-.2-4.2L3 15.5v-2l7.4-4 .2-4.3C10.7 3.4 11.2 2 12 2z"/></svg></span>`);
  }
  host.innerHTML = "";
  host.appendChild(line);

  waypoints.forEach((wp, i) => {
    const status = i < hereIndex ? "done" : i === hereIndex ? "here" : "todo";
    const here = status === "here";
    const label = status === "done" ? "✓ Terminé" : here ? "⊕ En cours" : "À venir";
    const el = document.createElement("div");
    el.className = `waypoint is-${status}${wp.dest ? " is-dest" : ""}`;
    el.setAttribute("data-reveal", "");
    el.innerHTML = `
      <button class="wp-head${here ? " is-open" : ""}" aria-expanded="${here}">
        <span class="wp-meta"><span class="wp-code">${wp.code}</span><span class="wp-status s-${status}">${label}</span></span>
        <h3>${wp.title}</h3>
      </button>
      <div class="wp-body${here ? " is-open" : ""}"><p class="dim">${wp.desc}</p></div>
    `;
    host.appendChild(el);
  });

  // Dépliage au tap (fenêtres d'étape qui s'ouvrent).
  host.querySelectorAll(".wp-head").forEach((h) => {
    h.addEventListener("click", () => {
      const open = h.classList.toggle("is-open");
      h.nextElementSibling.classList.toggle("is-open", open);
      h.setAttribute("aria-expanded", String(open));
    });
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
    await loadScript("js/vendor/gsap.min.js");
    await loadScript("js/vendor/ScrollTrigger.min.js");
    await loadScript("js/vendor/lenis.min.js");
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
    // Parallaxe cinématique (Ken Burns) sur les fonds photographiques.
    const media = p.querySelector("[data-parallax-media]");
    if (media) {
      gsap.fromTo(media, { scale: 1.18, yPercent: -6 }, {
        scale: 1.04, yPercent: 6, ease: "none",
        scrollTrigger: { trigger: p, start: "top bottom", end: "bottom top", scrub: true },
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
buildGauges("[data-gauges]");
buildPillars();
buildFlightplan();
initReveals();
initCinematic();
