import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
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

export const metadata: Metadata = {
  title: {
    default: "Sugandha Candles — Wholesale Catalogue",
    template: "%s · Sugandha Candles",
  },
  description:
    "100% natural soy wax, smokeless burn, imported fragrance. The full range with sizes, price slabs and trade terms.",
  openGraph: {
    title: "Sugandha Candles — Wholesale Catalogue",
    description:
      "100% natural soy wax, smokeless burn, imported fragrance. The full range with sizes, price slabs and trade terms.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="grain antialiased">{children}</body>
    </html>
  );
}
