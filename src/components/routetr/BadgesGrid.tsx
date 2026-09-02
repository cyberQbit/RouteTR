"use client";

// ==========================================================================
// ROUTE TR — 🏅 Rozet & Başarı Sistemi (22 rozet)
// ==========================================================================

import { useMemo, useRef, useState, useEffect } from "react";
import { useRouteTR } from "@/lib/routetr/store";
import { BADGES_CATALOG, getUnlockedBadges } from "@/lib/routetr/logic";

export default function BadgesGrid() {
  const travelState = useRouteTR((s) => s.travelState);
  const unlocked = useMemo(() => new Set(getUnlockedBadges(travelState)), [travelState]);
  const prevUnlocked = useRef<Set<string>>(new Set());
  const [justUnlocked, setJustUnlocked] = useState<string | null>(null);

  // Yeni açılan rozette kısa animasyon vurgusu
  useEffect(() => {
    const newly = [...unlocked].filter((id) => !prevUnlocked.current.has(id));
    prevUnlocked.current = unlocked;
    if (newly.length > 0 && prevUnlocked.current.size > 0) {
      setJustUnlocked(newly[newly.length - 1]);
      const t = setTimeout(() => setJustUnlocked(null), 2200);
      return () => clearTimeout(t);
    }
  }, [unlocked]);

  return (
    <section aria-label="Rozetler ve başarılar" data-tour="badges">
      <div className="mb-3">
        <h2 className="text-lg font-bold text-white">🏅 Rozetlerin & Başarıların</h2>
        <p className="text-xs text-gray-400">
          {unlocked.size}/{BADGES_CATALOG.length} rozet açıldı — keşif yolculuğundaki başarılarını göster
        </p>
      </div>

      <div className="grid max-h-96 grid-cols-2 gap-3 overflow-y-auto pr-1 pb-1 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 routetr-scrollbar">
        {BADGES_CATALOG.map((badge) => {
          const isUnlocked = unlocked.has(badge.id);
          const progress = badge.progress ? Math.min(100, badge.progress(travelState)) : isUnlocked ? 100 : 0;
          return (
            <div
              key={badge.id}
              title={badge.desc}
              className={`flex flex-col rounded-xl border p-3 text-center transition-all duration-300 ${
                isUnlocked ? "border-[#f97316]/60 bg-gradient-to-b from-[#f97316]/15 to-[#141b2e]" : "border-[#232f45] bg-[#10172a] opacity-70"
              } ${justUnlocked === badge.id ? "animate-bounce border-[#f97316] shadow-[0_0_20px_rgba(249,115,22,0.4)]" : ""}`}
            >
              <div className={`text-3xl ${isUnlocked ? "" : "grayscale"}`} aria-hidden>
                {badge.icon}
              </div>
              <div className={`mt-1.5 text-xs font-bold ${isUnlocked ? "text-white" : "text-gray-400"}`}>{badge.name}</div>
              <div className="mt-0.5 line-clamp-2 text-[10px] leading-tight text-gray-500">{badge.desc}</div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#1a2236]">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${isUnlocked ? "bg-[#f97316]" : "bg-gray-600"}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className={`mt-1.5 text-[10px] font-bold ${isUnlocked ? "text-[#f97316]" : "text-gray-500"}`}>{isUnlocked ? "✓ Açıldı" : `%${Math.round(progress)}`}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
