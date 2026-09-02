"use client";

// ==========================================================================
// ROUTE TR — 📊 Türkiye Seyahat Endeksi: 7 Bölgesel Analiz
// (README'de vaat edilen, eski sürümde UI'sı olmayan modül)
// ==========================================================================

import { useRouteTR } from "@/lib/routetr/store";
import { computeRegionStats } from "@/lib/routetr/logic";

const REGION_EMOJI: Record<string, string> = {
  Marmara: "🌊",
  Ege: "☀️",
  Akdeniz: "🏖️",
  "İç Anadolu": "🗻",
  Karadeniz: "⚓",
  "Doğu Anadolu": "🏔️",
  "Güneydoğu Anadolu": "🔥",
};

function scoreColor(score: number): string {
  if (score === 0) return "#4b5563";
  if (score <= 35) return "#fb923c";
  if (score <= 70) return "#ea580c";
  if (score < 100) return "#dc2626";
  return "#9333ea";
}

export default function RegionAnalytics() {
  const travelState = useRouteTR((s) => s.travelState);
  const regions = computeRegionStats(travelState);
  const bestRegion = [...regions].sort((a, b) => b.score - a.score)[0];

  return (
    <section aria-label="Bölgesel analiz" className="rounded-xl border border-[#232f45] bg-[#141b2e] p-4 md:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-white md:text-lg">📊 Türkiye Seyahat Endeksi</h2>
          <p className="text-xs text-gray-400">7 coğrafi bölgenin tamamlanma durumları ve şeffaf puanlama</p>
        </div>
        {bestRegion && bestRegion.score > 0 && (
          <div className="rounded-lg border border-[#f97316]/40 bg-[#f97316]/10 px-3 py-1.5 text-xs text-[#fdba74]">
            En iyi bölgen: <strong>{REGION_EMOJI[bestRegion.region]} {bestRegion.region}</strong> (%{bestRegion.score})
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {regions.map((r) => (
          <div key={r.region} className="rounded-lg border border-[#232f45] bg-[#0e1422] p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-200">
                {REGION_EMOJI[r.region]} {r.region}
              </span>
              <span className="text-sm font-bold" style={{ color: scoreColor(r.score) }}>
                %{r.score}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#1a2236]">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${r.score}%`, background: scoreColor(r.score) }} />
            </div>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-gray-500">
              <span>🏘️ {r.visitedDistricts}/{r.districts} ilçe</span>
              <span>📍 {r.visitedPois} POI</span>
              <span>🗺️ {r.visitedProvinces}/{r.provinces} il aktif</span>
            </div>
          </div>
        ))}
      </div>

      <details className="mt-4 rounded-lg border border-[#232f45] bg-[#0e1422] p-3">
        <summary className="cursor-pointer text-xs font-medium text-gray-400 hover:text-gray-200">Puanlama metodolojisi nedir?</summary>
        <ul className="mt-2 space-y-1 text-xs text-gray-500">
          <li>• <strong className="text-gray-300">İl durumu:</strong> Gezdim +30, Yaşadım +70, Transit +15 temel puan</li>
          <li>• <strong className="text-gray-300">İlçeler:</strong> Gezilen ilçe oranına göre +40 puan</li>
          <li>• <strong className="text-gray-300">POI:</strong> Görülen nokta oranına göre +30 puan</li>
          <li>• Bölge puanı = il puanlarının ortalaması; keşif oranın = 81 il ortalaması</li>
        </ul>
      </details>
    </section>
  );
}
