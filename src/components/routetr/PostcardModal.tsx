"use client";

// ==========================================================================
// ROUTE TR — 📸 Sosyal Medya Seyahat Kartı (Canvas PNG Export)
// Harita + keşif yüzdesi + rozetler + unvan tek tıkla kartpostal olur
// ==========================================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Download, Loader2 } from "lucide-react";
import { useRouteTR } from "@/lib/routetr/store";
import { PROVINCES_DATA } from "@/data/routetr/provinces";
import { BADGES_CATALOG, calculateProvinceScore, computeGlobalStats, getTravelerTitle, getUnlockedBadges } from "@/lib/routetr/logic";

const W = 1200;
const H = 800;

export default function PostcardModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const travelState = useRouteTR((s) => s.travelState);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rendering, setRendering] = useState(false);
  const [ready, setReady] = useState(false);

  const draw = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    setRendering(true);

    canvas.width = W;
    canvas.height = H;

    // Arka plan
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#0b0f19");
    bg.addColorStop(1, "#070b13");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Çerçeve
    ctx.strokeStyle = "#2e3a52";
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, W - 40, H - 40);

    // Marka
    ctx.fillStyle = "#f97316";
    ctx.font = "900 34px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("ROUTE TR", 50, 78);
    ctx.fillStyle = "#f9fafb";
    ctx.font = "700 21px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("TÜRKİYE SEYAHAT VE KEŞİF GÜNLÜĞÜ", 235, 74);

    const stats = computeGlobalStats(travelState);
    const avgScore = stats.averageScore.toFixed(1);
    const traveler = getTravelerTitle(stats.averageScore);
    const unlockedBadges = getUnlockedBadges(travelState);

    // Skor kartı
    ctx.fillStyle = "#1a2236";
    ctx.strokeStyle = "#f97316";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(W - 330, 40, 280, 72, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#9ca3af";
    ctx.font = "500 12px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("KEŞİF SKORU", W - 308, 66);
    ctx.fillStyle = "#f97316";
    ctx.font = "900 30px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(`%${avgScore}`, W - 308, 99);
    ctx.fillStyle = traveler.color;
    ctx.font = "700 15px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(traveler.title, W - 195, 92);

    // Haritayı SVG'den görselle çiz
    const svgEl = document.getElementById("turkey-svg-map");
    if (svgEl) {
      const clone = svgEl.cloneNode(true) as SVGSVGElement;
      clone.setAttribute("viewBox", "40 20 1010 445");
      const bgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      bgRect.setAttribute("x", "40");
      bgRect.setAttribute("y", "20");
      bgRect.setAttribute("width", "1010");
      bgRect.setAttribute("height", "445");
      bgRect.setAttribute("fill", "#0d1220");
      clone.insertBefore(bgRect, clone.firstChild);
      const svgData = new XMLSerializer().serializeToString(clone);
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      await new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 70, 130, 1060, 467);
          URL.revokeObjectURL(url);
          resolve();
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
        img.src = url;
      });
    }

    // İstatistik bandı
    ctx.fillStyle = "#111827";
    ctx.fillRect(40, H - 135, W - 80, 95);
    ctx.fillStyle = "#f9fafb";
    ctx.font = "600 15px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(`📍 Ziyaret Edilen: ${stats.activeProvinces} / 81 İl`, 62, H - 105);
    ctx.fillText(`🏙️ Keşfedilen: ${stats.visitedDistricts} İlçe`, 360, H - 105);
    ctx.fillText(`⭐ POI: ${stats.visitedPois} Nokta`, 660, H - 105);

    // Rozetler
    ctx.font = "600 14px 'Plus Jakarta Sans', sans-serif";
    ctx.fillStyle = "#9ca3af";
    ctx.fillText("Rozetler:", 62, H - 62);
    let badgeX = 165;
    ctx.font = "600 17px 'Plus Jakarta Sans', sans-serif";
    unlockedBadges.slice(0, 7).forEach((badgeId) => {
      const badge = BADGES_CATALOG.find((b) => b.id === badgeId);
      if (badge) {
        ctx.fillText(badge.icon, badgeX, H - 60);
        badgeX += 34;
      }
    });
    if (unlockedBadges.length > 7) {
      ctx.fillStyle = "#f97316";
      ctx.font = "700 14px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText(`+${unlockedBadges.length - 7} rozet`, badgeX, H - 60);
    }
    if (unlockedBadges.length === 0) {
      ctx.fillStyle = "#6b7280";
      ctx.font = "500 13px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText("İlk rozetin seni bekliyor — haritadan bir il işaretle! 🥾", 165, H - 60);
    }

    // İmza
    const today = new Date().toLocaleDateString("tr-TR");
    ctx.fillStyle = "#9ca3af";
    ctx.font = "500 12px 'Plus Jakarta Sans', sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`Oluşturuldu: ${today} • Route TR (cyberQbit)`, W - 50, H - 28);
    ctx.textAlign = "left";

    setRendering(false);
    setReady(true);
  }, [travelState]);

  useEffect(() => {
    if (!open) return;
    // Canvas'a çizim için bir frame bekle (modal görünür olduktan sonra)
    const t = setTimeout(() => draw(), 80);
    return () => clearTimeout(t);
  }, [open, draw]);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `Route-TR-Seyahat-Karti-${new Date().toISOString().slice(0, 10)}.png`;
    a.click();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        aria-describedby={undefined}
        className="max-h-[90vh] overflow-y-auto border-[#2e3a52] bg-[#0e1422] text-gray-100 sm:max-w-3xl routetr-scrollbar"
      >
        <DialogHeader>
          <DialogTitle className="text-white">📸 Route TR Seyahat Kartın</DialogTitle>
          <DialogDescription className="text-gray-400">Sosyal medyada paylaşmak için PNG olarak kaydet</DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center rounded-xl border border-[#232f45] bg-[#0b0f19] p-3">
          {rendering && (
            <div className="flex h-64 items-center gap-2 text-sm text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin text-[#f97316]" /> Kartın hazırlanıyor…
            </div>
          )}
          <canvas ref={canvasRef} className={`max-w-full rounded-lg ${rendering ? "hidden" : ""}`} aria-label="Seyahat kartı önizleme" />
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={download}
            disabled={!ready}
            className="inline-flex items-center gap-2 rounded-lg bg-[#f97316] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#ea580c] disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> PNG İndir
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
