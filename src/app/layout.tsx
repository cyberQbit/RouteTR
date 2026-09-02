import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
});

// ---------------------------------------------------------------------------
// SEO temel adresi: canonical / OG / sitemap bunlardan türetilir.
// ÖNEMLİ: Next.js, metadataBase ile AYNI ORİJİNLİ absolute/relative URL'lere
// basePath'i (ör. /RouteTR) KENDİSİ ekler. Bu yüzden SITE_ORIGIN yalnızca
// orijindür; canonical ve OG değerleri kök-relatiftir ("/", "/og-image.png").
// - GitHub Pages (varsayılan): https://cyberqbit.github.io + basePath /RouteTR
// - Başka alan adına taşınırsa NEXT_PUBLIC_SITE_URL (sadece orijin) ile ezilir.
// ---------------------------------------------------------------------------
const SITE_ORIGIN = (process.env.NEXT_PUBLIC_SITE_URL || "https://cyberqbit.github.io").replace(/\/$/, "");
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
const SITE_URL = `${SITE_ORIGIN}${BASE_PATH}/`;

const SITE_TITLE = "RouteTR — Türkiye İnteraktif Seyahat Haritası | 81 İl • 973 İlçe Keşif Günlüğü";
const SITE_DESCRIPTION =
  "Türkiye'yi il il, ilçe ilçe keşfet: 81 il, 973 ilçe ve 600+ gezi noktasını interaktif haritada işaretle, keşif skorunu yükselt, rozet kazan, hedef koy ve seyahat kartını sosyal medyada paylaş. Ücretsiz Türkçe seyahat günlüğü.";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "RouteTR",
  alternateName: "Route TR",
  url: SITE_URL,
  applicationCategory: "TravelApplication",
  operatingSystem: "Any (Web tarayıcı)",
  browserRequirements: "JavaScript gerektirir",
  inLanguage: "tr-TR",
  description: SITE_DESCRIPTION,
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "TRY" },
  author: { "@type": "Person", name: "Aydın Aydemir", url: "https://github.com/cyberQbit" },
  featureList: [
    "İnteraktif Türkiye haritası (973 gerçek ilçe)",
    "İl ve ilçe keşif takibi + keşif skoru",
    "22 başarım rozeti",
    "Seyahat hedefleri",
    "7 bölge analizi",
    "Hava durumu",
    "Paylaşılabilir seyahat kartı (PNG)",
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  applicationName: "RouteTR",
  authors: [{ name: "Aydın Aydemir (@cyberQbit)", url: "https://github.com/cyberQbit" }],
  creator: "Aydın Aydemir (@cyberQbit)",
  publisher: "RouteTR",
  category: "travel",
  keywords: [
    "Türkiye haritası",
    "interaktif Türkiye haritası",
    "seyahat günlüğü",
    "Türkiye seyahat uygulaması",
    "il ilçe haritası",
    "il keşfi",
    "973 ilçe",
    "rota planlayıcı",
    "seyahat takibi",
    "gezdiğim iller",
    "Türkiye gezilecek yerler",
    "keşif haritası",
    "seyahat rozetleri",
    "RouteTR",
  ],
  alternates: {
    canonical: SITE_URL,
  },
  manifest: "manifest.webmanifest",
  icons: {
    icon: [{ url: "icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: "RouteTR",
    type: "website",
    locale: "tr_TR",
    images: [
      {
        url: `${BASE_PATH}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "RouteTR — Türkiye İnteraktif Keşif Haritası: 81 il, 973 ilçe, 600+ nokta",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [`${BASE_PATH}/og-image.png`],
    creator: "@cyberQbit",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "RouteTR",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0f19",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={`${jakarta.variable} antialiased`}>
        {children}
        <Toaster />
        {/* Yapılandırılmış veri: arama motorları uygulamayı "Seyahat Uygulaması" olarak anlar */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </body>
    </html>
  );
}
