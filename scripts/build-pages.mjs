#!/usr/bin/env node
// ==========================================================================
// RouteTR — GitHub Pages statik export build'i
//
// Kullanım:  node scripts/build-pages.mjs
//   (package.json içinde "build:pages" olarak bağlıdır)
//
// Ne yapar?
//   1) basePath'i belirler (varsayılan /RouteTR — env ile ezilebilir:
//      NEXT_PUBLIC_BASE_PATH=/RepoAdi node scripts/build-pages.mjs)
//   2) src/app/api klasörünü geçici olarak taşır — çünkü /api/weather gibi
//      dinamik rota handler'ları `output: "export"` ile uyumsuzdur.
//      Statik yayında /api/weather 404 verir; istemci (src/lib/routetr/weather.ts)
//      bunu karşılayıp Open-Meteo'ya doğrudan bağlanır (CORS açıktır).
//   3) `next build` çalıştırır → çıktı out/ klasörüne statik export edilir.
//   4) API klasörünü her koşulda geri taşır (build başarısız olsa bile).
// ==========================================================================

import { existsSync, renameSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const apiDir = path.join(root, "src", "app", "api");
const backupDir = path.join(root, ".routetr-api-backup");

// basePath: repo adına göre varsayılan; GitHub Actions env ile ezer
process.env.NEXT_PUBLIC_BASE_PATH ||= "/RouteTR";

let moved = false;
if (existsSync(apiDir)) {
  rmSync(backupDir, { recursive: true, force: true });
  renameSync(apiDir, backupDir);
  moved = true;
  console.log(`→ Statik export için API rotaları geçici olarak taşındı (${path.relative(root, backupDir)})`);
}

try {
  const res = spawnSync("npx", ["next", "build"], {
    stdio: "inherit",
    cwd: root,
    env: process.env,
    shell: process.platform === "win32",
  });
  process.exitCode = res.status ?? 1;
} finally {
  if (moved) {
    rmSync(apiDir, { recursive: true, force: true });
    renameSync(backupDir, apiDir);
    console.log("→ API rotaları geri yüklendi");
  }
}
