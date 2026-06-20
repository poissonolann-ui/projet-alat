/* ============================================================
   ACHIEVE — "Build" = copie du site statique vers /dist
   (le site est déjà 100 % statique : pas de transformation lourde)
   ============================================================ */
import { cp, rm, mkdir } from "node:fs/promises";

const OUT = "dist";
const INCLUDE = [
  "index.html", "today.html", "planning.html", "session.html",
  "nutrition.html", "hangar.html", "tracking.html",
  "manifest.webmanifest", "service-worker.js",
  "css", "js", "data", "aircraft", "icons", "fonts",
];

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

for (const item of INCLUDE) {
  try {
    await cp(item, `${OUT}/${item}`, { recursive: true });
  } catch (e) {
    console.warn("skip", item, e.code);
  }
}

console.log(`\n  ACHIEVE → build statique prêt dans /${OUT}\n`);
