"use client";

// ==========================================================================
// ROUTE TR — 🧭 Akıllı Öneri Motoru: "Yakınında Gitmediğin Şehirler"
// ==========================================================================

import { useRouteTR } from "@/lib/routetr/store";
import { getSmartSuggestions } from "@/lib/routetr/logic";

export default function SuggestionsGrid({ onProvinceClick }: { onProvinceClick: (plate: string) => void }) {
  const travelState = useRouteTR((s) => s.travelState);
  const suggestions = getSmartSuggestions(travelState);

  return (
    <section aria-label="Sonraki hedef önerileri">
      <div className="mb-3">
        <h2 className="text-lg font-bold text-white">🧭 Sonraki Hedef: Yakında Ne Var?</h2>
        <p className="text-xs text-gray-400">Ziyaret ettiğin yerler yakınında ama henüz gitmediğin ilçeler</p>
      </div>

      {suggestions.length === 0 ? (
        <div className="rounded-xl border border-[#232f45] bg-[#141b2e] p-6 text-center text-sm text-gray-400">
          🎉 Tüm yakınlardaki ilçeler zaten işaretlenmiş! Yeni bölgeler keşfetmeyi deneyin.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {suggestions.map((sug) => (
            <button
              key={sug.plate}
              type="button"
              onClick={() => onProvinceClick(sug.plate)}
              className="group rounded-xl border border-[#232f45] bg-[#141b2e] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#f97316]/60 hover:bg-[#1a2338]"
              aria-label={`${sug.name} detaylarını aç`}
            >
              <div className="flex items-start justify-between">
                <div className="text-base font-bold text-white group-hover:text-[#fdba74]">{sug.name}</div>
                <span className="rounded-md bg-[#0e1422] px-2 py-0.5 text-[10px] font-bold text-[#f59e0b]">{sug.plate}</span>
              </div>
              <div className="mt-1 text-xs text-gray-400">📍 {sug.region}</div>
              <div className="mt-2 inline-block rounded-full bg-[#f97316]/10 px-2.5 py-1 text-[11px] text-[#fdba74]">💡 {sug.reason}</div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
