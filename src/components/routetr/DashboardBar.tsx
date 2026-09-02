"use client";

// ==========================================================================
// ROUTE TR — Üst Dashboard Özet Barı (mobil 2 kolon / masaüstü 4 kolon)
// ==========================================================================

import { useRouteTR } from "@/lib/routetr/store";
import { computeGlobalStats, getTravelerTitle } from "@/lib/routetr/logic";

export default function DashboardBar() {
  const travelState = useRouteTR((s) => s.travelState);
  const stats = computeGlobalStats(travelState);
  const title = getTravelerTitle(stats.averageScore);

  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" data-tour="dashboard" aria-label="Seyahat istatistikleri">
      <div className="rounded-xl border border-[#232f45] bg-[#141b2e] p-4 transition hover:border-[#f97316]/50">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1e293b] text-xl" aria-hidden>
            🇹🇷
          </div>
          <div className="min-w-0">
            <div className="truncate text-[11px] font-medium uppercase tracking-wide text-gray-400">Türkiye Keşif Oranı</div>
            <div className="text-xl font-extrabold text-[#f97316]">%{stats.averageScore.toFixed(1)}</div>
            <div className="truncate text-xs" style={{ color: title.color }}>
              {title.title}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[#232f45] bg-[#141b2e] p-4 transition hover:border-[#f97316]/50">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1e293b] text-xl" aria-hidden>
            📍
          </div>
          <div className="min-w-0">
            <div className="truncate text-[11px] font-medium uppercase tracking-wide text-gray-400">Ziyaret Edilen İller</div>
            <div className="text-xl font-extrabold text-white">{stats.activeProvinces} / 81</div>
            <div className="text-xs text-gray-500">İl bazlı kayıt</div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[#232f45] bg-[#141b2e] p-4 transition hover:border-[#f97316]/50">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1e293b] text-xl" aria-hidden>
            🏙️
          </div>
          <div className="min-w-0">
            <div className="truncate text-[11px] font-medium uppercase tracking-wide text-gray-400">Keşfedilen İlçeler</div>
            <div className="text-xl font-extrabold text-white">
              {stats.visitedDistricts} <span className="text-sm font-medium text-gray-400">/ {stats.totalDistricts}</span>
            </div>
            <div className="text-xs text-gray-500">Detaylı ilçe kaydı</div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[#232f45] bg-[#141b2e] p-4 transition hover:border-[#f97316]/50">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1e293b] text-xl" aria-hidden>
            ⭐
          </div>
          <div className="min-w-0">
            <div className="truncate text-[11px] font-medium uppercase tracking-wide text-gray-400">Görülen Noktalar (POI)</div>
            <div className="text-xl font-extrabold text-white">
              {stats.visitedPois} <span className="text-sm font-medium text-gray-400">/ {stats.totalPois}</span>
            </div>
            <div className="text-xs text-gray-500">Tarihi / doğal lokasyonlar</div>
          </div>
        </div>
      </div>
    </section>
  );
}
