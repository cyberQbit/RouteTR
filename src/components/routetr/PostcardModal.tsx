"use client";

// ==========================================================================
// ROUTE TR — 📸 Sosyal Medya Seyahat Kartı v2 (Canvas PNG Export)
// 4 format: Instagram Hikâye (9:16), Instagram Portre (4:5 — akış için ideal),
// Portre 3:4 ve Yatay (16:9). Harita, gerçek viewBox ile Path2D üzerine
// çizilir; renkler interaktif haritadaki lejant skalasıyla BİREBİR aynıdır.
// ==========================================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Download, Loader2, ClipboardCopy, Check } from "lucide-react";
import { useRouteTR } from "@/lib/routetr/store";
import { loadMapSvgText } from "@/lib/routetr/map-svg";
import type { TravelState } from "@/lib/routetr/types";
import {
  BADGES_CATALOG,
  calculateProvinceScore,
  computeGlobalStats,
  getHeatmapColor,
  getTravelerTitle,
  getUnlockedBadges,
} from "@/lib/routetr/logic";

// Gerçek harita viewBox (public/turkey-map.svg) — eski karttaki "40 20 1010 445"
// sabit kodu gerçek haritada HATALI KIRPMAYA neden oluyordu; kök neden budur.
const MAP_VIEWBOX = { x: -3.7, y: -4.2, w: 1446.0, h: 639.2 };
const MAP_ASPECT = MAP_VIEWBOX.w / MAP_VIEWBOX.h; // ≈ 2.262

// ---------- Formatlar (Instagram 2025 resmi boyut rehberine göre) ----------
export interface CardFormat {
  id: string;
  label: string;
  hint: string;
  w: number;
  h: number;
  recommended?: boolean;
}

const FORMATS: CardFormat[] = [
  { id: "story", label: "Hikâye / Reels", hint: "9:16 • 1080×1920", w: 1080, h: 1920 },
  {
    id: "feed45",
    label: "Instagram Akış",
    hint: "4:5 • 1080×1350",
    w: 1080,
    h: 1350,
    recommended: true,
  },
  { id: "feed34", label: "Portre 3:4", hint: "3:4 • 1080×1440", w: 1080, h: 1440 },
  { id: "wide", label: "Yatay", hint: "16:9 • 1200×675", w: 1200, h: 675 },
];

// ---------- Harita geometrisi: bir kez parse edilir, Path2D önbelleklenir ----------
interface DistrictShape {
  plate: string;
  district: string;
  path: Path2D;
}
interface BorderShape {
  plate: string;
  path: Path2D;
}
interface MapGeometry {
  districts: DistrictShape[];
  borders: BorderShape[];
}
let geoCache: MapGeometry | null = null;

async function loadMapGeometry(): Promise<MapGeometry> {
  if (geoCache) return geoCache;
  const text = await loadMapSvgText();
  const doc = new DOMParser().parseFromString(text, "image/svg+xml");
  if (doc.querySelector("parsererror")) throw new Error("Harita XML ayrıştırma hatası");
  const districts: DistrictShape[] = [];
  doc.querySelectorAll("#districts-layer > g[data-plate]").forEach((g) => {
    const d = g.querySelector("path")?.getAttribute("d");
    if (!d) return;
    districts.push({
      plate: g.getAttribute("data-plate") || "",
      district: g.getAttribute("data-d") || "",
      path: new Path2D(d),
    });
  });
  const borders: BorderShape[] = [];
  doc.querySelectorAll("#province-borders > g[data-plate]").forEach((g) => {
    const d = g.querySelector("path")?.getAttribute("d");
    if (d) borders.push({ plate: g.getAttribute("data-plate") || "", path: new Path2D(d) });
  });
  geoCache = { districts, borders };
  return geoCache;
}

// ---------- Çizim yardımcıları ----------
const FONT = '"Plus Jakarta Sans", "Segoe UI", sans-serif';

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function ensureFonts(): Promise<unknown> {
  if (typeof document === "undefined" || !document.fonts) return Promise.resolve();
  return Promise.allSettled([
    document.fonts.load(`900 100px ${FONT}`),
    document.fonts.load(`800 40px ${FONT}`),
    document.fonts.load(`700 24px ${FONT}`),
    document.fonts.load(`600 18px ${FONT}`),
    document.fonts.load(`500 16px ${FONT}`),
  ]);
}

// Transit "tarama" deseni — interaktif haritadaki url(#transit-hatch) birebir karşılığı
function makeHatchPattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
  const tile = document.createElement("canvas");
  tile.width = 8;
  tile.height = 8;
  const t = tile.getContext("2d");
  if (!t) return null;
  t.strokeStyle = "#f59e0b";
  t.lineWidth = 2.5;
  t.beginPath();
  t.moveTo(-2, 2);
  t.lineTo(2, -2);
  t.moveTo(0, 8);
  t.lineTo(8, 0);
  t.moveTo(6, 10);
  t.lineTo(10, 6);
  t.stroke();
  return ctx.createPattern(tile, "repeat");
}

function drawBackdrop(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#0b0f19");
  g.addColorStop(1, "#070b13");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  let rg = ctx.createRadialGradient(W * 0.14, -H * 0.05, 0, W * 0.14, -H * 0.05, W * 0.8);
  rg.addColorStop(0, "rgba(249,115,22,0.16)");
  rg.addColorStop(1, "rgba(249,115,22,0)");
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, W, H);

  rg = ctx.createRadialGradient(W * 0.92, H * 1.02, 0, W * 0.92, H * 1.02, W * 0.62);
  rg.addColorStop(0, "rgba(245,158,11,0.10)");
  rg.addColorStop(1, "rgba(245,158,11,0)");
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, W, H);

  // Premium saç teli çerçeve
  roundRectPath(ctx, 10, 10, W - 20, H - 20, 30);
  ctx.strokeStyle = "rgba(148,163,184,0.15)";
  ctx.lineWidth = 2;
  ctx.stroke();
}

// Kalkan logo — icon.svg geometrisinin (viewBox 192) kanvas karşılığı
function drawBrandMark(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const s = size / 192;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(96, 15);
  ctx.bezierCurveTo(150, 15, 175, 40, 175, 85);
  ctx.bezierCurveTo(175, 145, 96, 180, 96, 180);
  ctx.bezierCurveTo(96, 180, 17, 145, 17, 85);
  ctx.bezierCurveTo(17, 40, 42, 15, 96, 15);
  ctx.closePath();
  ctx.fillStyle = "#111827";
  ctx.fill();
  ctx.lineJoin = "round";
  ctx.lineWidth = 9;
  ctx.strokeStyle = "#f97316";
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#f97316";
  ctx.font = `900 56px ${FONT}`;
  ctx.fillText("TR", 96, 116);
  ctx.beginPath();
  ctx.arc(96, 143, 5.5, 0, Math.PI * 2);
  ctx.fillStyle = "#f8fafc";
  ctx.fill();
  ctx.restore();
}

// "Route" beyaz + "TR" turuncu wordmark — genişlik döndürür (sağına hizalama için)
function drawWordmark(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): number {
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.font = `800 ${size}px ${FONT}`;
  const routeW = ctx.measureText("Route").width;
  ctx.fillStyle = "#f8fafc";
  ctx.fillText("Route", x, y);
  ctx.font = `900 ${size}px ${FONT}`;
  ctx.fillStyle = "#f97316";
  ctx.fillText("TR", x + routeW, y);
  return routeW + ctx.measureText("TR").width;
}

function drawPinIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy + size * 0.42);
  ctx.bezierCurveTo(cx - size * 0.5, cy - size * 0.05, cx - size * 0.32, cy - size * 0.52, cx, cy - size * 0.52);
  ctx.bezierCurveTo(cx + size * 0.32, cy - size * 0.52, cx + size * 0.5, cy - size * 0.05, cx, cy + size * 0.42);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#0b0f19";
  ctx.beginPath();
  ctx.arc(cx, cy - size * 0.14, size * 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawGridIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  const gap = size * 0.1;
  const cell = (size - gap) / 2;
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      roundRectPath(ctx, cx - size / 2 + i * (cell + gap), cy - size / 2 + j * (cell + gap), cell, cell, cell * 0.26);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawStarIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? size * 0.5 : size * 0.21;
    const px = cx + Math.cos(ang) * rad;
    const py = cy + Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ---------- Harita: Path2D üzerine, lejantla birebir renkler ----------
async function drawMapOnCard(
  ctx: CanvasRenderingContext2D,
  state: TravelState,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const r = Math.min(26, w * 0.05, h * 0.09);
  ctx.save();
  roundRectPath(ctx, x, y, w, h, r);
  ctx.shadowColor = "rgba(249,115,22,0.22)";
  ctx.shadowBlur = 36;
  ctx.fillStyle = "#0d1220";
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.clip();

  try {
    const geo = await loadMapGeometry();
    const pad = Math.round(Math.min(w, h) * 0.05);
    const scale = Math.min((w - pad * 2) / MAP_VIEWBOX.w, (h - pad * 2) / MAP_VIEWBOX.h);
    const mw = MAP_VIEWBOX.w * scale;
    const mh = MAP_VIEWBOX.h * scale;
    ctx.translate(x + (w - mw) / 2 - MAP_VIEWBOX.x * scale, y + (h - mh) / 2 - MAP_VIEWBOX.y * scale);
    ctx.scale(scale, scale);

    const scores = new Map<string, number>();
    Object.keys(state).forEach((plate) => scores.set(plate, calculateProvinceScore(state, plate)));
    const hatch = makeHatchPattern(ctx);

    ctx.lineJoin = "round";
    for (const ds of geo.districts) {
      const ps = state[ds.plate];
      const status = ps?.status ?? "unvisited";
      const visited = (ps?.visitedDistricts ?? []).includes(ds.district);
      let fill: string | CanvasPattern | null = "#182032";
      let alpha = 1;
      if (status === "transit") {
        fill = visited ? "#f59e0b" : hatch ?? "#f59e0b";
      } else if (status === "lived") {
        fill = visited ? "#2563eb" : "#1e3a8a";
      } else if (status === "visited") {
        fill = getHeatmapColor("visited", scores.get(ds.plate) || 0);
        if (!visited) alpha = 0.35;
      }
      ctx.globalAlpha = alpha;
      ctx.fillStyle = fill;
      ctx.fill(ds.path);
      ctx.globalAlpha = 1;
      ctx.lineWidth = 0.75;
      ctx.strokeStyle = "#24304a";
      ctx.stroke(ds.path);
    }
    ctx.strokeStyle = "#3d4a66";
    ctx.lineWidth = 1.1;
    for (const b of geo.borders) ctx.stroke(b.path);
  } catch {
    ctx.fillStyle = "#6b7280";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `600 ${Math.round(h * 0.06)}px ${FONT}`;
    ctx.fillText("Harita yüklenemedi", x + w / 2, y + h / 2);
  }
  ctx.restore();
}

// ---------- İstatistik hücresi ----------
function drawStat(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  icon: "pin" | "grid" | "star",
  value: string,
  label: string,
  scale: number
) {
  const iconSize = 34 * scale;
  drawStatIcon(ctx, icon, cx, cy - 26 * scale, iconSize);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#f8fafc";
  ctx.font = `800 ${Math.round(34 * scale)}px ${FONT}`;
  ctx.fillText(value, cx, cy + 20 * scale);
  ctx.fillStyle = "#6b7280";
  ctx.font = `600 ${Math.round(16 * scale)}px ${FONT}`;
  ctx.fillText(label, cx, cy + 44 * scale);
}

function drawStatIcon(ctx: CanvasRenderingContext2D, icon: "pin" | "grid" | "star", cx: number, cy: number, size: number) {
  if (icon === "pin") drawPinIcon(ctx, cx, cy, size, "#f97316");
  else if (icon === "grid") drawGridIcon(ctx, cx, cy, size, "#f97316");
  else drawStarIcon(ctx, cx, cy, size, "#f97316");
}

// ---------- Rozet çipleri ----------
function drawBadgeChips(ctx: CanvasRenderingContext2D, ids: string[], cx: number, cy: number, chip: number, max: number): number {
  const shown = ids.slice(0, max);
  const gap = Math.round(chip * 0.18);
  const totalW = shown.length * chip + Math.max(0, shown.length - 1) * gap;
  let x = cx - totalW / 2;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const id of shown) {
    const badge = BADGES_CATALOG.find((b) => b.id === id);
    roundRectPath(ctx, x, cy - chip / 2, chip, chip, chip * 0.28);
    ctx.fillStyle = "#111827";
    ctx.fill();
    ctx.strokeStyle = "#2e3a52";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    if (badge) {
      ctx.font = `400 ${Math.round(chip * 0.5)}px sans-serif`;
      ctx.fillText(badge.icon, x + chip / 2, cy + 1);
    }
    x += chip + gap;
  }
  if (ids.length > max) {
    ctx.font = `700 ${Math.round(chip * 0.3)}px ${FONT}`;
    ctx.fillStyle = "#f97316";
    ctx.textAlign = "left";
    ctx.fillText(`+${ids.length - max}`, x + 4, cy + 1);
  }
  return totalW;
}

// ---------- CTA hapı ----------
function drawCtaPill(ctx: CanvasRenderingContext2D, cx: number, cy: number, fontSize: number) {
  const text = "Haritanı oluştur → cyberqbit.github.io/RouteTR";
  ctx.font = `800 ${fontSize}px ${FONT}`;
  const tw = ctx.measureText(text).width;
  const padX = fontSize * 1.3;
  const w = tw + padX * 2;
  const h = fontSize * 2.1;
  roundRectPath(ctx, cx - w / 2, cy - h / 2, w, h, h / 2);
  ctx.shadowColor = "rgba(249,115,22,0.45)";
  ctx.shadowBlur = 26;
  ctx.fillStyle = "#f97316";
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, cx, cy + fontSize * 0.05);
}

// ---------- Dikey kart (Hikâye / 4:5 / 3:4) ----------
interface CardData {
  state: TravelState;
  scorePct: string;
  traveler: { title: string; color: string };
  stats: ReturnType<typeof computeGlobalStats>;
  badges: string[];
  dateText: string;
}

async function drawPortraitCard(ctx: CanvasRenderingContext2D, W: number, H: number, data: CardData) {
  const s = W / 1080;
  const v = Math.min(1.42, Math.max(1, H / 1350));
  const P = 64 * s;
  const inner = W - P * 2;

  drawBackdrop(ctx, W, H);

  // Blok yükseklikleri (esnek dikey dağıtım)
  const brandH = 92 * s;
  const heroH = Math.round((30 * v * 1.4 + 12 + 148 * v * 1.04 + 18 + 66 * v));
  const statsH = 112 * s;
  const hasBadges = data.badges.length > 0;
  const badgesH = hasBadges ? 64 * s : 36 * s;
  const ctaH = 54 * s;
  const minGap = 20 * s;
  const gaps = 5;

  const mapFit = Math.round(inner / MAP_ASPECT);
  let mapH = mapFit + 30 * s;

  // DİKKAT: leftover hesabına haritanın taban yüksekliği (mapFit) DAHİL OLMALI;
  // aksi halde kalan alan dev boşluklara dönüşüp istatistik/CTA tuval dışına taşar.
  let leftover = H - P * 2 - (brandH + heroH + mapFit + statsH + badgesH + ctaH + minGap * gaps);
  if (leftover > 0) {
    const bump = Math.min(leftover * 0.4, mapFit * 0.25);
    mapH += bump;
    leftover -= bump;
  } else if (leftover < 0) {
    mapH = Math.max(mapFit * 0.82, mapH + leftover);
    leftover = 0;
  }
  const gap = minGap + leftover / gaps;

  let y = P;

  // 1) Marka satırı
  drawBrandMark(ctx, P, y, 84 * s);
  const markW = 84 * s;
  ctx.font = `800 ${Math.round(44 * s)}px ${FONT}`;
  const wmX = P + markW + 18 * s;
  ctx.textBaseline = "middle";
  drawWordmark(ctx, wmX, y + 32 * s, 44 * s);
  ctx.fillStyle = "#9ca3af";
  ctx.textAlign = "left";
  ctx.font = `600 ${Math.round(17 * s)}px ${FONT}`;
  ctx.fillText("TÜRKİYE SEYAHAT & KEŞİF HARİTASI", wmX + 2 * s, y + 68 * s);
  ctx.textAlign = "right";
  ctx.fillStyle = "#6b7280";
  ctx.font = `500 ${Math.round(20 * s)}px ${FONT}`;
  ctx.fillText(data.dateText, W - P, y + 30 * s);
  ctx.fillStyle = "#f59e0b";
  ctx.font = `600 ${Math.round(16 * s)}px ${FONT}`;
  ctx.fillText("🧭 Keşif Günlüğü", W - P, y + 62 * s);
  y += brandH + gap;

  // 2) Kahraman skor bloğu
  ctx.textAlign = "center";
  ctx.fillStyle = "#9ca3af";
  ctx.font = `600 ${Math.round(26 * v)}px ${FONT}`;
  ctx.fillText("T Ü R K İ Y E   K E Ş İ F   S K O R U", W / 2, y + 20 * v);
  const scoreY = y + 30 * v + 148 * v * 0.82;
  const grad = ctx.createLinearGradient(0, scoreY - 148 * v, 0, scoreY + 10);
  grad.addColorStop(0, "#fdba74");
  grad.addColorStop(1, "#f97316");
  ctx.fillStyle = grad;
  ctx.font = `900 ${Math.round(148 * v)}px ${FONT}`;
  ctx.fillText(`%${data.scorePct}`, W / 2, scoreY);
  // Gezgin ünvanı çipi
  const chipH = 64 * v;
  const chipFont = 30 * v;
  ctx.font = `700 ${Math.round(chipFont)}px ${FONT}`;
  const titleW = ctx.measureText(data.traveler.title).width + 76 * s;
  roundRectPath(ctx, W / 2 - titleW / 2, y + heroH - chipH, titleW, chipH, chipH / 2);
  ctx.fillStyle = "#111827";
  ctx.fill();
  ctx.strokeStyle = "#2e3a52";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = data.traveler.color;
  ctx.textBaseline = "middle";
  ctx.fillText(data.traveler.title, W / 2, y + heroH - chipH / 2 + 2);
  y += heroH + gap;

  // 3) Harita
  await drawMapOnCard(ctx, data.state, P, y, inner, mapH);
  y += mapH + gap;

  // 4) İstatistikler
  const statCy = y + statsH / 2;
  const cells: Array<{ icon: "pin" | "grid" | "star"; value: string; label: string }> = [
    { icon: "pin", value: `${data.stats.activeProvinces}/81`, label: "İL" },
    { icon: "grid", value: `${data.stats.visitedDistricts}/${data.stats.totalDistricts}`, label: "İLÇE" },
    { icon: "star", value: `${data.stats.visitedPois}/${data.stats.totalPois}`, label: "POI" },
  ];
  cells.forEach((c, i) => drawStat(ctx, P + (inner * (i + 0.5)) / 3, statCy, c.icon, c.value, c.label, s * Math.min(1.12, v)));
  y += statsH + gap;

  // 5) Rozetler
  if (hasBadges) {
    drawBadgeChips(ctx, data.badges, W / 2, y + badgesH / 2, 58 * s, 8);
  } else {
    ctx.fillStyle = "#6b7280";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `500 ${Math.round(22 * s)}px ${FONT}`;
    ctx.fillText("İlk rozetin seni bekliyor — haritadan bir il işaretle! 🥾", W / 2, y + badgesH / 2);
  }
  y += badgesH + gap;

  // 6) CTA
  drawCtaPill(ctx, W / 2, y + ctaH / 2, Math.round(25 * s));
}

// ---------- Yatay kart (16:9) ----------
async function drawWideCard(ctx: CanvasRenderingContext2D, W: number, H: number, data: CardData) {
  const s = W / 1080;
  const P = 48 * s;

  drawBackdrop(ctx, W, H);

  // Marka satırı
  const brandH = 58 * s;
  drawBrandMark(ctx, P, P, 56 * s);
  drawWordmark(ctx, P + 56 * s + 16 * s, P + 38 * s, 32 * s);
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#6b7280";
  ctx.font = `500 ${Math.round(19 * s)}px ${FONT}`;
  ctx.fillText(data.dateText, W - P, P + 20 * s);
  ctx.fillStyle = "#f59e0b";
  ctx.font = `600 ${Math.round(16 * s)}px ${FONT}`;
  ctx.fillText("🧭 Türkiye Keşif Günlüğü", W - P, P + 46 * s);

  // Harita (tam genişlik, içeride ortalanmış)
  const stripH = 168 * s;
  const mapY = P + brandH + 16 * s;
  const mapH = H - P - mapY - stripH - 16 * s;
  await drawMapOnCard(ctx, data.state, P, mapY, W - P * 2, mapH);

  // Alt bilgi şeridi — iki satır: (1) skor + istatistik + rozetler (2) CTA
  const stripY = mapY + mapH + 14 * s;
  const leftW = 250 * s;
  const rightW = 330 * s;
  const midX = P + leftW + 30 * s;
  const midW = W - P * 2 - leftW - rightW - 60 * s;

  // Sol: skor + ünvan
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#9ca3af";
  ctx.font = `600 ${Math.round(15 * s)}px ${FONT}`;
  ctx.fillText("KEŞİF SKORU", P, stripY + 20 * s);
  const grad = ctx.createLinearGradient(0, stripY + 24 * s, 0, stripY + 86 * s);
  grad.addColorStop(0, "#fdba74");
  grad.addColorStop(1, "#f97316");
  ctx.fillStyle = grad;
  ctx.font = `900 ${Math.round(62 * s)}px ${FONT}`;
  ctx.fillText(`%${data.scorePct}`, P, stripY + 82 * s);
  ctx.font = `700 ${Math.round(19 * s)}px ${FONT}`;
  ctx.fillStyle = data.traveler.color;
  ctx.fillText(data.traveler.title, P, stripY + 114 * s);

  // Orta: istatistikler (üç kolon, taşma olmadan)
  const cells: Array<{ icon: "pin" | "grid" | "star"; value: string; label: string }> = [
    { icon: "pin", value: `${data.stats.activeProvinces}/81`, label: "İL" },
    { icon: "grid", value: `${data.stats.visitedDistricts}/${data.stats.totalDistricts}`, label: "İLÇE" },
    { icon: "star", value: `${data.stats.visitedPois}/${data.stats.totalPois}`, label: "POI" },
  ];
  cells.forEach((c, i) => drawStat(ctx, midX + (midW * (i + 0.5)) / 3, stripY + 58 * s, c.icon, c.value, c.label, s * 0.8));

  // Sağ: rozetler
  const rightCx = W - P - rightW / 2;
  if (data.badges.length > 0) {
    drawBadgeChips(ctx, data.badges, rightCx, stripY + 52 * s, 44 * s, 6);
  } else {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#6b7280";
    ctx.font = `500 ${Math.round(16 * s)}px ${FONT}`;
    ctx.fillText("Rozetlerin burada görünecek 🥾", rightCx, stripY + 52 * s);
  }

  // Alt satır: CTA ortada
  drawCtaPill(ctx, W / 2, stripY + 152 * s, Math.round(16 * s));
}

// ---------- Ana çizim ----------
async function drawCard(ctx: CanvasRenderingContext2D, fmt: CardFormat, state: TravelState) {
  const stats = computeGlobalStats(state);
  const traveler = getTravelerTitle(stats.averageScore);
  const badges = getUnlockedBadges(state);
  const data: CardData = {
    state,
    scorePct: stats.averageScore.toFixed(1).replace(".", ","),
    traveler,
    stats,
    badges,
    dateText: new Date().toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" }),
  };
  if (fmt.id === "wide") await drawWideCard(ctx, fmt.w, fmt.h, data);
  else await drawPortraitCard(ctx, fmt.w, fmt.h, data);
}

// ---------- Bileşen ----------
export default function PostcardModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const travelState = useRouteTR((s) => s.travelState);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawTokenRef = useRef(0);
  const [format, setFormat] = useState<CardFormat>(FORMATS[1]); // varsayılan: Instagram'ın önerdiği 4:5
  const [rendering, setRendering] = useState(false);
  const [ready, setReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const canCopy = typeof window !== "undefined" && !!navigator.clipboard?.write && typeof ClipboardItem !== "undefined";

  const draw = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const token = ++drawTokenRef.current;
    setRendering(true);
    canvas.width = format.w;
    canvas.height = format.h;
    try {
      await ensureFonts();
      if (token !== drawTokenRef.current) return;
      await drawCard(ctx, format, travelState);
    } catch {
      /* çizim hatası: önizleme kısmen kalabilir, indirme devre dışı kalmaz */
    } finally {
      if (token === drawTokenRef.current) {
        setRendering(false);
        setReady(true);
      }
    }
  }, [travelState, format]);

  useEffect(() => {
    if (!open) return;
    setReady(false);
    setCopied(false);
    const t = setTimeout(() => void draw(), 60);
    return () => clearTimeout(t);
  }, [open, draw]);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas || rendering) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `RouteTR-Karti-${format.id}-${new Date().toISOString().slice(0, 10)}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    }, "image/png");
  };

  const copyToClipboard = async () => {
    const canvas = canvasRef.current;
    if (!canvas || rendering || !canCopy) return;
    try {
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
      if (!blob) return;
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* tarayıcı izin vermediyse sessizce geç */
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        aria-describedby={undefined}
        className="max-h-[92vh] overflow-y-auto border-[#2e3a52] bg-[#0e1422] text-gray-100 sm:max-w-3xl routetr-scrollbar"
      >
        <DialogHeader>
          <DialogTitle className="text-white">📸 RouteTR Seyahat Kartın</DialogTitle>
          <DialogDescription className="text-gray-400">
            Instagram için optimize edilmiş 4 format — birini seç, PNG olarak indir ve paylaş
          </DialogDescription>
        </DialogHeader>

        {/* Format seçici */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label="Kart formatı seç">
          {FORMATS.map((f) => {
            const active = f.id === format.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFormat(f)}
                aria-pressed={active}
                className={`flex flex-col items-start gap-0.5 rounded-xl border p-3 text-left transition ${
                  active
                    ? "border-[#f97316] bg-[#f97316]/10 ring-1 ring-[#f97316]"
                    : "border-[#2e3a52] bg-[#111827] hover:border-[#f97316]/50"
                }`}
              >
                <span className={`text-xs font-bold ${active ? "text-[#fdba74]" : "text-gray-200"}`}>{f.label}</span>
                <span className="text-[10px] text-gray-500">{f.hint}</span>
                {f.recommended && (
                  <span className="mt-1 rounded-full bg-[#f97316]/15 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-[#fdba74]">
                    ★ AKIŞ İÇİN İDEAL
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Önizleme */}
        <div className="flex items-center justify-center rounded-xl border border-[#232f45] bg-[#0b0f19] p-3">
          {rendering && (
            <div className="flex h-64 items-center gap-2 text-sm text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin text-[#f97316]" /> Kartın hazırlanıyor…
            </div>
          )}
          <canvas
            ref={canvasRef}
            className={`max-h-[520px] w-auto max-w-full rounded-lg ${rendering ? "hidden" : ""}`}
            aria-label="Seyahat kartı önizleme"
          />
        </div>

        <p className="text-center text-xs text-gray-500">
          {format.id === "story" && "9:16 — Instagram Hikâye ve Reels kapakları için tam ekran"}
          {format.id === "feed45" && "4:5 — Instagram akışında en çok alan kaplayan, önerilen format"}
          {format.id === "feed34" && "3:4 — Instagram profil ızgarası görünümüne yakın dikey format"}
          {format.id === "wide" && "16:9 — X/Twitter, WhatsApp ve site/blog paylaşımları için geniş format"}
        </p>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {canCopy && (
            <button
              type="button"
              onClick={copyToClipboard}
              disabled={!ready || rendering}
              className="inline-flex items-center gap-2 rounded-lg border border-[#2e3a52] bg-[#111827] px-4 py-2 text-sm font-semibold text-gray-200 transition hover:border-[#f97316]/60 disabled:opacity-50"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <ClipboardCopy className="h-4 w-4" />}
              {copied ? "Kopyalandı" : "Panoya Kopyala"}
            </button>
          )}
          <button
            type="button"
            onClick={download}
            disabled={!ready || rendering}
            className="inline-flex items-center gap-2 rounded-lg bg-[#f97316] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#ea580c] disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> PNG İndir — {format.label}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
