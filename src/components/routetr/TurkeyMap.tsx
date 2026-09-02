"use client";

// ==========================================================================
// ROUTE TR — İnteraktif Türkiye Haritası (gerçek coğrafya)
// Geo veri: public/turkey-map.svg — 973 ilçe yolu + 81 il sınırı
// Kaynak geometri: github.com/aakutlu/tr-svg-maps (MIT)
// Yaklaşım: SVG runtime'da fetch edilir, ilçeler imperatif olarak boyanır
// Pan (sürükle) + Zoom (tekerlek, pinch, butonlar) + Tooltip + Heatmap
// ==========================================================================

import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { PROVINCES_DATA } from "@/data/routetr/provinces";
import { useRouteTR } from "@/lib/routetr/store";
import { loadMapSvgText } from "@/lib/routetr/map-svg";
import { calculateProvinceScore, getHeatmapColor, checkProvinceMatch } from "@/lib/routetr/logic";
import type { TravelState } from "@/lib/routetr/types";
import { Plus, Minus, Home, RefreshCw } from "lucide-react";

const BASE_VIEWBOX = { x: -3.7, y: -4.2, w: 1446.0, h: 639.2 };

interface FilterOptions {
  searchQuery: string;
  region: string;
  status: string;
}

interface TurkeyMapProps {
  filter: FilterOptions;
  onProvinceClick: (plate: string) => void;
}

// ---------- Ana Harita ----------
export default function TurkeyMap({ filter, onProvinceClick }: TurkeyMapProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const districtsLayerRef = useRef<SVGGElement | null>(null);
  const bordersLayerRef = useRef<SVGGElement | null>(null);
  const viewRef = useRef({ ...BASE_VIEWBOX });
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStart = useRef<{ dist: number; view: { x: number; y: number; w: number; h: number } } | null>(null);
  const [tooltip, setTooltip] = React.useState<{ plate: string; district: string | null } | null>(null);
  const [zoomPct, setZoomPct] = React.useState(100);
  const [ready, setReady] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const [loadTick, setLoadTick] = React.useState(0); // yeniden dene tetikleyicisi

  const travelState = useRouteTR((s) => s.travelState);

  // ---------- Harita geometrisini yükle ve katmanlara işle ----------
  useEffect(() => {
    let cancelled = false;
    loadMapSvgText()
      .then((text) => {
        if (cancelled) return;
        // image/svg+xml ile parse: script çalıştırılmaz, kendi statik dosyamız
        const doc = new DOMParser().parseFromString(text, "image/svg+xml");
        const err = doc.querySelector("parsererror");
        if (err) throw new Error("Harita XML ayrıştırma hatası");
        const dl = doc.getElementById("districts-layer");
        const bl = doc.getElementById("province-borders");
        const dlNode = districtsLayerRef.current;
        const blNode = bordersLayerRef.current;
        if (!dl || !bl || !dlNode || !blNode) throw new Error("Harita katmanları eksik");
        // Grubun KENDİNİ değil, çocuklarını import et (iç içe g katmanı oluşmasın)
        while (dlNode.firstChild) dlNode.removeChild(dlNode.firstChild);
        const dFrag = document.createDocumentFragment();
        Array.from(dl.children).forEach((c) => dFrag.appendChild(document.importNode(c, true)));
        dlNode.appendChild(dFrag);
        while (blNode.firstChild) blNode.removeChild(blNode.firstChild);
        const bFrag = document.createDocumentFragment();
        Array.from(bl.children).forEach((c) => bFrag.appendChild(document.importNode(c, true)));
        blNode.appendChild(bFrag);
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          setReady(false);
          setFailed(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [loadTick]);

  const provByPlate = useMemo(() => {
    const m = new Map<string, (typeof PROVINCES_DATA)[number]>();
    PROVINCES_DATA.forEach((p) => m.set(p.plate, p));
    return m;
  }, []);

  // ---------- Boyama: state / filtre her değiştiğinde ilçeleri imperatif güncelle ----------
  useEffect(() => {
    const layer = districtsLayerRef.current;
    const borders = bordersLayerRef.current;
    if (!ready || !layer || !borders) return;

    const isAnySearch = !!filter.searchQuery;
    const scores = new Map<string, number>();
    const matchedPlates = new Set<string>();
    PROVINCES_DATA.forEach((p) => {
      scores.set(p.plate, calculateProvinceScore(travelState, p.plate));
      if (isAnySearch && checkProvinceMatch(travelState, p, filter)) matchedPlates.add(p.plate);
    });

    const groups = layer.children;
    for (let i = 0; i < groups.length; i++) {
      const g = groups[i] as SVGGElement;
      const plate = g.getAttribute("data-plate") || "";
      const dName = g.getAttribute("data-d") || "";
      const pData: TravelState[string] | undefined = travelState[plate];
      const status = pData?.status || "unvisited";
      const visited = pData?.visitedDistricts || [];
      const isVisited = visited.includes(dName);
      const path = g.firstElementChild as SVGPathElement | null;
      if (!path) continue;

      // Renk skalası (lejantla birebir):
      // - Aktif ilde SEÇİLİ ilçeler lejant renginin dolgusunu,
      //   seçilmemiş ilçeler aynı rengin yarı saydam tonunu alır →
      //   il uzaktan skor bandına göre, yakından ilçe detayına göre renklenir.
      // - Transit: seçili ilçe düz amber, diğerleri tarama deseni.
      // - Yaşadım: lejanttaki #2563eb / koyu ton #1e3a8a.
      let fill = "#182032";
      let fillOpacity: string | null = null;

      if (status === "transit") {
        fill = isVisited ? "#f59e0b" : "url(#transit-hatch)";
      } else if (status === "lived") {
        fill = isVisited ? "#2563eb" : "#1e3a8a";
      } else if (status === "visited") {
        fill = getHeatmapColor(status, scores.get(plate) || 0);
        if (!isVisited) fillOpacity = "0.35";
      }
      path.setAttribute("fill", fill);
      if (fillOpacity) path.setAttribute("fill-opacity", fillOpacity);
      else path.removeAttribute("fill-opacity");

      if (isAnySearch) g.setAttribute("opacity", matchedPlates.has(plate) ? "1" : "0.15");
      else g.removeAttribute("opacity");
    }

    const bGroups = borders.children;
    for (let i = 0; i < bGroups.length; i++) {
      const g = bGroups[i] as SVGGElement;
      const plate = g.getAttribute("data-plate") || "";
      const path = g.firstElementChild as SVGPathElement | null;
      if (!path) continue;
      const hot = isAnySearch && matchedPlates.has(plate);
      path.setAttribute("stroke", hot ? "#f97316" : "#3d4a66");
      path.setAttribute("stroke-width", hot ? "2.5" : "1.1");
    }
  }, [ready, travelState, filter]);

  // ---------- Zoom ----------
  const applyView = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const v = viewRef.current;
    svg.setAttribute("viewBox", `${v.x} ${v.y} ${v.w} ${v.h}`);
    const pct = Math.round((BASE_VIEWBOX.w / v.w) * 100);
    setZoomPct((prev) => (prev === pct ? prev : pct));
  }, []);

  const zoomAt = useCallback(
    (factor: number, cx?: number, cy?: number) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const px = cx !== undefined ? (cx - rect.left) / rect.width : 0.5;
      const py = cy !== undefined ? (cy - rect.top) / rect.height : 0.5;
      const v = viewRef.current;
      const newW = Math.min(BASE_VIEWBOX.w * 1.6, Math.max(BASE_VIEWBOX.w * 0.25, v.w * factor));
      const newH = newW * (BASE_VIEWBOX.h / BASE_VIEWBOX.w);
      // İmleç sabit kalsın
      v.x += (v.w - newW) * px;
      v.y += (v.h - newH) * py;
      v.w = newW;
      v.h = newH;
      applyView();
    },
    [applyView]
  );

  // Wheel zoom
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomAt(e.deltaY > 0 ? 1.12 : 0.89, e.clientX, e.clientY);
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  // ---------- Pointer pan + pinch ----------
  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinchStart.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), view: { ...viewRef.current } };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    const prev = pointers.current.get(e.pointerId)!;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2 && pinchStart.current) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const factor = pinchStart.current.dist / Math.max(1, dist);
      const start = pinchStart.current.view;
      const newW = Math.min(BASE_VIEWBOX.w * 1.6, Math.max(BASE_VIEWBOX.w * 0.25, start.w * factor));
      const newH = newW * (BASE_VIEWBOX.h / BASE_VIEWBOX.w);
      const midX = (a.x + b.x) / 2;
      const svg = svgRef.current;
      if (svg) {
        const rect = svg.getBoundingClientRect();
        const px = (midX - rect.left) / rect.width;
        const py = ((a.y + b.y) / 2 - rect.top) / rect.height;
        viewRef.current.x = start.x + (start.w - newW) * px;
        viewRef.current.y = start.y + (start.h - newH) * py;
        viewRef.current.w = newW;
        viewRef.current.h = newH;
        applyView();
      }
      return;
    }

    if (pointers.current.size === 1) {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const dx = ((e.clientX - prev.x) / rect.width) * viewRef.current.w;
      const dy = ((e.clientY - prev.y) / rect.height) * viewRef.current.h;
      viewRef.current.x -= dx;
      viewRef.current.y -= dy;
      applyView();
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
  };

  const resetView = useCallback(() => {
    viewRef.current = { ...BASE_VIEWBOX };
    applyView();
  }, [applyView]);

  // ---------- Tooltip (event delegation ile; enjekte edilen DOM'a handler gerekmez) ----------
  const moveTooltip = useCallback((e: React.MouseEvent) => {
    const wrap = wrapRef.current;
    const tip = tooltipRef.current;
    if (!wrap || !tip) return;
    const rect = wrap.getBoundingClientRect();
    let x = e.clientX - rect.left + 14;
    let y = e.clientY - rect.top + 14;
    if (x + 200 > rect.width) x -= 220;
    if (y + 100 > rect.height) y -= 110;
    tip.style.left = `${x}px`;
    tip.style.top = `${y}px`;
  }, []);

  const onSvgOver = useCallback(
    (e: React.MouseEvent) => {
      const g = (e.target as Element).closest?.("g[data-d]");
      const plate = g?.getAttribute("data-plate");
      if (plate) {
        setTooltip({ plate, district: g?.getAttribute("data-d") || null });
        moveTooltip(e);
        return;
      }
      setTooltip(null);
    },
    [moveTooltip]
  );
  const onSvgOut = useCallback(() => setTooltip(null), []);

  const onSvgClick = useCallback(
    (e: React.MouseEvent) => {
      const g = (e.target as Element).closest?.("g[data-plate]");
      const plate = g?.getAttribute("data-plate");
      if (plate) onProvinceClick(plate);
    },
    [onProvinceClick]
  );

  const tooltipData = useMemo(() => {
    if (!tooltip) return null;
    const meta = provByPlate.get(tooltip.plate);
    if (!meta) return null;
    const pData = travelState[tooltip.plate];
    const score = calculateProvinceScore(travelState, tooltip.plate);
    const statusText =
      pData?.status === "transit" ? "🚗 Transit / Mola" : pData?.status === "visited" ? "🎒 Gezdim" : pData?.status === "lived" ? "🏡 Yaşadım" : "Gitmedim";
    const isDistVisited = tooltip.district ? (pData?.visitedDistricts || []).includes(tooltip.district) : false;
    return { meta, pData, score, statusText, isDistVisited, district: tooltip.district };
  }, [tooltip, travelState, provByPlate]);

  return (
    <div className="relative select-none" ref={wrapRef} data-tour="map">
      {failed ? (
        <div className="flex aspect-[1446/639] w-full flex-col items-center justify-center gap-3 rounded-xl bg-[#0d1220] text-center">
          <span className="text-sm text-gray-400">Harita yüklenirken bir sorun oluştu 😕</span>
          <button
            type="button"
            onClick={() => {
              setFailed(false);
              setLoadTick((t) => t + 1);
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-[#f97316]/50 bg-[#f97316]/10 px-4 py-2 text-sm font-semibold text-[#fdba74] transition hover:bg-[#f97316]/20"
          >
            <RefreshCw className="h-4 w-4" /> Tekrar dene
          </button>
        </div>
      ) : (
        <svg
          ref={svgRef}
          id="turkey-svg-map"
          viewBox={`${BASE_VIEWBOX.x} ${BASE_VIEWBOX.y} ${BASE_VIEWBOX.w} ${BASE_VIEWBOX.h}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full touch-none rounded-xl bg-[#0d1220] cursor-grab active:cursor-grabbing"
          role="img"
          aria-label="Türkiye interaktif il ve ilçe haritası"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onMouseOver={onSvgOver}
          onMouseOut={onSvgOut}
          onClick={onSvgClick}
        >
          <defs>
            <pattern id="transit-hatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="8" stroke="#f59e0b" strokeWidth="2.5" />
            </pattern>
          </defs>

          {/* İlçe sınırları: SVG dosyasından yalnızca path'ler import edildiği için
              katman stroke'u kaybolur; burada yeniden tanımlanır (azıcık belirgin, il sınırından yumuşak) */}
          <g id="districts-layer" ref={districtsLayerRef} stroke="#2e3d5c" strokeWidth={0.75} strokeLinejoin="round" />
          {/* Kritik: dosyadaki fill="none" import sırasında kaybolur; düzeltilmezse il kenarlık
              path'leri opak siyah dolguyla ilçe renklerinin ÜZERİNÖRTer → renk skalası görünmez! */}
          <g id="province-borders" ref={bordersLayerRef} className="pointer-events-none" fill="none" />
        </svg>
      )}

      {/* Yükleniyor iskeleti */}
      {!ready && !failed && (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-[#0d1220]"
          role="status"
          aria-live="polite"
          aria-label="Harita yükleniyor"
        >
          <div className="flex flex-col items-center gap-3">
            <span className="h-9 w-9 animate-spin rounded-full border-2 border-[#2e3a52] border-t-[#f97316]" aria-hidden="true" />
            <span className="text-xs font-medium text-gray-500">Türkiye haritası yükleniyor…</span>
          </div>
        </div>
      )}

      {/* Tooltip */}
      <div ref={tooltipRef} className="pointer-events-none absolute z-20 hidden md:block" style={{ display: tooltipData ? "block" : "none" }}>
        {tooltipData && (
          <div className="max-w-[220px] rounded-lg border border-[#2e3a52] bg-[#0b0f19]/95 px-3 py-2 shadow-xl backdrop-blur-sm">
            <div className="text-sm font-bold text-white">
              <span className="text-[#f59e0b]">{tooltipData.meta.plate}</span> {tooltipData.meta.name}
              {tooltipData.district && <span className="ml-1 text-xs font-normal text-gray-400">› {tooltipData.district}</span>}
            </div>
            <div className="mt-0.5 text-xs text-gray-400">
              {tooltipData.meta.region} • {tooltipData.statusText} {tooltipData.isDistVisited && <span className="font-bold text-emerald-400">(İlçe ✓)</span>}
            </div>
            <div className="mt-0.5 text-xs text-gray-300">
              Keşif Skoru: <strong className="text-[#f97316]">%{tooltipData.score}</strong>
            </div>
            <div className="mt-0.5 text-[11px] text-gray-500">
              {(tooltipData.pData?.visitedDistricts || []).length}/{tooltipData.meta.districts.length} ilçe • {(tooltipData.pData?.visitedPois || []).length} POI
            </div>
          </div>
        )}
      </div>

      {/* Zoom kontrolleri */}
      <div className="absolute right-3 top-3 z-10 flex flex-col gap-1.5" data-tour="map-zoom">
        <button
          type="button"
          onClick={() => zoomAt(0.8)}
          aria-label="Yakınlaştır"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#2e3a52] bg-[#111827]/90 text-gray-300 backdrop-blur transition hover:border-[#f97316] hover:text-white"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => zoomAt(1.25)}
          aria-label="Uzaklaştır"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#2e3a52] bg-[#111827]/90 text-gray-300 backdrop-blur transition hover:border-[#f97316] hover:text-white"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={resetView}
          aria-label="Görünümü sıfırla"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#2e3a52] bg-[#111827]/90 text-gray-300 backdrop-blur transition hover:border-[#f97316] hover:text-white"
        >
          <Home className="h-4 w-4" />
        </button>
        <span className="text-center text-[10px] font-medium text-gray-500">%{zoomPct}</span> {/* canlı zoom göstergesi */}
      </div>

      <p className="mt-2 text-center text-xs text-gray-500 md:hidden">İpucu: Haritayı parmaklarınla kaydırabilir, iki parmakla yakınlaştırabilirsin 👆</p>
    </div>
  );
}
