"use client";

// ==========================================================================
// ROUTE TR — İnteraktif Türkiye Haritası
// 4 katman: ilçe dolguları, il sınırları, ülke sınırı, etiketler
// Pan (sürükle) + Zoom (tekerlek, pinch, butonlar) + Tooltip + Heatmap
// ==========================================================================

import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { PROVINCES_DATA, COUNTRY_BORDER_SVG_D } from "@/data/routetr/provinces";
import { useRouteTR } from "@/lib/routetr/store";
import { calculateProvinceScore, getHeatmapColor, checkProvinceMatch } from "@/lib/routetr/logic";
import type { Province, TravelState } from "@/lib/routetr/types";
import { Plus, Minus, Home } from "lucide-react";

const BASE_VIEWBOX = { x: 40, y: 20, w: 1010, h: 445 };

interface FilterOptions {
  searchQuery: string;
  region: string;
  status: string;
}

interface TurkeyMapProps {
  filter: FilterOptions;
  onProvinceClick: (plate: string) => void;
}

// ---------- Memoized district group (yalnız ilgili il yeniden render olur) ----------
const ProvinceGroup = React.memo(function ProvinceGroup({
  province,
  provinceState,
  score,
  dimmed,
  highlighted,
  onHover,
  onLeave,
  onClick,
}: {
  province: Province;
  provinceState: TravelState[string] | undefined;
  score: number;
  dimmed: boolean;
  highlighted: boolean;
  onHover: (e: React.MouseEvent, plate: string, district: string | null) => void;
  onLeave: () => void;
  onClick: (plate: string) => void;
}) {
  const status = provinceState?.status || "unvisited";
  const visitedSet = useMemo(() => new Set(provinceState?.visitedDistricts || []), [provinceState?.visitedDistricts]);

  const color = getHeatmapColor(status, score);

  return (
    <g opacity={dimmed ? 0.18 : 1}>
      {province.district_paths.map((dp, idx) => {
        const isDistrictVisited = visitedSet.has(dp.name);
        let fill: string = "#182032";
        if (status === "transit") fill = "url(#transit-hatch)";
        else if (status === "lived") fill = isDistrictVisited ? "#3b82f6" : "#1e3a8a";
        else if (isDistrictVisited) fill = color;
        else if (status === "visited") fill = "#26334d";

        return (
          <path
            key={`${province.plate}-${idx}`}
            data-plate={province.plate}
            data-district={dp.name}
            d={dp.d}
            fill={fill}
            className="rtr-district-path"
            onMouseEnter={(e) => onHover(e, province.plate, dp.name)}
            onMouseLeave={onLeave}
            onClick={() => onClick(province.plate)}
          />
        );
      })}
      <path
        d={province.svg_d}
        fill="none"
        stroke={highlighted ? "#f97316" : "#3d4a66"}
        strokeWidth={highlighted ? 3 : 1.6}
        className="rtr-province-border pointer-events-none"
      />
    </g>
  );
});

// ---------- Ana Harita ----------
export default function TurkeyMap({ filter, onProvinceClick }: TurkeyMapProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef({ ...BASE_VIEWBOX });
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStart = useRef<{ dist: number; view: { x: number; y: number; w: number; h: number } } | null>(null);
  const [tooltip, setTooltip] = React.useState<{ plate: string; district: string | null } | null>(null);
  const [zoomPct, setZoomPct] = React.useState(100);

  const travelState = useRouteTR((s) => s.travelState);

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

  // Pointer pan + pinch
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

  // Tooltip konumu (imperatif, re-render gerektirmez)
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

  const handleHover = useCallback((e: React.MouseEvent, plate: string, district: string | null) => {
    setTooltip({ plate, district });
    moveTooltip(e);
  }, [moveTooltip]);
  const handleLeave = useCallback(() => setTooltip(null), []);

  const tooltipData = useMemo(() => {
    if (!tooltip) return null;
    const meta = PROVINCES_DATA.find((p) => p.plate === tooltip.plate);
    if (!meta) return null;
    const pData = travelState[tooltip.plate];
    const score = calculateProvinceScore(travelState, tooltip.plate);
    const statusText =
      pData?.status === "transit" ? "🚗 Transit / Mola" : pData?.status === "visited" ? "🎒 Gezdim" : pData?.status === "lived" ? "🏡 Yaşadım" : "Gitmedim";
    const isDistVisited = tooltip.district ? (pData?.visitedDistricts || []).includes(tooltip.district) : false;
    return { meta, pData, score, statusText, isDistVisited, district: tooltip.district };
  }, [tooltip, travelState]);

  return (
    <div className="relative select-none" ref={wrapRef} data-tour="map">
      <svg
        ref={svgRef}
        id="turkey-svg-map"
        viewBox={`${BASE_VIEWBOX.x} ${BASE_VIEWBOX.y} ${BASE_VIEWBOX.w} ${BASE_VIEWBOX.h}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-auto rounded-xl bg-[#0d1220] touch-none cursor-grab active:cursor-grabbing"
        role="img"
        aria-label="Türkiye interaktif il ve ilçe haritası"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <defs>
          <pattern id="transit-hatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="8" stroke="#f59e0b" strokeWidth="2.5" />
          </pattern>
        </defs>

        <g id="districts-layer">
          {PROVINCES_DATA.map((p) => {
            const pData = travelState[p.plate];
            const score = calculateProvinceScore(travelState, p.plate);
            const matched = checkProvinceMatch(travelState, p, filter);
            const isAnySearch = !!filter.searchQuery;
            return (
              <ProvinceGroup
                key={p.plate}
                province={p}
                provinceState={pData}
                score={score}
                dimmed={isAnySearch && !matched}
                highlighted={matched && isAnySearch}
                onHover={handleHover}
                onLeave={handleLeave}
                onClick={onProvinceClick}
              />
            );
          })}
        </g>

        {/* Ülke dış sınırı */}
        <path d={COUNTRY_BORDER_SVG_D} fill="none" stroke="#f97316" strokeWidth="2.4" className="pointer-events-none" strokeLinejoin="round" />
      </svg>

      {/* Tooltip */}
      <div ref={tooltipRef} className="pointer-events-none absolute z-20 hidden md:block" style={{ display: tooltipData ? "block" : "none" }}>
        {tooltipData && (
          <div className="rounded-lg border border-[#2e3a52] bg-[#0b0f19]/95 px-3 py-2 shadow-xl backdrop-blur-sm max-w-[220px]">
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
        <span className="text-center text-[10px] font-medium text-gray-500">%{zoomPct}</span>  {/* canlı zoom göstergesi */}
      </div>

      <p className="mt-2 text-center text-xs text-gray-500 md:hidden">İpucu: Haritayı parmaklarınla kaydırabilir, iki parmakla yakınlaştırabilirsin 👆</p>
    </div>
  );
}
