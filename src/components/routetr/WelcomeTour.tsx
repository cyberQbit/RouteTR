"use client";

// ==========================================================================
// ROUTE TR — 👋 Hoş Geldin Turu (ilk ziyarette otomatik açılır)
// Spotlight'lı 6 adımlı interaktif tanıtım turu
// ==========================================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { X, ChevronLeft, ChevronRight, Compass } from "lucide-react";
import { useRouteTR } from "@/lib/routetr/store";

interface TourStep {
  target: string;
  title: string;
  desc: string;
  emoji: string;
}

const STEPS: TourStep[] = [
  {
    target: "dashboard",
    title: "Keşif Panon",
    desc: "Türkiye keşif oranın, ziyaret ettiğin il/ilçe/POI sayıları burada canlı hesaplanır.",
    emoji: "📊",
  },
  {
    target: "search",
    title: "Akıllı Arama",
    desc: "Türkçe karakter duyarlı arama: 'eskişehir' yazsan da Eskişehir'i bulur. Plaka kodu da işe yarar (örn. 26).",
    emoji: "🔍",
  },
  {
    target: "map",
    title: "İnteraktif Harita",
    desc: "İl ve ilçelere tıkla, sürükle, tekerlekle ya da iki parmakla yakınlaştır. Renkler keşif seviyeni gösterir.",
    emoji: "🗺️",
  },
  {
    target: "badges",
    title: "22 Rozet Seni Bekliyor",
    desc: "İlk Adım'dan Türkiye Fatihi'ne kadar başarı rozetleri kazançça ilerlersin.",
    emoji: "🏅",
  },
  {
    target: "goals",
    title: "Hedef Koy",
    desc: "'Bu yıl 5 yeni il gez' gibi hedefler oluştur; ilerlemen otomatik takip edilir.",
    emoji: "🎯",
  },
  {
    target: "actions",
    title: "Veriler Senin",
    desc: "Her şey tarayıcında saklanır. JSON yedekle, başka cihaza taşı, kartpostalını paylaş!",
    emoji: "💾",
  },
];

export default function WelcomeTour() {
  const tourDone = useRouteTR((s) => s.tourDone);
  const setTourDone = useRouteTR((s) => s.setTourDone);
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const current = STEPS[step];

  const startTour = useCallback(() => setActive(true), []);

  useEffect(() => {
    if (!tourDone) {
      // Küçük gecikme: hydration + layout otursun
      const t = setTimeout(startTour, 900);
      return () => clearTimeout(t);
    }
  }, [tourDone, startTour]);

  const updateRect = useCallback(() => {
    const el = document.querySelector(`[data-tour="${STEPS[step].target}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      const r = (el as HTMLElement).getBoundingClientRect();
      setRect(r);
    } else {
      setRect(null);
    }
  }, [step]);

  useEffect(() => {
    if (!active) return;
    const t = setTimeout(updateRect, 60);
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, { passive: true });
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect);
    };
  }, [active, updateRect]);

  const finish = useCallback(() => {
    setActive(false);
    setTourDone();
  }, [setTourDone]);

  const next = () => (step < STEPS.length - 1 ? setStep(step + 1) : finish());
  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  // Baloncuk konumu: vurgu kutusunun altına, taşmasa yukarısına
  const bubbleStyle = useMemo(() => {
    if (!rect) {
      return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    }
    const pad = 10;
    const below = rect.bottom + pad;
    const bubbleH = 190;
    if (below + bubbleH < window.innerHeight) {
      return { top: below, left: Math.max(12, Math.min(window.innerWidth - 340, rect.left)) };
    }
    const topY = Math.max(12, rect.top - bubbleH - pad);
    return { top: topY, left: Math.max(12, Math.min(window.innerWidth - 340, rect.left)) };
  }, [rect]);

  if (!active) return null;

  const hlPad = 6;
  const hlStyle = rect
    ? {
        top: rect.top - hlPad,
        left: rect.left - hlPad,
        width: rect.width + hlPad * 2,
        height: rect.height + hlPad * 2,
      }
    : {
        top: "50%",
        left: "50%",
        width: 0,
        height: 0,
      };

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Hoş geldin turu">
      {/* Karartma + spotlight (4 kaplama dikdörtgeni) */}
      {rect ? (
        <>
          <div className="absolute inset-0 bg-black/70 transition-all duration-300" style={{ left: 0, right: 0, top: 0, height: hlStyle.top }} />
          <div className="absolute inset-0 bg-black/70 transition-all duration-300" style={{ left: 0, width: hlStyle.left, top: hlStyle.top, height: hlStyle.height }} />
          <div className="absolute inset-0 bg-black/70 transition-all duration-300" style={{ left: (hlStyle.left as number) + (hlStyle.width as number), right: 0, top: hlStyle.top, height: hlStyle.height }} />
          <div className="absolute inset-0 bg-black/70 transition-all duration-300" style={{ left: 0, right: 0, top: (hlStyle.top as number) + (hlStyle.height as number), bottom: 0 }} />
        </>
      ) : (
        <div className="absolute inset-0 bg-black/70" />
      )}

      {/* Vurgu çerçevesi */}
      <div className="pointer-events-none absolute rounded-xl border-2 border-[#f97316] shadow-[0_0_0_4px_rgba(249,115,22,0.25),0_0_40px_rgba(249,115,22,0.35)] transition-all duration-300" style={hlStyle} />

      {/* Bilgi baloncuğu */}
      <div className="absolute w-[320px] max-w-[calc(100vw-24px)] rounded-2xl border border-[#2e3a52] bg-[#0e1422] p-4 shadow-2xl" style={bubbleStyle}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden>{current.emoji}</span>
            <h3 className="text-sm font-bold text-white">{current.title}</h3>
          </div>
          <button type="button" onClick={finish} aria-label="Turu kapat" className="rounded-md p-1 text-gray-500 transition hover:bg-white/5 hover:text-gray-200">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-gray-400">{current.desc}</p>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex gap-1" aria-label={`Adım ${step + 1}/${STEPS.length}`}>
            {STEPS.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-5 bg-[#f97316]" : "w-1.5 bg-[#2e3a52]"}`} />
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            {step > 0 && (
              <button type="button" onClick={prev} className="inline-flex items-center rounded-lg border border-[#2e3a52] px-2.5 py-1.5 text-xs text-gray-300 transition hover:border-[#f97316]/60">
                <ChevronLeft className="h-3.5 w-3.5" /> Geri
              </button>
            )}
            <button
              type="button"
              onClick={next}
              className="inline-flex items-center gap-1 rounded-lg bg-[#f97316] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#ea580c]"
            >
              {step === STEPS.length - 1 ? "Başla 🚀" : "İleri"} <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Tur başlığı rozeti */}
      <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-[#2e3a52] bg-[#0e1422]/90 px-3 py-1.5 text-xs font-bold text-[#fdba74]">
        <Compass className="h-3.5 w-3.5" /> Route TR Turu • {step + 1}/{STEPS.length}
      </div>
    </div>
  );
}
