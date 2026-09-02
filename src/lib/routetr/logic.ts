// ==========================================================================
// ROUTE TR — Business Logic (scoring, badges, suggestions, categories)
// ==========================================================================

import { PROVINCES_DATA } from "@/data/routetr/provinces";
import { REGIONS, type RegionName } from "@/data/routetr/geo";
import type { ProvinceState, TravelState, TravelGoal, VisitStatus, ProvinceStats, RegionStat } from "./types";

export const TOTAL_PROVINCES = 81;

// ---------- Turkish-aware normalization for robust search ----------
export function normalizeText(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .toString()
    .trim()
    .replace(/İ/g, "i")
    .replace(/I/g, "i")
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/Ş/g, "s")
    .replace(/ç/g, "c")
    .replace(/Ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/Ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/Ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/Ö/g, "o")
    .toLowerCase();
}

// ---------- Scoring ----------
export function calculateProvinceScore(state: TravelState, plate: string): number {
  const data = state[plate];
  const pMeta = PROVINCES_DATA.find((p) => p.plate === plate);
  if (!data || !pMeta || data.status === "unvisited") return 0;

  const totalDistricts = pMeta.districts.length || 1;
  const visitedDistrictsCount = (data.visitedDistricts || []).length;
  const districtRatio = Math.min(1, visitedDistrictsCount / totalDistricts);

  const allPois = [...pMeta.pois, ...(data.customPois || [])];
  const totalPois = allPois.length || 1;
  const visitedPoisCount = (data.visitedPois || []).length;
  const poiRatio = Math.min(1, visitedPoisCount / totalPois);

  if (data.status === "transit") {
    return Math.min(30, Math.round(15 + districtRatio * 10 + poiRatio * 5));
  }
  if (data.status === "lived") {
    return Math.min(100, Math.round(70 + districtRatio * 15 + poiRatio * 15));
  }
  return Math.min(100, Math.round(30 + districtRatio * 40 + poiRatio * 30));
}

export function getHeatmapColor(status: VisitStatus, percentage: number): string {
  if (status === "unvisited" || percentage === 0) return "#182032";
  if (status === "transit") return "#f59e0b";
  if (status === "lived") return "#2563eb";
  if (percentage <= 35) return "#fb923c";
  if (percentage <= 70) return "#ea580c";
  if (percentage < 100) return "#dc2626";
  return "#9333ea";
}

export function getTravelerTitle(avgPercentage: number): { title: string; color: string } {
  if (avgPercentage === 0) return { title: "Ev Kuşu 🪹", color: "#9ca3af" };
  if (avgPercentage < 10) return { title: "Çaylak Gezgin 🎒", color: "#fb923c" };
  if (avgPercentage < 25) return { title: "Yol Meraklısı 🧭", color: "#f59e0b" };
  if (avgPercentage < 50) return { title: "Karayolu Kaşifi 🚙", color: "#ea580c" };
  if (avgPercentage < 75) return { title: "Anadolu Seyyahı 🦅", color: "#dc2626" };
  if (avgPercentage < 95) return { title: "Usta Rota Kaptanı 👑", color: "#8b5cf6" };
  return { title: "Türkiye Fatihi 🏆", color: "#ec4899" };
}

// ---------- Global stats ----------
export function computeGlobalStats(state: TravelState): ProvinceStats {
  let totalScoreSum = 0;
  let visitedCount = 0;
  let transitCount = 0;
  let livedCount = 0;
  let totalVisitedDistricts = 0;
  let totalVisitedPois = 0;

  PROVINCES_DATA.forEach((p) => {
    const pData = state[p.plate];
    totalScoreSum += calculateProvinceScore(state, p.plate);
    if (pData?.status === "visited") visitedCount++;
    else if (pData?.status === "transit") transitCount++;
    else if (pData?.status === "lived") livedCount++;
    totalVisitedDistricts += (pData?.visitedDistricts || []).length;
    totalVisitedPois += (pData?.visitedPois || []).length;
  });

  const totalDistricts = PROVINCES_DATA.reduce((s, p) => s + p.districts.length, 0);
  const totalPois = PROVINCES_DATA.reduce((s, p) => s + p.pois.length, 0);

  return {
    visitedProvinces: visitedCount,
    transitProvinces: transitCount,
    livedProvinces: livedCount,
    activeProvinces: visitedCount + transitCount + livedCount,
    totalDistricts,
    visitedDistricts: totalVisitedDistricts,
    totalPois,
    visitedPois: totalVisitedPois,
    averageScore: totalScoreSum / TOTAL_PROVINCES,
  };
}

// ---------- Region analytics ----------
export function computeRegionStats(state: TravelState): RegionStat[] {
  return REGIONS.map((region) => {
    const regionProvinces = PROVINCES_DATA.filter((p) => p.region === region);
    let visitedProvinces = 0;
    let visitedDistricts = 0;
    let totalDistricts = 0;
    let visitedPois = 0;
    let totalPois = 0;
    let scoreSum = 0;

    regionProvinces.forEach((p) => {
      const pData = state[p.plate];
      totalDistricts += p.districts.length;
      totalPois += p.pois.length;
      visitedDistricts += (pData?.visitedDistricts || []).length;
      visitedPois += (pData?.visitedPois || []).length;
      if (pData?.status && pData.status !== "unvisited") visitedProvinces++;
      scoreSum += calculateProvinceScore(state, p.plate);
    });

    return {
      region,
      provinces: regionProvinces.length,
      visitedProvinces,
      districts: totalDistricts,
      visitedDistricts,
      pois: totalPois,
      visitedPois,
      score: Math.round(scoreSum / regionProvinces.length),
    };
  });
}

// ---------- Badge catalog (22 rozet — README sözü) ----------
export interface Badge {
  id: string;
  name: string;
  desc: string;
  icon: string;
  check: (state: TravelState) => boolean;
  progress?: (state: TravelState) => number;
}

const BORDER_PLATES = ["22", "39", "34", "08", "75", "76", "04", "65", "30", "73", "47", "63", "79", "31"];

function countVisitedProvinces(state: TravelState): number {
  return PROVINCES_DATA.filter((p) => state[p.plate]?.status && state[p.plate].status !== "unvisited").length;
}
function countVisitedDistricts(state: TravelState): number {
  return PROVINCES_DATA.reduce((sum, p) => sum + (state[p.plate]?.visitedDistricts?.length || 0), 0);
}
function countVisitedPois(state: TravelState): number {
  return PROVINCES_DATA.reduce((sum, p) => sum + (state[p.plate]?.visitedPois?.length || 0), 0);
}
function countProvincesByStatus(state: TravelState, status: VisitStatus): number {
  return PROVINCES_DATA.filter((p) => state[p.plate]?.status === status).length;
}
function isRegionComplete(state: TravelState, region: string): boolean {
  const regionProvinces = PROVINCES_DATA.filter((p) => p.region === region);
  if (regionProvinces.length === 0) return false;
  return regionProvinces.every((p) => calculateProvinceScore(state, p.plate) >= 50);
}

export const BADGES_CATALOG: Badge[] = [
  // Kilometre Taşları
  { id: "first_five", name: "İlk Adım", desc: "5 ili ziyaret et", icon: "🥾", check: (s) => countVisitedProvinces(s) >= 5, progress: (s) => Math.min(100, (countVisitedProvinces(s) / 5) * 100) },
  { id: "ten_provinces", name: "On İl Macerası", desc: "10 ili ziyaret et", icon: "🎒", check: (s) => countVisitedProvinces(s) >= 10, progress: (s) => Math.min(100, (countVisitedProvinces(s) / 10) * 100) },
  { id: "twentyfive_provinces", name: "Çeyrek Yol", desc: "25 ili ziyaret et", icon: "🧭", check: (s) => countVisitedProvinces(s) >= 25, progress: (s) => Math.min(100, (countVisitedProvinces(s) / 25) * 100) },
  { id: "fifty_provinces", name: "Yarı Yol", desc: "50 ili ziyaret et", icon: "🚙", check: (s) => countVisitedProvinces(s) >= 50, progress: (s) => Math.min(100, (countVisitedProvinces(s) / 50) * 100) },
  { id: "all_provinces", name: "Türkiye Fatihi", desc: "Tüm 81 ili ziyaret et", icon: "🏆", check: (s) => countVisitedProvinces(s) === 81, progress: (s) => Math.min(100, (countVisitedProvinces(s) / 81) * 100) },
  // Bölgesel
  { id: "marmara_master", name: "Marmara Ustası", desc: "Marmara bölgesini tamamla", icon: "🌊", check: (s) => isRegionComplete(s, "Marmara") },
  { id: "aegean_spirit", name: "Ege Ruhu", desc: "Ege bölgesini tamamla", icon: "☀️", check: (s) => isRegionComplete(s, "Ege") },
  { id: "mediterranean_traveler", name: "Akdeniz Seyyahı", desc: "Akdeniz bölgesini tamamla", icon: "🏖️", check: (s) => isRegionComplete(s, "Akdeniz") },
  { id: "anatolian_master", name: "Anadolu Ustası", desc: "İç Anadolu bölgesini tamamla", icon: "🗻", check: (s) => isRegionComplete(s, "İç Anadolu") },
  { id: "blacksea_devotee", name: "Karadeniz Sevdalısı", desc: "Karadeniz bölgesini tamamla", icon: "⚓", check: (s) => isRegionComplete(s, "Karadeniz") },
  { id: "eastern_pioneer", name: "Doğu Öncüsü", desc: "Doğu Anadolu bölgesini tamamla", icon: "🏔️", check: (s) => isRegionComplete(s, "Doğu Anadolu") },
  { id: "southeastern_scout", name: "Güneydoğu Kâşifi", desc: "Güneydoğu Anadolu bölgesini tamamla", icon: "🔥", check: (s) => isRegionComplete(s, "Güneydoğu Anadolu") },
  { id: "seven_regions", name: "7 Bölge Fatihi", desc: "7 bölgenin hepsini tamamla", icon: "🌈", check: (s) => REGIONS.every((r) => isRegionComplete(s, r)), progress: (s) => (REGIONS.filter((r) => isRegionComplete(s, r)).length / 7) * 100 },
  { id: "border_hunter", name: "Sınır Boyu Avcısı", desc: "14 sınır ilini keşfet", icon: "🛡️", check: (s) => BORDER_PLATES.every((pl) => s[pl]?.status && s[pl].status !== "unvisited"), progress: (s) => (BORDER_PLATES.filter((pl) => s[pl]?.status && s[pl].status !== "unvisited").length / BORDER_PLATES.length) * 100 },
  { id: "big_three", name: "Büyük Üçlü", desc: "İstanbul, Ankara ve İzmir'i gez", icon: "🥇", check: (s) => ["34", "06", "35"].every((pl) => s[pl]?.status && s[pl].status !== "unvisited") },
  // İlçe & POI
  { id: "hundred_districts", name: "Yüz İlçe", desc: "100 ilçeyi keşfet", icon: "🏘️", check: (s) => countVisitedDistricts(s) >= 100, progress: (s) => Math.min(100, (countVisitedDistricts(s) / 100) * 100) },
  { id: "district_explorer", name: "İlçe Kâşifi", desc: "250 ilçeyi keşfet", icon: "🗺️", check: (s) => countVisitedDistricts(s) >= 250, progress: (s) => Math.min(100, (countVisitedDistricts(s) / 250) * 100) },
  { id: "half_districts", name: "Yarı Yolda", desc: "500 ilçeyi keşfet", icon: "🛣️", check: (s) => countVisitedDistricts(s) >= 500, progress: (s) => Math.min(100, (countVisitedDistricts(s) / 500) * 100) },
  { id: "poi_collector", name: "POI Koleksiyoncusu", desc: "50 nokta (POI) topla", icon: "📍", check: (s) => countVisitedPois(s) >= 50, progress: (s) => Math.min(100, (countVisitedPois(s) / 50) * 100) },
  { id: "poi_master", name: "Nokta Avcısı", desc: "150 nokta (POI) topla", icon: "🔭", check: (s) => countVisitedPois(s) >= 150, progress: (s) => Math.min(100, (countVisitedPois(s) / 150) * 100) },
  // Deneyim
  { id: "lifer", name: "Yaşayan Gezgin", desc: "5 yerde yaşadığın yeri işaretle", icon: "🏡", check: (s) => countProvincesByStatus(s, "lived") >= 5, progress: (s) => Math.min(100, (countProvincesByStatus(s, "lived") / 5) * 100) },
  { id: "transit_master", name: "Transit Profesörü", desc: "15 transit mola noktası işaretle", icon: "🚗", check: (s) => countProvincesByStatus(s, "transit") >= 15, progress: (s) => Math.min(100, (countProvincesByStatus(s, "transit") / 15) * 100) },
];

export function getUnlockedBadges(state: TravelState): string[] {
  return BADGES_CATALOG.filter((b) => b.check(state)).map((b) => b.id);
}

// ---------- Smart suggestions ----------
const REGION_ADJACENCY: Record<string, string[]> = {
  Marmara: ["Ege", "İç Anadolu"],
  Ege: ["Marmara", "Akdeniz", "İç Anadolu"],
  Akdeniz: ["Ege", "İç Anadolu", "Doğu Anadolu"],
  "İç Anadolu": ["Marmara", "Ege", "Akdeniz", "Karadeniz", "Doğu Anadolu"],
  Karadeniz: ["Marmara", "İç Anadolu", "Doğu Anadolu"],
  "Doğu Anadolu": ["İç Anadolu", "Karadeniz", "Güneydoğu Anadolu"],
  "Güneydoğu Anadolu": ["Akdeniz", "Doğu Anadolu"],
};

export function isAdjacentRegion(region1: string, region2: string): boolean {
  return (REGION_ADJACENCY[region1] || []).includes(region2);
}

export interface Suggestion {
  plate: string;
  name: string;
  region: string;
  reason: string;
}

export function getSmartSuggestions(state: TravelState): Suggestion[] {
  const visited = new Set<string>();
  const unvisited: typeof PROVINCES_DATA = [];

  PROVINCES_DATA.forEach((p) => {
    if (state[p.plate]?.status && state[p.plate].status !== "unvisited") visited.add(p.plate);
    else unvisited.push(p);
  });

  const suggestions: Suggestion[] = [];
  const suggestedPlates = new Set<string>();

  // Önce komşu bölge yakınlığıyla en "mantıklı" 3 hedefi bul
  PROVINCES_DATA.filter((p) => visited.has(p.plate)).forEach((visitedProvince) => {
    unvisited.forEach((unvisitedProvince) => {
      if (!suggestedPlates.has(unvisitedProvince.plate) && (unvisitedProvince.region === visitedProvince.region || isAdjacentRegion(visitedProvince.region, unvisitedProvince.region))) {
        suggestions.push({
          plate: unvisitedProvince.plate,
          name: unvisitedProvince.name,
          region: unvisitedProvince.region,
          reason: `${visitedProvince.name}'nin yanında`,
        });
        suggestedPlates.add(unvisitedProvince.plate);
      }
    });
  });

  // Eğer hiç ziyaret yoksa popüler başlangıçlar
  if (suggestions.length === 0) {
    ["34", "06", "35", "16", "07"].forEach((plate) => {
      const p = PROVINCES_DATA.find((pr) => pr.plate === plate);
      if (p) suggestions.push({ plate: p.plate, name: p.name, region: p.region, reason: "Popüler başlangıç noktası" });
    });
  }

  return suggestions.slice(0, 3);
}

// ---------- POI Kategori Sistemi (12 kategori) ----------
export interface PoiCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  keywords: string[];
}

export const POI_CATEGORIES: PoiCategory[] = [
  { id: "antik", name: "Antik Kent", icon: "🏛️", color: "#f59e0b", keywords: ["antik", "harabe", "mozaik", "efes", "perge", "aspendos", "side", "hierapolis", "aphrodisias", "anavarza", "göbeklitepe", "kusura", "troya", "truva", "hattuşa", "arslantepe", "zeugma", "laodikeia", "knidos", "didim", "apollon"] },
  { id: "dini", name: "Dini Yapı", icon: "🕌", color: "#10b981", keywords: ["cami", "kilise", "manastır", "türbe", "sinagog", "mescit", "ayasofya", "medrese", "tekke", "ayan", "yunus emre"] },
  { id: "kale", name: "Kale & Surlar", icon: "🏰", color: "#ef4444", keywords: ["kale", "hisar", "surlar", "burç", "kule", "surları", "kalesi"] },
  { id: "doga", name: "Doğa Harikası", icon: "🌿", color: "#22c55e", keywords: ["kanyon", "şelale", "mağara", "vadisi", "vadi", "yayla", "gölü", "göl", "delta", "tabiat", "orman", "milli park", "deltası", "pamukkale", "cennet", "cehennem", "sahil milli park", "göl", "sulak"] },
  { id: "dag", name: "Dağ & Zirve", icon: "🏔️", color: "#8b5cf6", keywords: ["dağı", "dağ", "zirve", "erciyes", "ağrı", "uludağ", "kaçkar", "nemrut", "süphan"] },
  { id: "deniz", name: "Deniz & Plaj", icon: "🏖️", color: "#06b6d4", keywords: ["plaj", "koy", "lagün", "ada", "kumsal", "burun", "liman", "marina", "kaputaş", "patara", "çınar", "deniz"] },
  { id: "muze", name: "Müze", icon: "🎨", color: "#ec4899", keywords: ["müze", "müzesi", "galeri", "sanat merkezi"] },
  { id: "kaplica", name: "Kaplıca & Termal", icon: "♨️", color: "#f97316", keywords: ["kaplıca", "ılıcası", "ılıca", "termal", "şifalı su"] },
  { id: "park", name: "Park & Bahçe", icon: "🌳", color: "#84cc16", keywords: ["park", "bahçe", "botanik", "hayvanat", "meydan park"] },
  { id: "mimari", name: "Köprü & Mimari", icon: "🌉", color: "#0ea5e9", keywords: ["köprü", "kervansaray", "bedesten", "çarşı", "hanı", "saat kulesi", "saray", "konak", "evleri", "akanthus", "zap süyü", "kasrı", "kışlası"] },
  { id: "tarihi", name: "Tarihi Yer", icon: "📜", color: "#d97706", keywords: ["anıt", "heykel", "savaş", "kurtuluş", "cumhuriyet", "tarih", "harabeleri", "höyük", "stadyum antik", "tiyatro", "agora", "kemer", "abide"] },
];

export const POI_FALLBACK_CATEGORY: PoiCategory = { id: "diger", name: "Diğer", icon: "📍", color: "#9ca3af", keywords: [] };

export function getPoiCategory(poiName: string): PoiCategory {
  const norm = normalizeText(poiName);
  for (const cat of POI_CATEGORIES) {
    if (cat.keywords.some((kw) => norm.includes(normalizeText(kw)))) return cat;
  }
  return POI_FALLBACK_CATEGORY;
}

// ---------- Hedef (Bucket List) ilerleme ----------
export function getGoalProgress(state: TravelState, goal: TravelGoal): { current: number; percent: number } {
  let current = 0;
  const stats = computeGlobalStats(state);
  switch (goal.type) {
    case "provinces":
      current = stats.activeProvinces;
      break;
    case "districts":
      current = stats.visitedDistricts;
      break;
    case "pois":
      current = stats.visitedPois;
      break;
    case "region": {
      const rs = computeRegionStats(state).find((r) => r.region === goal.region);
      current = rs ? Math.round((rs.visitedDistricts / rs.districts) * 100) : 0;
      break;
    }
    default:
      current = 0;
  }
  const percent = Math.min(100, Math.round((current / goal.target) * 100));
  return { current, percent };
}

export interface GoalTemplate {
  id: string;
  title: string;
  type: GoalType;
  target: number;
  region?: string;
}

export const GOAL_TEMPLATES: GoalTemplate[] = [
  { id: "gt_five_provinces", title: "Bu yıl 5 yeni il gez", type: "provinces", target: 5 },
  { id: "gt_ten_provinces", title: "10 ile ulaş", type: "provinces", target: 10 },
  { id: "gt_hundred_districts", title: "100 ilçe sınırını aş", type: "districts", target: 100 },
  { id: "gt_fifty_pois", title: "50 POI topla", type: "pois", target: 50 },
  { id: "gt_marmara", title: "Marmara bölgesini bitir", type: "region", target: 100, region: "Marmara" },
  { id: "gt_ege", title: "Ege bölgesini bitir", type: "region", target: 100, region: "Ege" },
  { id: "gt_akdeniz", title: "Akdeniz bölgesini bitir", type: "region", target: 100, region: "Akdeniz" },
  { id: "gt_karadeniz", title: "Karadeniz bölgesini bitir", type: "region", target: 100, region: "Karadeniz" },
];

// ---------- Google Maps helpers ----------
export function provinceDirectionsUrl(name: string, lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=&travelmode=driving&dir_action=navigate`;
}

export function poiSearchUrl(poiName: string, provinceName: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${poiName}, ${provinceName}`)}`;
}

export function provinceViewUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

// ---------- Filtreleme ----------
export interface FilterOptions {
  searchQuery: string;
  region: string;
  status: string;
}

export function checkProvinceMatch(state: TravelState, p: (typeof PROVINCES_DATA)[number], opts: FilterOptions): boolean {
  const pData = state[p.plate];
  const normQuery = normalizeText(opts.searchQuery);

  let matchesSearch = true;
  if (normQuery) {
    const matchName = normalizeText(p.name).includes(normQuery);
    const matchPlate = p.plate.includes(normQuery);
    const matchDistrict = (p.districts || []).some((d) => normalizeText(d).includes(normQuery));
    const matchPoi = (p.pois || []).some((poi) => normalizeText(poi).includes(normQuery));
    const matchCustom = (pData?.customPois || []).some((c) => normalizeText(c).includes(normQuery));
    matchesSearch = matchName || matchPlate || matchDistrict || matchPoi || matchCustom;
  }

  const matchesRegion = opts.region === "all" || p.region === opts.region;

  let matchesStatus = true;
  if (opts.status === "visited") matchesStatus = pData?.status === "visited";
  else if (opts.status === "transit") matchesStatus = pData?.status === "transit";
  else if (opts.status === "lived") matchesStatus = pData?.status === "lived";
  else if (opts.status === "unvisited") matchesStatus = pData?.status === "unvisited";

  return matchesSearch && matchesRegion && matchesStatus;
}

export function createEmptyProvinceState(): ProvinceState {
  return { status: "unvisited", visitedDistricts: [], visitedPois: [], customPois: [], notes: "" };
}
