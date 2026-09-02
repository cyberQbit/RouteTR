import { NextRequest, NextResponse } from "next/server";

// ==========================================================================
// ROUTE TR — Hava Durumu API (Open-Meteo proxy, API key gerektirmez)
// Lokal bellek cache'i ile tekrarlı istekler engellenir (10 dk TTL)
// ==========================================================================

interface CacheEntry {
  data: unknown;
  ts: number;
}

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 dakika
const weatherCache = new Map<string, CacheEntry>();

const WMO_CODES: Record<number, { desc: string; icon: string }> = {
  0: { desc: "Açık", icon: "☀️" },
  1: { desc: "Az Bulutlu", icon: "🌤️" },
  2: { desc: "Parçalı Bulutlu", icon: "⛅" },
  3: { desc: "Kapalı", icon: "☁️" },
  45: { desc: "Puslu", icon: "🌫️" },
  48: { desc: "Kırağılı Pus", icon: "🌫️" },
  51: { desc: "Hafif Çisenti", icon: "🌦️" },
  53: { desc: "Çisenti", icon: "🌦️" },
  55: { desc: "Yoğun Çisenti", icon: "🌧️" },
  56: { desc: "Dondurucu Çisenti", icon: "🌨️" },
  57: { desc: "Yoğun Dondurucu Çisenti", icon: "🌨️" },
  61: { desc: "Hafif Yağmur", icon: "🌦️" },
  63: { desc: "Yağmurlu", icon: "🌧️" },
  65: { desc: "Şiddetli Yağmur", icon: "🌧️" },
  66: { desc: "Dondurucu Yağmur", icon: "🌨️" },
  67: { desc: "Şiddetli Dondurucu Yağmur", icon: "🌨️" },
  71: { desc: "Hafif Kar", icon: "🌨️" },
  73: { desc: "Kar Yağışlı", icon: "❄️" },
  75: { desc: "Yoğun Kar", icon: "❄️" },
  77: { desc: "Kar Taneleri", icon: "🌨️" },
  80: { desc: "Hafif Sağanak", icon: "🌦️" },
  81: { desc: "Sağanak", icon: "🌧️" },
  82: { desc: "Şiddetli Sağanak", icon: "⛈️" },
  85: { desc: "Kar Saınağı", icon: "🌨️" },
  86: { desc: "Yoğun Kar Saınağı", icon: "❄️" },
  95: { desc: "Gök Gürültülü", icon: "⛈️" },
  96: { desc: "Dolulu Fırtına", icon: "⛈️" },
  99: { desc: "Şiddetli Dolu Fırtınası", icon: "⛈️" },
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") || "");
  const lng = parseFloat(searchParams.get("lng") || "");

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ ok: false, error: "Geçersiz koordinat" }, { status: 400 });
  }

  const cacheKey = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return NextResponse.json({ ok: true, ...(cached.data as Record<string, unknown>), cached: true });
  }

  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,is_day` +
      `&timezone=Europe%2FIstanbul`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);
    const res = await fetch(url, { signal: controller.signal, cache: "no-store" });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
    const json = await res.json();
    const cur = json?.current;
    if (!cur) throw new Error("Bozuk yanıt");

    const code = typeof cur.weather_code === "number" ? cur.weather_code : 0;
    const wmo = WMO_CODES[code] || { desc: "Bilinmiyor", icon: "🌡️" };

    const payload = {
      ok: true,
      temperature: Math.round(cur.temperature_2m),
      apparent: Math.round(cur.apparent_temperature),
      weatherCode: code,
      windSpeed: Math.round(cur.wind_speed_10m),
      isDay: cur.is_day === 1,
      description: wmo.desc,
      icon: wmo.icon,
    };

    weatherCache.set(cacheKey, { data: payload, ts: Date.now() });
    return NextResponse.json(payload);
  } catch {
    // Graceful fallback: hava durumu opsiyoneldir, UI bunu gizler
    return NextResponse.json(
      { ok: false, error: "Hava durumu şu anda alınamıyor" },
      { status: 200 }
    );
  }
}
