"use client";

// ==========================================================================
// ROUTE TR — Header: marka + veri aksiyonları (kartpostal, yedek, yükle, sıfırla)
// ==========================================================================

import { useRef } from "react";
import { Camera, Save, FolderOpen, Trash2, Compass } from "lucide-react";
import { useRouteTR } from "@/lib/routetr/store";
import type { TravelState } from "@/lib/routetr/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export default function Header({
  onPostcard,
  onReplayTour,
}: {
  onPostcard: () => void;
  onReplayTour: () => void;
}) {
  const travelState = useRouteTR((s) => s.travelState);
  const goals = useRouteTR((s) => s.goals);
  const importState = useRouteTR((s) => s.importState);
  const resetAll = useRouteTR((s) => s.resetAll);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const exportJson = () => {
    const payload = { travelState, goals, exportedAt: new Date().toISOString(), app: "RouteTR" };
    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `route-tr-travel-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Yedek indirildi 💾", description: "JSON dosyan cihazına kaydedildi." });
  };

  const handleImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        // Hem eski (v1: düz travelState) hem yeni ({travelState, goals}) formatını destekle
        const state: TravelState = parsed?.travelState ?? parsed;
        if (typeof state !== "object" || state === null) throw new Error("format");
        importState(state as TravelState, Array.isArray(parsed?.goals) ? parsed.goals : undefined);
        toast({ title: "Veriler yüklendi 📂", description: "Seyahat kayıtların başarıyla geri getirildi." });
      } catch {
        toast({ title: "Geçersiz JSON", description: "Dosya formatı tanınamadı.", variant: "destructive" });
      }
    };
    reader.readAsText(file);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#1e293b] bg-[#0b0f19]/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-2 px-3 py-2.5 md:px-6 md:py-3">
        {/* Marka */}
        <a href="./" className="flex min-w-0 items-center gap-2.5" aria-label="Route TR ana sayfa">
          <svg className="h-10 w-10 shrink-0" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <defs>
              <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
            </defs>
            <path d="M 50,5 C 80,5 92,20 92,42 C 92,72 50,95 50,95 C 50,95 8,72 8,42 C 8,20 20,5 50,5 Z" fill="url(#shieldGrad)" stroke="#f97316" strokeWidth="4" strokeLinejoin="round" />
            <path d="M 12,32 C 28,34 72,34 88,32" stroke="#f97316" strokeWidth="2" fill="none" />
            <text x="50" y="24" fontSize="11" fontWeight="900" fill="#f8fafc" textAnchor="middle" letterSpacing="2">TÜRKİYE</text>
            <text x="50" y="65" fontSize="34" fontWeight="900" fill="#f97316" textAnchor="middle">TR</text>
            <circle cx="50" cy="78" r="2.5" fill="#f8fafc" />
          </svg>
          <div className="min-w-0">
            <h1 className="text-base font-extrabold leading-tight tracking-wide text-white md:text-lg">ROUTE TR</h1>
            <p className="hidden text-[11px] text-gray-400 sm:block">Türkiye Granüler Seyahat & Keşif Haritası</p>
          </div>
        </a>

        {/* Aksiyonlar */}
        <div className="flex items-center gap-1.5" data-tour="actions">
          <button
            type="button"
            onClick={onPostcard}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#f97316] px-2.5 py-2 text-xs font-bold text-white transition hover:bg-[#ea580c] md:text-sm"
            title="Sosyal Medya Kartı Oluştur"
          >
            <Camera className="h-4 w-4" /> <span className="hidden sm:inline">Seyahat Kartı</span>
          </button>
          <button
            type="button"
            onClick={exportJson}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#2e3a52] bg-[#111827] px-2.5 py-2 text-xs font-medium text-gray-200 transition hover:border-[#f97316]/60 md:text-sm"
            title="Verileri JSON olarak yedekle"
          >
            <Save className="h-4 w-4" /> <span className="hidden md:inline">Yedekle</span>
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#2e3a52] bg-[#111827] px-2.5 py-2 text-xs font-medium text-gray-200 transition hover:border-[#f97316]/60 md:text-sm"
            title="JSON yedeğini yükle"
          >
            <FolderOpen className="h-4 w-4" /> <span className="hidden md:inline">Yükle</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            accept=".json"
            className="hidden"
            aria-label="JSON yedeği seç"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImportFile(f);
              e.target.value = "";
            }}
          />

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500/20 md:text-sm"
                title="Tüm işaretlemeleri temizle"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="border-[#2e3a52] bg-[#0e1422] text-gray-100">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">Tüm veriler silinsin mi?</AlertDialogTitle>
                <AlertDialogDescription className="text-gray-400">
                  Tüm işaretlemeler, ilçe/POI kayıtların, notların ve hedeflerin sıfırlanacak. Bu işlem geri alınamaz — önce &quot;Yedekle&quot; ile JSON indirmen önerilir.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-[#2e3a52] bg-transparent text-gray-200 hover:bg-[#1a2338]">Vazgeç</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 text-white hover:bg-red-700"
                  onClick={() => {
                    resetAll();
                    toast({ title: "Sıfırlandı", description: "Tüm seyahat verilerin temizlendi." });
                  }}
                >
                  Evet, Sıfırla
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <button
            type="button"
            onClick={onReplayTour}
            className="inline-flex items-center rounded-lg border border-[#2e3a52] bg-[#111827] px-2.5 py-2 text-gray-300 transition hover:border-[#f97316]/60 hover:text-white"
            title="Hoş geldin turunu tekrar izle"
            aria-label="Hoş geldin turunu tekrar izle"
          >
            <Compass className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
