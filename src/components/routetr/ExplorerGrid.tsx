"use client";

// ==========================================================================
// ROUTE TR — Şehirler Listesi & Hızlı Düzenleme (Explorer Grid)
// ==========================================================================

import { PROVINCES_DATA } from "@/data/routetr/provinces";
import { useRouteTR } from "@/lib/routetr/store";
import { calculateProvinceScore, checkProvinceMatch, type FilterOptions } from "@/lib/routetr/logic";

function StatusPill({ score, status }: { score: number; status: string }) {
  if (status === "lived")
    return <span className="shrink-0 rounded-full bg-blue-500/20 px-2.5 py-1 text-[11px] font-bold text-blue-300">Yaşadım ({score}%)</span>;
  if (status === "transit")
    return <span className="shrink-0 rounded-full bg-amber-500/20 px-2.5 py-1 text-[11px] font-bold text-amber-300">Transit ({score}%)</span>;
  if (score > 0) return <span className="shrink-0 rounded-full bg-[#f97316]/25 px-2.5 py-1 text-[11px] font-bold text-[#fed7aa]">{score}%</span>;
  return <span className="shrink-0 rounded-full bg-[#1a2236] px-2.5 py-1 text-[11px] font-bold text-gray-500">%0</span>;
}

export default function ExplorerGrid({
  filter,
  onProvinceClick,
}: {
  filter: FilterOptions;
  onProvinceClick: (plate: string) => void;
}) {
  const travelState = useRouteTR((s) => s.travelState);
  const filtered = PROVINCES_DATA.filter((p) => checkProvinceMatch(travelState, p, filter));

  return (
    <section aria-label="Şehirler listesi">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-1">
        <h2 className="text-lg font-bold text-white">📋 Şehirler Listesi & Hızlı Düzenleme</h2>
        <span className="text-xs text-gray-500">
          {filtered.length} il gösteriliyor • Kartlara tıklayarak seyahat notu ve ilçe ekle
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-[#232f45] bg-[#141b2e] p-8 text-center text-sm text-gray-400">
          Aramanızla eşleşen şehir veya ilçe bulunamadı. 🔍
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => {
            const pData = travelState[p.plate];
            const score = calculateProvinceScore(travelState, p.plate);
            const status = pData?.status || "unvisited";

            return (
              <button
                key={p.plate}
                type="button"
                onClick={() => onProvinceClick(p.plate)}
                className="group flex items-center justify-between gap-3 rounded-xl border border-[#232f45] bg-[#141b2e] p-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-[#f97316]/60 hover:bg-[#1a2338] hover:shadow-lg"
                aria-label={`${p.name} detaylarını aç`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`flex h-9 w-11 shrink-0 items-center justify-center rounded-md border text-sm font-extrabold transition ${
                      status !== "unvisited"
                        ? "border-[#f97316]/50 bg-[#f97316]/10 text-[#fdba74]"
                        : "border-[#2e3a52] bg-[#0e1422] text-gray-500"
                    }`}
                  >
                    {p.plate}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-gray-100 group-hover:text-white">{p.name}</div>
                    <div className="truncate text-[11px] text-gray-500">
                      {p.region} • {(pData?.visitedDistricts || []).length}/{p.districts.length} ilçe
                      {(pData?.visitedPois || []).length > 0 && ` • ${(pData?.visitedPois || []).length} POI`}
                    </div>
                  </div>
                </div>
                <StatusPill score={score} status={status} />
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
