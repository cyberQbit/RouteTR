import { NextRequest, NextResponse } from "next/server";

// ==========================================================================
// ROUTE TR — Hava Durumu API (Open-Meteo proxy, API key gerektirmez)
// Lokal bellek cache'i ile tekrarlı istekler engellenir (10 dk TTL)
// WMO kod tablosu src/lib/routetr/weather.ts ile paylaşılır.
// ==========================================================================

import { WMO_CODES } from "@/lib/routetr/weather";

interface CacheEntry {
  data: unknown;
  ts: number;
}

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 dakika
const weatherCache = new Map<string, CacheEntry>();

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
