import type { NextConfig } from "next";

// ==========================================================================
// RouteTR — Next.js yapılandırması
//
// Yerel geliştirme / Vercel:  bun run dev  (ek ayar gerekmez)
// GitHub Pages yayınını:      NEXT_PUBLIC_BASE_PATH=/RouteTR bun run build
//   → çıktı out/ klasörüne statik export edilir (GitHub Actions da bunu kullanır)
// ==========================================================================

const GH_PAGES_BASE = process.env.NEXT_PUBLIC_BASE_PATH; // örn. "/RouteTR"

const nextConfig: NextConfig = {
  ...(GH_PAGES_BASE
    ? {
        output: "export" as const,
        basePath: GH_PAGES_BASE,
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {
        output: "standalone",
      }),
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
