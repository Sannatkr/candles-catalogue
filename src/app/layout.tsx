import type { Metadata } from "next";
import { Suspense } from "react";
import { Fraunces, Inter } from "next/font/google";
import { AnalyticsProvider } from "@/lib/analytics";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = "https://www.sugandhacandles.com";
const TITLE = "Sugandha Candles";
const DESCRIPTION =
  "Handcrafted soy wax candles, urli platters and gift hampers — poured in small batches, finished in gold. Beautiful enough to keep long after the occasion.";

export const metadata: Metadata = {
  // Without this, every relative link and image in a preview card resolves
  // against localhost in dev and against the deployment URL in production —
  // so WhatsApp and Google would quote a vercel.app address, not the brand.
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s · Sugandha Candles",
  },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "Sugandha Candles",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="grain antialiased">
        {/* useSearchParams needs a boundary, and analytics must never be the
            reason a page falls back to client-side rendering. */}
        <Suspense fallback={null}>
          <AnalyticsProvider />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
