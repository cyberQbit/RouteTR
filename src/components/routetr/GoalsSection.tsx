"use client";

// ==========================================================================
// ROUTE TR — 🎯 Seyahat Hedefleri (Bucket List)
// README'de vaat edilmişti; eski sürümde yalnızca storage key vardı, UI yoktu.
// Şablon hedefler + özel hedef + canlı ilerleme yüzdesi.
// ==========================================================================

import { useState } from "react";
import { Plus, Trash2, Target } from "lucide-react";
import { useRouteTR } from "@/lib/routetr/store";
import { GOAL_TEMPLATES, getGoalProgress } from "@/lib/routetr/logic";
import type { TravelGoal } from "@/lib/routetr/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

function GoalCard({ goal, onRemove }: { goal: TravelGoal; onRemove: (id: string) => void }) {
  const travelState = useRouteTR((s) => s.travelState);
  const { current, percent } = getGoalProgress(travelState, goal);
  const done = percent >= 100;

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border p-3 transition ${
        done ? "border-emerald-500/50 bg-emerald-500/5" : "border-[#232f45] bg-[#0e1422]"
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg ${
          done ? "bg-emerald-500/20 text-emerald-400" : "bg-[#1a2236] text-[#f97316]"
        }`}
        aria-hidden
      >
        {done ? "✅" : "🎯"}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className={`truncate text-sm font-semibold ${done ? "text-emerald-300" : "text-gray-200"}`}>
            {goal.title}
          </span>
          <span className={`shrink-0 text-xs font-bold ${done ? "text-emerald-400" : "text-[#fdba74]"}`}>
            {goal.type === "region" ? `%${percent}` : `${current}/${goal.target}`}
          </span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#1a2236]">
          <div
            className={`h-full rounded-full transition-all duration-500 ${done ? "bg-emerald-500" : "bg-[#f97316]"}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
      <button
        type="button"
        onClick={() => onRemove(goal.id)}
        aria-label={`${goal.title} hedefini kaldır`}
        className="shrink-0 rounded-md p-1.5 text-gray-600 transition hover:bg-red-500/10 hover:text-red-400"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function GoalsSection() {
  const goals = useRouteTR((s) => s.goals);
  const addGoal = useRouteTR((s) => s.addGoal);
  const removeGoal = useRouteTR((s) => s.removeGoal);
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customTarget, setCustomTarget] = useState("");

  const templateIds = new Set(goals.map((g) => g.id));
  const availableTemplates = GOAL_TEMPLATES.filter((t) => !templateIds.has(t.id));

  const addTemplate = (t: (typeof GOAL_TEMPLATES)[number]) => {
    addGoal({ title: t.title, type: t.type, target: t.target, region: t.region });
    toast({ title: "Hedef eklendi 🎯", description: t.title });
  };

  const addCustom = () => {
    const target = parseInt(customTarget, 10);
    if (!customTitle.trim() || isNaN(target) || target <= 0) {
      toast({ title: "Eksik bilgi", description: "Başlık ve geçerli bir hedef sayısı gir.", variant: "destructive" });
      return;
    }
    // Başlıktan tip tahmini
    const t = customTitle.toLowerCase();
    const type = t.includes("ilçe") ? "districts" : t.includes("poi") || t.includes("nokta") ? "pois" : "custom";
    addGoal({ title: customTitle.trim(), type: type as "custom" | "districts" | "pois", target, custom: true });
    setCustomTitle("");
    setCustomTarget("");
    toast({ title: "Özel hedef eklendi 🎯", description: customTitle.trim() });
  };

  return (
    <section aria-label="Seyahat hedefleri" data-tour="goals">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-white">🎯 Seyahat Hedefleri (Bucket List)</h2>
          <p className="text-xs text-gray-400">Kişisel hedefler oluştur, ilerlemen canlı hesaplanır</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-[#f97316] text-white hover:bg-[#ea580c]">
              <Plus className="mr-1 h-4 w-4" /> Hedef Ekle
            </Button>
          </DialogTrigger>
          <DialogContent className="border-[#2e3a52] bg-[#0e1422] text-gray-100 sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-white">
                <Target className="h-5 w-5 text-[#f97316]" /> Yeni Seyahat Hedefi
              </DialogTitle>
              <DialogDescription className="text-gray-400">Hazır şablonlardan seç veya kendi hedefini yaz.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Hazır Şablonlar</div>
                <div className="flex flex-col gap-1.5">
                  {availableTemplates.length === 0 && <div className="text-xs text-gray-500">Tüm şablonlar eklenmiş 🎉</div>}
                  {availableTemplates.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => addTemplate(t)}
                      className="rounded-lg border border-[#232f45] bg-[#141b2e] px-3 py-2 text-left text-sm text-gray-200 transition hover:border-[#f97316]/60 hover:bg-[#1a2338]"
                    >
                      <span className="mr-1.5 text-[#f97316]">＋</span>
                      {t.title}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Özel Hedef</div>
                <div className="flex gap-2">
                  <Input
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="Hedef başlığı (örn: Kışın karlı illeri gez)"
                    className="border-[#2e3a52] bg-[#0b0f19] text-gray-100 placeholder:text-gray-600 focus-visible:ring-[#f97316]"
                  />
                  <Input
                    value={customTarget}
                    onChange={(e) => setCustomTarget(e.target.value.replace(/\D/g, ""))}
                    placeholder="Adet"
                    inputMode="numeric"
                    className="w-24 shrink-0 border-[#2e3a52] bg-[#0b0f19] text-gray-100 placeholder:text-gray-600 focus-visible:ring-[#f97316]"
                  />
                </div>
                <Button onClick={addCustom} className="mt-2 w-full bg-[#f97316] text-white hover:bg-[#ea580c]">
                  Özel Hedefi Kaydet
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {goals.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#2e3a52] bg-[#10172a] p-6 text-center text-sm text-gray-500">
          Henüz hedefin yok. <span className="text-[#fdba74]">Hedef Ekle</span> ile başla — örn. &quot;Bu yıl 5 yeni il gez&quot; 🚀
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
          {goals.map((g) => (
            <GoalCard key={g.id} goal={g} onRemove={removeGoal} />
          ))}
        </div>
      )}
    </section>
  );
}
