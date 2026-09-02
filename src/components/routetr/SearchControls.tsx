"use client";

// ==========================================================================
// ROUTE TR — Arama & Filtre Çubuğu
// Türkçe karakter duyarlı arama + otomatik tamamlama açılır listesi
// ==========================================================================

import { useMemo, useRef, useState, useEffect } from "react";
import { Search, MapPin, Building, Star, X } from "lucide-react";
import { PROVINCES_DATA } from "@/data/routetr/provinces";
import { useRouteTR } from "@/lib/routetr/store";
import { normalizeText } from "@/lib/routetr/logic";
import type { FilterOptions } from "@/lib/routetr/logic";

interface Suggestion {
  plate: string;
  name: string;
  type: "province" | "district" | "poi";
  label: string;
}

const REGIONS = ["Marmara", "Ege", "Akdeniz", "İç Anadolu", "Karadeniz", "Doğu Anadolu", "Güneydoğu Anadolu"];

export default function SearchControls({
  filter,
  onChange,
  onPick,
}: {
  filter: FilterOptions;
  onChange: (f: FilterOptions) => void;
  onPick: (plate: string) => void;
}) {
  const travelState = useRouteTR((s) => s.travelState);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);

  const suggestions = useMemo<Suggestion[]>(() => {
    const q = normalizeText(filter.searchQuery);
    if (!q) return [];
    const out: Suggestion[] = [];

    for (const p of PROVINCES_DATA) {
      if (normalizeText(p.name).includes(q) || p.plate.includes(q)) {
        out.push({ plate: p.plate, name: p.name, type: "province", label: `İl • ${p.region}` });
      }
      if (out.length >= 40) break;
    }
    for (const p of PROVINCES_DATA) {
      for (const d of p.districts) {
        if (normalizeText(d).startsWith(q)) {
          out.push({ plate: p.plate, name: `${d} (${p.name})`, type: "district", label: "İlçe" });
          if (out.length >= 50) break;
        }
      }
      if (out.length >= 50) break;
    }
    for (const p of PROVINCES_DATA) {
      for (const poi of p.pois) {
        if (normalizeText(poi).includes(q)) {
          out.push({ plate: p.plate, name: poi, type: "poi", label: `POI • ${p.name}` });
          if (out.length >= 60) break;
        }
      }
      if (out.length >= 60) break;
    }
    return out.slice(0, 8);
  }, [filter.searchQuery]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const typeIcon = (t: Suggestion["type"]) =>
    t === "province" ? <MapPin className="h-3.5 w-3.5 text-[#f97316]" /> : t === "district" ? <Building className="h-3.5 w-3.5 text-emerald-400" /> : <Star className="h-3.5 w-3.5 text-[#f59e0b]" />;

  return (
    <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center" data-tour="search">
      {/* Arama kutusu */}
      <div ref={boxRef} className="relative flex-1">
        <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2">
          <Search className="h-4 w-4 text-gray-500" />
        </div>
        <input
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls="rtr-search-suggestions"
          aria-autocomplete="list"
          aria-label="Şehir, ilçe, nokta veya plaka ara"
          value={filter.searchQuery}
          onChange={(e) => {
            onChange({ ...filter, searchQuery: e.target.value });
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const first = suggestions[0];
              if (first) {
                onPick(first.plate);
                setOpen(false);
              }
            }
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder="Şehir, ilçe, nokta veya plaka ara (örn: Eskişehir, 26, Mihalıççık)…"
          className="w-full rounded-xl border border-[#2e3a52] bg-[#0e1422] py-2.5 pl-10 pr-10 text-sm text-gray-100 placeholder:text-gray-600 outline-none transition focus:border-[#f97316] focus:ring-2 focus:ring-[#f97316]/20"
        />
        {filter.searchQuery && (
          <button
            type="button"
            aria-label="Aramayı temizle"
            onClick={() => {
              onChange({ ...filter, searchQuery: "" });
              setOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-500 transition hover:bg-white/5 hover:text-gray-200"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Otomatik tamamlama */}
        {open && suggestions.length > 0 && (
          <div id="rtr-search-suggestions" role="listbox" className="absolute left-0 right-0 top-full z-30 mt-1.5 overflow-hidden rounded-xl border border-[#2e3a52] bg-[#0e1422] shadow-2xl">
            {suggestions.map((s, i) => (
              <button
                key={`${s.plate}-${s.name}-${i}`}
                type="button"
                onClick={() => {
                  onPick(s.plate);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left transition hover:bg-[#1a2338]"
              >
                {typeIcon(s.type)}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-gray-100">{s.name}</span>
                  <span className="block text-[11px] text-gray-500">{s.label}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filtreler */}
      <div className="flex gap-2.5">
        <select
          value={filter.region}
          onChange={(e) => onChange({ ...filter, region: e.target.value })}
          aria-label="Bölge filtresi"
          className="min-w-0 flex-1 rounded-xl border border-[#2e3a52] bg-[#0e1422] px-3 py-2.5 text-sm text-gray-100 outline-none transition focus:border-[#f97316] lg:w-auto lg:flex-none"
        >
          <option value="all">Tüm Bölgeler</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <select
          value={filter.status}
          onChange={(e) => onChange({ ...filter, status: e.target.value })}
          aria-label="Durum filtresi"
          className="min-w-0 flex-1 rounded-xl border border-[#2e3a52] bg-[#0e1422] px-3 py-2.5 text-sm text-gray-100 outline-none transition focus:border-[#f97316] lg:w-auto lg:flex-none"
        >
          <option value="all">Tüm Durumlar</option>
          <option value="visited">Gezdiklerim (🎒)</option>
          <option value="transit">Transit / Mola (🚗)</option>
          <option value="lived">Yaşadıklarım (🏡)</option>
          <option value="unvisited">Gitmediklerim (⚪)</option>
        </select>
      </div>
    </div>
  );
}
