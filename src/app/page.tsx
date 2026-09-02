"use client";

// ==========================================================================
// ROUTE TR — Türkiye Granüler Seyahat & Keşif Haritası
// Next.js v3.0: Hava durumu • Google Maps • Mutfak güzergahları • POI
// kategorileri • Hoş Geldin Turu • Hedefler • Bölgesel analiz
// ==========================================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import Header from "@/components/routetr/Header";
import DashboardBar from "@/components/routetr/DashboardBar";
import BadgesGrid from "@/components/routetr/BadgesGrid";
import SuggestionsGrid from "@/components/routetr/SuggestionsGrid";
import RegionAnalytics from "@/components/routetr/RegionAnalytics";
import GoalsSection from "@/components/routetr/GoalsSection";
import SearchControls from "@/components/routetr/SearchControls";
import TurkeyMap from "@/components/routetr/TurkeyMap";
import ExplorerGrid from "@/components/routetr/ExplorerGrid";
import ProvinceModal from "@/components/routetr/ProvinceModal";
import PostcardModal from "@/components/routetr/PostcardModal";
import WelcomeTour from "@/components/routetr/WelcomeTour";
import { useRouteTR } from "@/lib/routetr/store";
import { computeGlobalStats, getTravelerTitle, type FilterOptions } from "@/lib/routetr/logic";
import { Github, ExternalLink } from "lucide-react";

const LEGEND_ITEMS = [
  { color: "#182032", label: "Gitmedim (%0)" },
  { color: "#f59e0b", label: "Transit" },
  { color: "#fb923c", label: "Kısmen (%1-35)" },
  { color: "#ea580c", label: "Gezdim (%36-70)" },
  { color: "#dc2626", label: "Kapsamlı (%71-99)" },
  { color: "#9333ea", label: "Tamamlandı (%100)" },
  { color: "#2563eb", label: "Yaşadım" },
];

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<FilterOptions>({ searchQuery: "", region: "all", status: "all" });
  const [activePlate, setActivePlate] = useState<string | null>(null);
  const [postcardOpen, setPostcardOpen] = useState(false);
  const [tourKey, setTourKey] = useState(0);

  const travelState = useRouteTR((s) => s.travelState);
  const ensureInit = useRouteTR((s) => s.ensureInit);
  const setTourDone = useRouteTR((s) => s.setTourDone);

  useEffect(() => {
    ensureInit();
    // mounted bayrağı: SSR/CSR eşleşmesini garantiler
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, [ensureInit]);

  // Dinamik sayfa başlığı (SEO & paylaşım): unvan + keşif yüzdesi
  const stats = useMemo(() => computeGlobalStats(travelState), [travelState]);
  const traveler = useMemo(() => getTravelerTitle(stats.averageScore), [stats.averageScore]);
  useEffect(() => {
    if (!mounted) return;
    document.title = `${traveler.title} • Route TR — %${stats.averageScore.toFixed(1)} Keşif`;
  }, [mounted, traveler.title, stats.averageScore]);

  const openProvince = useCallback((plate: string) => setActivePlate(plate), []);
  const closeProvince = useCallback(() => setActivePlate(null), []);
  const replayTour = useCallback(() => {
    setTourDone(false);
    setTourKey((k) => k + 1);
  }, [setTourDone]);

  if (!mounted) {
    return (
      <div className="flex min-h-screen flex-col bg-[#0b0f19]">
        <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-3 py-6 md:px-6">
          <div className="h-14 animate-pulse rounded-xl bg-[#141b2e]" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-[#141b2e]" />
            ))}
          </div>
          <div className="h-8 w-56 animate-pulse rounded-lg bg-[#141b2e]" />
          <div className="h-80 animate-pulse rounded-xl bg-[#141b2e]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0b0f19] text-gray-100 antialiased">
      <Header onPostcard={() => setPostcardOpen(true)} onReplayTour={replayTour} />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-7 px-3 py-5 md:px-6 md:py-7">
        {/* Keşif panosu */}
        <DashboardBar />

        {/* Rozetler */}
        <BadgesGrid />

        {/* Akıllı öneriler */}
        <SuggestionsGrid onProvinceClick={openProvince} />

        {/* 7 bölge seyahat endeksi */}
        <RegionAnalytics />

        {/* Seyahat hedefleri */}
        <GoalsSection />

        {/* Arama & filtre */}
        <SearchControls filter={filter} onChange={setFilter} onPick={openProvince} />

        {/* İnteraktif harita */}
        <section aria-label="İnteraktif Türkiye haritası">
          <div className="mb-3">
            <h2 className="text-lg font-bold text-white">
              🗺️ İnteraktif Türkiye Haritası{" "}
              <small className="text-xs font-normal text-gray-500">(İle veya ilçeye tıklayarak detayları açın)</small>
            </h2>
          </div>
          <TurkeyMap filter={filter} onProvinceClick={openProvince} />

          {/* Lejant */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 rounded-xl border border-[#1a2236] bg-[#0e1422] px-3 py-2.5">
            {LEGEND_ITEMS.map((li) => (
              <div key={li.label} className="flex items-center gap-1.5">
                <span className="h-3 w-4 rounded-sm" style={{ background: li.color }} aria-hidden />
                <span className="text-[11px] text-gray-400">{li.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-4 rounded-sm" style={{ background: "repeating-linear-gradient(45deg, #f59e0b 0 2px, transparent 2px 4px)" }} aria-hidden />
              <span className="text-[11px] text-gray-400">Transit tarama</span>
            </div>
          </div>
        </section>

        {/* Şehir listesi */}
        <ExplorerGrid filter={filter} onProvinceClick={openProvince} />
      </main>

      {/* Sticky footer — içerik kısaken ekranın altında, uzunken doğal olarak aşağı itilir */}
      <footer className="mt-auto border-t border-[#1e293b] bg-[#090d16] pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 px-3 py-4 md:flex-row md:px-6">
          <div className="text-xs text-gray-500">
            <strong className="text-gray-300">Route TR</strong> • Türkiye Seyahat & Keşif Haritası • v3.0
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs">
            <a
              href="https://github.com/cyberQbit"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-gray-400 transition hover:text-[#f97316]"
            >
              <Github className="h-3.5 w-3.5" /> cyberQbit
            </a>
            <a
              href="https://github.com/cyberQbit/RouteTR"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-gray-400 transition hover:text-[#f97316]"
            >
              <ExternalLink className="h-3.5 w-3.5" /> GitHub Repository
            </a>
            <span className="text-gray-600">GNU GPL v3.0</span>
          </div>
        </div>
      </footer>

      {/* Modallar & tur */}
      <ProvinceModal plate={activePlate} onClose={closeProvince} />
      <PostcardModal open={postcardOpen} onClose={() => setPostcardOpen(false)} />
      <WelcomeTour key={tourKey} />
    </div>
  );
}
