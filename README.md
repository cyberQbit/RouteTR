# 🗺️ Route TR — Türkiye Seyahat & Keşif Haritası

Türkiye'nin **81 ili** ve **973 ilçesi** için granüler seyahat günlüğü. Gerçek coğrafyalı interaktif SVG harita üzerinde gezdiğin ilçeleri işaretle, keşif skorunu yükselt, 22 rozet aç, hedefler koy ve kartpostalını üret. Tüm veriler **yalnızca tarayıcında** (localStorage) saklanır — hesap gerekmez.

**Canlı demo:** https://cyberqbit.github.io/RouteTR/

## ✨ Özellikler

- 🗺️ **Gerçek Türkiye haritası** — 973 ilçe geometrisi (kaynak: [aakutlu/tr-svg-maps](https://github.com/aakutlu/tr-svg-maps), MIT). Sürükle-pan, tekerlek/pinch zoom, %100 göstergesi, heatmap boyama.
- 📋 **Kaydırılabilir şehir listesi** — 81 il kendi içinde kaydırılan kompakt bir panelde; karta tıkla, not ekle.
- 🧭 **İl/İlçe/POI tabanlı keşif puanı** — durum (Transit / Gezdim / Yaşadım), ilçe ve POI işaretleri.
- 🏅 **22 rozet** — bölge tamamlama, kilometre taşları, Türkiye Fatihi'ne kadar.
- 🎯 **Seyahat hedefleri** — 8 hazır şablon + özel hedefler, canlı ilerleme.
- 📊 **7 bölge seyahat endeksi** — bölgesel ilerleme + puanlama metodolojisi.
- 🌤️ **Canlı hava durumu** — Open-Meteo (anahtar gerektirmez), il modalinde çip.
- 🍽️ **Mutfak güzergâhları** — her ile 3 yöresel yemek önerisi.
- 📮 **Sosyal medya seyahat kartı** — 4 Instagram optimize format: Hikâye/Reels (9:16), Instagram Akış (4:5 — önerilen), Portre 3:4 ve Yatay (16:9). Minimal + markalı tasarım, gerçek haritalı, panoya kopyalanabilir.
- 🧪 **Akıllı öneriler** — en yakın "keşfedilmemiş" iller.
- 🔍 **Türkçe duyarlı arama** — "eskişehir", "Eskişehir", "26" hepsi eşleşir.
- 🎓 **Hoş geldin turu** — 6 adımlı spotlight turu.
- 📱 **Mobil uyumlu + PWA** — manifest (PNG + SVG ikonlar), tam ekran, dokunmatik jestler.
- 💾 **Yedekle / Yükle** — tüm ilerlemen JSON olarak dışa/içe aktarılır (eski RouteTR yedekleriyle uyumlu).
- 🔎 **SEO & bulunabilirlik** — canonical + Open Graph/Twitter kartı (özel `og-image.png`), JSON-LD (WebApplication), `sitemap.xml`, `robots.txt`, PWA manifest metadata.

## 🚀 Yerelde Çalıştırma

Node.js 20+ veya Bun kurulu olmalı.

```bash
npm install        # veya: bun install
npm run dev        # veya: bun run dev
```

Tarayıcıda `http://localhost:3000` adresini aç.

## 📦 GitHub Pages'te Yayınlama (önerilen yol)

1. Bu klasörün tamamını kendi reponuza push edin (örn. `cyberQbit/RouteTR`).
2. Repoda **Settings → Pages → Source** seçeneğini **"GitHub Actions"** yapın (tek seferlik).
3. `.github/workflows/deploy.yml` her push'ta otomatik:
   - bağımlılıkları kurar,
   - `NEXT_PUBLIC_BASE_PATH=/RouteTR` ile statik export üretir (`npm run build:pages`),
   - `out/` klasörünü Pages'e yayınlar.

> Repo adınız farklıysa basePath otomatik olarak repo adına ayarlanır; bir şey yapmanıza gerek yok.

**SEO ipucu:** Repolarınızın **About** kısmına site URL'sini (`https://<kullanıcı>.github.io/<repo>/`) ve **Social preview** görseli olarak `public/og-image.png`'yi ekleyin — hem arama motorları hem sosyal paylaşımlar için bulunabilirliği artırır.

**Manuel alternatif:**

```bash
npm run build:pages   # → out/ klasörü
# out/ içeriğini gh-pages dalına push edin
npx gh-pages -d out   # veya .nojekyll ekleyip el ile
```

## ☁️ Vercel'de Yayınlama

Reponuzu Vercel'e import etmeniz yeterli — ek ayar gerekmez. `/api/weather` proxy'si Vercel'de otomatik çalışır (hava durumu sunucu taraflı cache'lenir).

## 🧱 Proje Yapısı

```
src/
  app/
    page.tsx                  # Tek sayfa uygulama (tüm modüller)
    layout.tsx                # SEO metadata, font, PWA manifest
    api/weather/route.ts      # Open-Meteo proxy (statik yayında devre dışı)
  components/routetr/
    TurkeyMap.tsx             # İnteraktif harita (pan/zoom/heatmap)
    Header.tsx  DashboardBar.tsx  BadgesGrid.tsx
    SuggestionsGrid.tsx  RegionAnalytics.tsx  GoalsSection.tsx
    SearchControls.tsx  ExplorerGrid.tsx  ProvinceModal.tsx
    PostcardModal.tsx  WelcomeTour.tsx
  data/routetr/
    provinces.ts              # 81 il / 973 ilçe / 634 POI verisi
    geo.ts                    # koordinatlar, bölge, mutfak verisi
  lib/routetr/
    store.ts                  # Zustand + localStorage persist
    logic.ts  types.ts  weather.ts
public/
  turkey-map.svg              # Gerçek Türkiye SVG haritası (aakutlu/tr-svg-maps)
  og-image.png                # Sosyal medya paylaşım görseli (1200×630)
  sitemap.xml  robots.txt     # Arama motoru bulunabilirliği
  icon.svg  icon-*.png        # PWA/SEO ikonları
scripts/
  build-pages.mjs             # GitHub Pages statik export build'i
.github/workflows/deploy.yml  # Otomatik Pages yayını
```

## 🔧 Teknolojiler

Next.js 16 (App Router) • TypeScript • Tailwind CSS 4 • shadcn/ui • Zustand • Lucide Icons

## 📜 Lisans

GNU GPL v3.0. Harita geometrisi: [aakutlu/tr-svg-maps](https://github.com/aakutlu/tr-svg-maps) (MIT).
