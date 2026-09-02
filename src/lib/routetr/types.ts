// ==========================================================================
// ROUTE TR — Core Types
// ==========================================================================

export type VisitStatus = "unvisited" | "transit" | "visited" | "lived";

export interface ProvinceState {
  status: VisitStatus;
  visitedDistricts: string[];
  visitedPois: string[];
  customPois: string[];
  notes: string;
}

export type GoalType = "provinces" | "districts" | "pois" | "region" | "custom";

export interface TravelGoal {
  id: string;
  title: string;
  type: GoalType;
  target: number;
  region?: string;
  custom?: boolean;
  createdAt: number;
}

export interface WeatherInfo {
  temperature: number;
  apparent: number;
  weatherCode: number;
  windSpeed: number;
  isDay: boolean;
  description: string;
  icon: string;
}

export interface ProvinceStats {
  visitedProvinces: number;
  transitProvinces: number;
  livedProvinces: number;
  activeProvinces: number;
  totalDistricts: number;
  visitedDistricts: number;
  totalPois: number;
  visitedPois: number;
  averageScore: number;
}

export interface RegionStat {
  region: string;
  provinces: number;
  visitedProvinces: number;
  districts: number;
  visitedDistricts: number;
  pois: number;
  visitedPois: number;
  score: number;
}

export type TravelState = Record<string, ProvinceState>;
