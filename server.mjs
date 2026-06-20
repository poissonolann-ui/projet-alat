/* ============================================================
   ACHIEVE — Serveur statique zéro-dépendance (dev & preview)
   Usage : node server.mjs [--root DIR] [--port N]
   ============================================================ */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, normalize } from "node:path";
import { networkInterfaces } from "node:os";

const args = process.argv.slice(2);
const rootArg = args.indexOf("--root");
const portArg = args.indexOf("--port");
const ROOT = rootArg !== -1 ? args[rootArg + 1] : process.cwd();
const PORT = portArg !== -1 ? Number(args[portArg + 1]) : 4321;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
};

createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (path.endsWith("/")) path += "index.html";
    // Empêche le path traversal.
    const filePath = normalize(join(ROOT, path));
    if (!filePath.startsWith(normalize(ROOT))) {
      res.writeHead(403).end("Forbidden");
      return;
    }
    let target = filePath;
    try {
      const s = await stat(target);
      if (s.isDirectory()) target = join(target, "index.html");
    } catch {
      // 404 → fallback SPA-like sur index.html pour la navigation
      target = join(ROOT, "index.html");
    }
    const data = await readFile(target);
    const type = MIME[extname(target)] || "application/octet-stream";
    res.writeHead(200, {
      "Content-Type": type,
      "Cache-Control": "no-cache",
      "Service-Worker-Allowed": "/",
    });
    res.end(data);
  } catch (e) {
    res.writeHead(500).end("Server error");
  }
}).listen(PORT, () => {
  // Adresse réseau local (pour ouvrir l'app depuis un téléphone sur le même Wi-Fi).
  const lan = Object.values(networkInterfaces())
    .flat()
    .find((i) => i && i.family === "IPv4" && !i.internal);
  console.log(`\n  ACHIEVE — serveur démarré (root: ${ROOT})\n`);
  console.log(`  • Sur cet ordinateur : http://localhost:${PORT}`);
  if (lan) console.log(`  • Depuis ton iPhone  : http://${lan.address}:${PORT}   (même Wi-Fi)`);
  console.log("");
});
