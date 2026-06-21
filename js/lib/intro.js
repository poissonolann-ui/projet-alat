/* ============================================================
   ACHIEVE — Intro animée de l'aéronef (avant l'affichage séance)
   jet  → passage en post-combustion (traînée de feu)
   helo → virage serré + souffle rotor
   Renvoie une Promise résolue à la fin de l'animation.
   prefers-reduced-motion → résolution quasi-immédiate (pas d'à-coup).
   ============================================================ */

import { prefersReducedMotion } from "./motion.js";

export function playIntro(craft) {
  return new Promise((resolve) => {
    if (!craft) { resolve(); return; }

    const reduce = prefersReducedMotion();
    const ov = document.createElement("div");
    ov.className = `intro-overlay ${craft.kind === "helo" ? "helo" : "jet"}`;
    ov.setAttribute("aria-hidden", "true");
    ov.innerHTML = `
      <div class="intro-stage">
        ${craft.kind === "helo" ? '<span class="intro-rotor"></span>' : '<span class="intro-burn"></span>'}
        <span class="intro-craft" style="--m:url('${craft.svg}')"></span>
        <span class="intro-label">${craft.name}<span class="intro-sub">${craft.line || ""}</span></span>
      </div>`;
    document.body.appendChild(ov);

    if (reduce) {
      // Pas d'animation : on montre un flash bref puis on enchaîne.
      ov.style.opacity = "1";
      setTimeout(() => { ov.remove(); resolve(); }, 220);
      return;
    }

    requestAnimationFrame(() => ov.classList.add("is-on"));
    const done = () => { ov.remove(); resolve(); };
    ov.addEventListener("animationend", (e) => { if (e.target === ov) done(); }, { once: true });
    // Filet de sécurité si animationend ne se déclenche pas.
    setTimeout(done, 1300);
  });
}
