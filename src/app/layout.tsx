import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Route TR — Türkiye Seyahat & Rota Günlüğü | İnteraktif Harita",
  description:
    "Türkiye'nin 81 ilini, gerçek ilçe sınırlarını ve önemli gezi noktalarını adım adım işaretleyip keşif yüzdenizi hesaplayabileceğiniz interaktif seyahat günlüğü ve harita uygulaması. Rozetler, hedefler, hava durumu ve sosyal paylaşım.",
  keywords: [
    "Türkiye haritası",
    "seyahat günlüğü",
    "il keşfi",
    "ilçe haritası",
    "Türkiye gezileri",
    "rota planlayıcı",
    "seyahat takibi",
    "RouteTR",
  ],
  authors: [{ name: "Aydın Aydemir (@cyberQbit)" }],
  manifest: `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/manifest.webmanifest`,
  verification: {
    google: "NWmyOX6PtbwtGpuobiKq5DeTX08zqy2c5NdSvu-69sc",
  },
  openGraph: {
    title: "Route TR — Türkiye Keşif Haritası & Seyahat Günlüğü",
    description: "81 il, 973 ilçe ve 600+ POI ile kişisel Türkiye seyahat haritanı oluştur. Rozetler, hedefler, hava durumu ve sosyal paylaşım özelliği ile.",
    type: "website",
    locale: "tr_TR",
    siteName: "Route TR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Route TR — Türkiye Keşif Haritası",
    description: "Türkiye'yi keşfet, rozetler kaz, başarılarını paylaş. İnteraktif seyahat haritası.",
    creator: "@cyberQbit",
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
      <body className={`${jakarta.variable} antialiased`}>{children}<Toaster /></body>
    </html>
  );
}
