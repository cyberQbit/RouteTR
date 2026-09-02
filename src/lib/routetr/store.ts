"use client";

// ==========================================================================
// ROUTE TR — Global State (Zustand + localStorage persist)
// ==========================================================================

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { PROVINCES_DATA } from "@/data/routetr/provinces";
import { createEmptyProvinceState } from "./logic";
import type { TravelState, TravelGoal, VisitStatus } from "./types";

interface RouteTRStore {
  travelState: TravelState;
  goals: TravelGoal[];
  tourDone: boolean;

  ensureInit: () => void;
  setStatus: (plate: string, status: VisitStatus) => void;
  toggleDistrict: (plate: string, district: string) => void;
  togglePoi: (plate: string, poi: string) => void;
  addCustomPoi: (plate: string, poi: string) => void;
  removeCustomPoi: (plate: string, poi: string) => void;
  selectAllDistricts: (plate: string) => void;
  clearDistricts: (plate: string) => void;
  setNotes: (plate: string, notes: string) => void;

  addGoal: (goal: Omit<TravelGoal, "id" | "createdAt">) => void;
  removeGoal: (id: string) => void;

  setTourDone: (done?: boolean) => void;

  importState: (state: TravelState, goals?: TravelGoal[]) => void;
  resetAll: () => void;
}

function ensurePlate(state: TravelState, plate: string) {
  if (!state[plate]) state[plate] = createEmptyProvinceState();
  return state[plate];
}

export const useRouteTR = create<RouteTRStore>()(
  persist(
    (set, get) => ({
      travelState: {},
      goals: [],
      tourDone: false,

      ensureInit: () => {
        const current = get().travelState;
        let changed = false;
        const next: TravelState = { ...current };
        PROVINCES_DATA.forEach((p) => {
          if (!next[p.plate]) {
            next[p.plate] = createEmptyProvinceState();
            changed = true;
          }
        });
        if (changed) set({ travelState: next });
      },

      setStatus: (plate, status) =>
        set((s) => {
          const st = { ...s.travelState };
          const data = { ...ensurePlate(st, plate) };
          data.status = status;
          st[plate] = data;
          return { travelState: st };
        }),

      toggleDistrict: (plate, district) =>
        set((s) => {
          const st = { ...s.travelState };
          const data = { ...ensurePlate(st, plate) };
          const list = data.visitedDistricts.includes(district)
            ? data.visitedDistricts.filter((d) => d !== district)
            : [...data.visitedDistricts, district];
          data.visitedDistricts = list;
          if (list.length > 0 && data.status === "unvisited") data.status = "visited";
          st[plate] = data;
          return { travelState: st };
        }),

      togglePoi: (plate, poi) =>
        set((s) => {
          const st = { ...s.travelState };
          const data = { ...ensurePlate(st, plate) };
          const list = data.visitedPois.includes(poi)
            ? data.visitedPois.filter((d) => d !== poi)
            : [...data.visitedPois, poi];
          data.visitedPois = list;
          if (list.length > 0 && data.status === "unvisited") data.status = "visited";
          st[plate] = data;
          return { travelState: st };
        }),

      addCustomPoi: (plate, poi) =>
        set((s) => {
          const st = { ...s.travelState };
          const data = { ...ensurePlate(st, plate) };
          data.customPois = [...data.customPois, poi];
          data.visitedPois = [...data.visitedPois, poi];
          if (data.status === "unvisited") data.status = "visited";
          st[plate] = data;
          return { travelState: st };
        }),

      removeCustomPoi: (plate, poi) =>
        set((s) => {
          const st = { ...s.travelState };
          const data = { ...ensurePlate(st, plate) };
          data.customPois = data.customPois.filter((c) => c !== poi);
          data.visitedPois = data.visitedPois.filter((c) => c !== poi);
          st[plate] = data;
          return { travelState: st };
        }),

      selectAllDistricts: (plate) =>
        set((s) => {
          const meta = PROVINCES_DATA.find((p) => p.plate === plate);
          if (!meta) return {};
          const st = { ...s.travelState };
          const data = { ...ensurePlate(st, plate) };
          data.visitedDistricts = [...meta.districts];
          if (data.status === "unvisited") data.status = "visited";
          st[plate] = data;
          return { travelState: st };
        }),

      clearDistricts: (plate) =>
        set((s) => {
          const st = { ...s.travelState };
          const data = { ...ensurePlate(st, plate) };
          data.visitedDistricts = [];
          st[plate] = data;
          return { travelState: st };
        }),

      setNotes: (plate, notes) =>
        set((s) => {
          const st = { ...s.travelState };
          const data = { ...ensurePlate(st, plate) };
          data.notes = notes;
          st[plate] = data;
          return { travelState: st };
        }),

      addGoal: (goal) =>
        set((s) => ({
          goals: [...s.goals, { ...goal, id: `g_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, createdAt: Date.now() }],
        })),

      removeGoal: (id) => set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),

      setTourDone: (done?: boolean) => set({ tourDone: done ?? true }),

      importState: (state, goals) => set((s) => ({ travelState: state, goals: goals ?? s.goals })),

      resetAll: () =>
        set(() => {
          const fresh: TravelState = {};
          PROVINCES_DATA.forEach((p) => {
            fresh[p.plate] = createEmptyProvinceState();
          });
          return { travelState: fresh };
        }),
    }),
    {
      name: "route_tr_travel_log_v2",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ travelState: s.travelState, goals: s.goals, tourDone: s.tourDone }),
    }
  )
);
