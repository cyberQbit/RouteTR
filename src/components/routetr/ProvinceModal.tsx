"use client";

// ==========================================================================
// ROUTE TR — İl Detay Modalı (Drill-Down)
// Ziyaret durumu • İlçe checklist • POI kategori sistemi + vurgulama
// 🌤️ Canlı hava durumu • 🍽️ Mutfak güzergahı • 🗺️ Google Maps yol tarifi
// ==========================================================================

import { useEffect, useMemo, useState } from "react";
import { MapPin, Navigation, UtensilsCrossed, Plus, X, Wind, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PROVINCES_DATA } from "@/data/routetr/provinces";
import { PROVINCE_GEO, PROVINCE_FOODS } from "@/data/routetr/geo";
import { useRouteTR } from "@/lib/routetr/store";
import { calculateProvinceScore, getPoiCategory, POI_CATEGORIES, POI_FALLBACK_CATEGORY, poiSearchUrl, provinceDirectionsUrl, normalizeText } from "@/lib/routetr/logic";
import type { VisitStatus, WeatherInfo } from "@/lib/routetr/types";
import { fetchWeather } from "@/lib/routetr/weather";
import { useToast } from "@/hooks/use-toast";

const STATUS_OPTIONS: { value: VisitStatus; label: string; icon: string }[] = [
  { value: "unvisited", label: "Gitmedim", icon: "⚪" },
  { value: "transit", label: "Transit / Mola", icon: "🚗" },
  { value: "visited", label: "Gezdim", icon: "🎒" },
  { value: "lived", label: "Yaşadım", icon: "🏡" },
];

// Canlı hava durumu çipi — plaka değiştikçe remount edilir (key ile)
function WeatherChip({ plate }: { plate: string }) {
  const geo = PROVINCE_GEO[plate];
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(!!geo);

  useEffect(() => {
    if (!geo) return;
    let cancelled = false;
    fetchWeather(geo.lat, geo.lng)
      .then((w) => {
        if (!cancelled && w) setWeather(w);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [geo]);

  if (loading) {
    return (
      <div className="hidden items-center gap-1.5 rounded-lg border border-[#2e3a52] bg-[#0b0f19] px-2.5 py-1.5 text-xs sm:flex" aria-label="Hava durumu yükleniyor">
        <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
        <span className="text-gray-500">Hava…</span>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div
      className="hidden items-center gap-1.5 rounded-lg border border-[#2e3a52] bg-[#0b0f19] px-2.5 py-1.5 text-xs sm:flex"
      title={`Hissedilen ${weather.apparent}°C • Rüzgar ${weather.windSpeed} km/s`}
    >
      <span className="text-base leading-none" aria-hidden>{weather.icon}</span>
      <span className="font-bold text-white">{weather.temperature}°C</span>
      <span className="text-gray-400">{weather.description}</span>
    </div>
  );
}

export default function ProvinceModal({ plate, onClose }: { plate: string | null; onClose: () => void }) {
  const travelState = useRouteTR((s) => s.travelState);
  const setStatus = useRouteTR((s) => s.setStatus);
  const toggleDistrict = useRouteTR((s) => s.toggleDistrict);
  const togglePoi = useRouteTR((s) => s.togglePoi);
  const addCustomPoi = useRouteTR((s) => s.addCustomPoi);
  const removeCustomPoi = useRouteTR((s) => s.removeCustomPoi);
  const selectAllDistricts = useRouteTR((s) => s.selectAllDistricts);
  const clearDistricts = useRouteTR((s) => s.clearDistricts);
  const setNotes = useRouteTR((s) => s.setNotes);
  const { toast } = useToast();

  const meta = useMemo(() => PROVINCES_DATA.find((p) => p.plate === plate) || null, [plate]);
  const pData = plate ? travelState[plate] : undefined;
  const score = plate ? calculateProvinceScore(travelState, plate) : 0;

  const [customInput, setCustomInput] = useState("");
  const [activeCat, setActiveCat] = useState<string>("all");

  const open = !!meta && !!pData;

  const allPois = useMemo(() => {
    if (!meta || !pData) return [];
    return [...meta.pois, ...(pData.customPois || [])];
  }, [meta, pData]);

  const poiCategories = useMemo(() => {
    const set = new Map<string, { id: string; name: string; icon: string; color: string; count: number }>();
    allPois.forEach((poi) => {
      const cat = getPoiCategory(poi);
      const prev = set.get(cat.id);
      set.set(cat.id, { id: cat.id, name: cat.name, icon: cat.icon, color: cat.color, count: (prev?.count || 0) + 1 });
    });
    return [...set.values()];
  }, [allPois]);

  const visiblePois = useMemo(() => {
    if (activeCat === "all") return allPois;
    return allPois.filter((poi) => getPoiCategory(poi).id === activeCat);
  }, [allPois, activeCat]);

  const handleAddCustom = () => {
    const val = customInput.trim();
    if (!val || !plate) return;
    if (allPois.some((p) => normalizeText(p) === normalizeText(val))) {
      toast({ title: "Bu nokta zaten listede", variant: "destructive" });
      return;
    }
    addCustomPoi(plate, val);
    setCustomInput("");
    toast({ title: "Nokta eklendi 📍", description: val });
  };

  const geo = plate ? PROVINCE_GEO[plate] : undefined;
  const foods = plate ? PROVINCE_FOODS[plate] || [] : [];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-h-[88vh] overflow-hidden border-[#2e3a52] bg-[#0e1422] p-0 text-gray-100 sm:max-w-2xl"
        aria-describedby="province-modal-desc"
      >
        {meta && pData && (
          <>
            {/* Başlık */}
            <DialogHeader className="border-b border-[#232f45] p-4 md:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-12 shrink-0 items-center justify-center rounded-lg border-2 border-[#f97316] bg-[#111827] text-base font-extrabold text-[#f97316]">
                    {meta.plate}
                  </span>
                  <div className="min-w-0">
                    <DialogTitle className="truncate text-lg text-white md:text-xl">{meta.name}</DialogTitle>
                    <DialogDescription id="province-modal-desc" className="text-xs text-gray-400">
                      {meta.region} • {meta.districts.length} ilçe • {meta.pois.length} öne çıkan nokta
                    </DialogDescription>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {/* Canlı hava durumu (plaka başına remount) */}
                  {plate && <WeatherChip key={plate} plate={plate} />}
                  <span className="rounded-full bg-[#f97316]/20 px-3 py-1.5 text-sm font-extrabold text-[#fdba74]">%{score}</span>
                </div>
              </div>

              {/* Google Maps aksiyonları */}
              {geo && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={provinceDirectionsUrl(meta.name, geo.lat, geo.lng)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#f97316] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#ea580c]"
                  >
                    <Navigation className="h-3.5 w-3.5" /> Yol Tarifi Al
                  </a>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(meta.name + " seyahat")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#2e3a52] bg-[#141b2e] px-3 py-1.5 text-xs font-medium text-gray-200 transition hover:border-[#f97316]/60"
                  >
                    <MapPin className="h-3.5 w-3.5 text-[#f97316]" /> Google Maps'te Gör
                  </a>
                </div>
              )}
            </DialogHeader>

            {/* Gövde */}
            <div className="max-h-[calc(88vh-190px)] space-y-5 overflow-y-auto p-4 md:p-5 routetr-scrollbar">
              {/* Ziyaret durumu */}
              <div>
                <div className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Ziyaret Durumu</div>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4" role="radiogroup" aria-label="Ziyaret durumu">
                  {STATUS_OPTIONS.map((opt) => {
                    const active = pData.status === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setStatus(meta.plate, opt.value)}
                        className={`flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-xs font-semibold transition md:text-sm ${
                          active
                            ? "border-[#f97316] bg-[#f97316]/15 text-white"
                            : "border-[#2e3a52] bg-[#0b0f19] text-gray-400 hover:border-[#f97316]/50 hover:text-gray-200"
                        }`}
                      >
                        <span aria-hidden>{opt.icon}</span> {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* İlçeler */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wide text-gray-400">
                    Gezilen İlçeler <span className="ml-1 text-[#fdba74]">{pData.visitedDistricts.length}/{meta.districts.length}</span>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => selectAllDistricts(meta.plate)}
                      className="rounded-md border border-[#2e3a52] px-2 py-1 text-[11px] text-gray-300 transition hover:border-[#f97316]/60 hover:text-white"
                    >
                      Tümünü Seç
                    </button>
                    <button
                      type="button"
                      onClick={() => clearDistricts(meta.plate)}
                      className="rounded-md border border-[#2e3a52] px-2 py-1 text-[11px] text-gray-300 transition hover:border-[#f97316]/60 hover:text-white"
                    >
                      Temizle
                    </button>
                  </div>
                </div>
                <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto rounded-lg border border-[#1a2236] bg-[#0b0f19] p-2.5 routetr-scrollbar">
                  {meta.districts.map((d) => {
                    const active = pData.visitedDistricts.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDistrict(meta.plate, d)}
                        aria-pressed={active}
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                          active
                            ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-300"
                            : "border-[#2e3a52] bg-[#141b2e] text-gray-400 hover:border-emerald-500/40 hover:text-gray-200"
                        }`}
                      >
                        {active ? "✓ " : ""}
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* POI listesi + kategori filtresi */}
              <div>
                <div className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">
                  Görülmeye Değer Popüler Noktalar (POI){" "}
                  <span className="ml-1 text-[#fdba74]">{pData.visitedPois.length}/{allPois.length}</span>
                </div>

                {/* Kategori çipleri (vurgulama) */}
                <div className="mb-2.5 flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveCat("all")}
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                      activeCat === "all" ? "border-[#f97316] bg-[#f97316]/15 text-white" : "border-[#2e3a52] text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    Tümü ({allPois.length})
                  </button>
                  {poiCategories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setActiveCat(c.id)}
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                        activeCat === c.id ? "border-[#f97316] bg-[#f97316]/15 text-white" : "border-[#2e3a52] text-gray-400 hover:text-gray-200"
                      }`}
                    >
                      <span aria-hidden>{c.icon}</span> {c.name} ({c.count})
                    </button>
                  ))}
                </div>

                <div className="max-h-56 space-y-1.5 overflow-y-auto rounded-lg border border-[#1a2236] bg-[#0b0f19] p-2 routetr-scrollbar">
                  {visiblePois.map((poi) => {
                    const checked = pData.visitedPois.includes(poi);
                    const isCustom = (pData.customPois || []).includes(poi);
                    const cat = getPoiCategory(poi);
                    return (
                      <div
                        key={poi}
                        className={`group flex items-center gap-2 rounded-lg border px-2.5 py-2 transition ${
                          checked ? "border-[#f97316]/40 bg-[#f97316]/8" : "border-transparent hover:bg-[#141b2e]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePoi(meta.plate, poi)}
                          aria-label={`${poi} işaretle`}
                          className="h-4 w-4 shrink-0 cursor-pointer accent-[#f97316]"
                        />
                        <span className="shrink-0 text-sm" title={cat.name} aria-hidden>
                          {cat.icon}
                        </span>
                        <span className={`min-w-0 flex-1 truncate text-sm ${checked ? "font-medium text-[#fdba74]" : "text-gray-300"}`}>
                          {poi} {isCustom && <span className="text-[10px] text-[#f59e0b]">(Özel)</span>}
                        </span>
                        <a
                          href={poiSearchUrl(poi, meta.name)}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${poi} için Google Maps'te ara`}
                          className="shrink-0 rounded-md p-1 text-gray-600 opacity-0 transition group-hover:opacity-100 hover:text-[#f97316]"
                          title="Google Maps'te aç"
                        >
                          <MapPin className="h-3.5 w-3.5" />
                        </a>
                        {isCustom && (
                          <button
                            type="button"
                            onClick={() => removeCustomPoi(meta.plate, poi)}
                            aria-label={`${poi} özel noktasını kaldır`}
                            className="shrink-0 rounded-md p-1 text-gray-600 transition hover:text-red-400"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {visiblePois.length === 0 && <div className="p-3 text-center text-xs text-gray-600">Bu kategoride nokta yok.</div>}
                </div>

                {/* Özel nokta ekle */}
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddCustom()}
                    placeholder="+ Bu şehirde gezdiğin özel bir yer / köy / lezzet durağı ekle…"
                    aria-label="Özel nokta ekle"
                    className="min-w-0 flex-1 rounded-lg border border-[#2e3a52] bg-[#0b0f19] px-3 py-2 text-sm text-gray-100 placeholder:text-gray-600 outline-none transition focus:border-[#f97316]"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustom}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[#2e3a52] bg-[#141b2e] px-3 py-2 text-xs font-semibold text-gray-200 transition hover:border-[#f97316] hover:text-white"
                  >
                    <Plus className="h-3.5 w-3.5" /> Ekle
                  </button>
                </div>
              </div>

              {/* 🍽️ Mutfak Güzergahı */}
              {foods.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gray-400">
                    <UtensilsCrossed className="h-3.5 w-3.5 text-[#f97316]" /> Mutfak Güzergahı — {meta.name} Meşhurları
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {foods.map((f) => (
                      <a
                        key={f.dish}
                        href={poiSearchUrl(f.dish, meta.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group rounded-lg border border-[#2e3a52] bg-[#141b2e] p-2.5 transition hover:border-[#f97316]/60 hover:bg-[#1a2338]"
                        title={`${f.dish} için Google Maps'te ara`}
                      >
                        <div className="text-xs font-bold text-gray-100 group-hover:text-[#fdba74]">🍽️ {f.dish}</div>
                        <div className="mt-0.5 text-[10px] leading-snug text-gray-500">{f.desc}</div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Seyahat notu */}
              <div>
                <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gray-400">
                  <Wind className="h-3.5 w-3.5 text-[#f97316]" /> Kişisel Seyahat Notu
                </div>
                <textarea
                  value={pData.notes}
                  onChange={(e) => setNotes(meta.plate, e.target.value)}
                  placeholder="Bu şehir hakkındaki anıların, seyahat tarihin veya notların…"
                  rows={3}
                  aria-label="Kişisel seyahat notu"
                  className="w-full resize-none rounded-lg border border-[#2e3a52] bg-[#0b0f19] p-3 text-sm text-gray-100 placeholder:text-gray-600 outline-none transition focus:border-[#f97316]"
                />
              </div>
            </div>

            {/* Alt bar */}
            <div className="flex items-center justify-between border-t border-[#232f45] p-3.5">
              <span className="text-[11px] text-gray-500">Değişiklikler anlık kaydedilir 💾</span>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-[#f97316] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#ea580c]"
              >
                Kaydet ve Kapat
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
