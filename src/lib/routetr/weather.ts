// ==========================================================================
// ROUTE TR — Hava durumu istemcisi (paylaşılan)
// Önce yerel /api/weather proxy'si denenir; erişilemezse (ör. GitHub Pages
// statik yayını) Open-Meteo'ya doğrudan bağlanılır (CORS açıktır).
// ==========================================================================

export interface WeatherInfo {
  ok: true;
  temperature: number;
  apparent: number;
  weatherCode: number;
  windSpeed: number;
  isDay: boolean;
  description: string;
  icon: string;
}

export const WMO_CODES: Record<number, { desc: string; icon: string }> = {
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

const FORECAST_URL =
  "https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lng}" +
  "&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,is_day" +
  "&timezone=Europe%2FIstanbul";

function withTimeout(ms: number): { signal: AbortSignal; done: () => void } {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return { signal: ctrl.signal, done: () => clearTimeout(t) };
}

/** Open-Meteo yanıtını WeatherInfo'ya dönüştürür. */
function mapOpenMeteo(json: unknown): WeatherInfo | null {
  const cur = (json as { current?: Record<string, unknown> })?.current;
  if (!cur) return null;
  const code = typeof cur.weather_code === "number" ? cur.weather_code : 0;
  const wmo = WMO_CODES[code] || { desc: "Bilinmiyor", icon: "🌡️" };
  return {
    ok: true,
    temperature: Math.round(cur.temperature_2m as number),
    apparent: Math.round(cur.apparent_temperature as number),
    weatherCode: code,
    windSpeed: Math.round(cur.wind_speed_10m as number),
    isDay: cur.is_day === 1,
    description: wmo.desc,
    icon: wmo.icon,
  };
}

/**
 * Hava durumunu getirir:
 * 1) Yerel /api/weather (sunucu varsa; bellek cache + timeout içerir)
 * 2) Başarısızsa doğrudan Open-Meteo (GitHub Pages gibi statik yayınlar için)
 * Hava durumu opsiyoneldir: hata olursa null döner, UI çipi gizler.
 */
export async function fetchWeather(lat: number, lng: number): Promise<WeatherInfo | null> {
  // 1) Yerel proxy
  try {
    const { signal, done } = withTimeout(7000);
    try {
      const res = await fetch(`/api/weather?lat=${lat}&lng=${lng}`, { signal });
      done();
      if (res.ok) {
        const j = await res.json();
        if (j?.ok) return j as WeatherInfo;
      }
    } catch {
      done();
    }
  } catch {
    /* yoksay */
  }

  // 2) Doğrudan Open-Meteo (CORS destekli)
  try {
    const { signal, done } = withTimeout(7000);
    try {
      const url = FORECAST_URL.replace("{lat}", String(lat)).replace("{lng}", String(lng));
      const res = await fetch(url, { signal, cache: "no-store" });
      done();
      if (!res.ok) return null;
      return mapOpenMeteo(await res.json());
    } catch {
      done();
      return null;
    }
  } catch {
    return null;
  }
}
