"use client";

// ==========================================================================
// ROUTE TR — turkey-map.svg ortak yükleyici (modül seviyesinde önbellekli)
// Hem interaktif harita (TurkeyMap) hem seyahat kartı (PostcardModal) kullanır.
// NEXT_PUBLIC_BASE_PATH: GitHub Pages alt klasör yayınları (/RouteTR) için
// build sırasında next.config tarafından env'e işlenir.
// ==========================================================================

const ASSET_BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

let svgTextCache: string | null = null;
let svgTextPromise: Promise<string> | null = null;

export function loadMapSvgText(): Promise<string> {
  if (svgTextCache) return Promise.resolve(svgTextCache);
  if (!svgTextPromise) {
    svgTextPromise = fetch(`${ASSET_BASE}/turkey-map.svg`)
      .then((r) => {
        if (!r.ok) throw new Error(`Harita yüklenemedi (${r.status})`);
        return r.text();
      })
      .then((t) => {
        svgTextCache = t;
        return t;
      })
      .catch((err) => {
        svgTextPromise = null; // yeniden denemeye izin ver
        throw err;
      });
  }
  return svgTextPromise;
}
