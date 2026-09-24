import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono-jb",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "METAx — The network was always an asset",
  description:
    "A tokenized-equity hub for the world's largest connection graph. Continuous settlement, fractional ownership, on-chain proof.",
  openGraph: {
    title: "The Social Network — the network was always an asset",
    description:
      "Every trade pays holders in Meta stock. 70% split on-chain, paid pro rata.",
    type: "website",
    images: [{ url: "/brand/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Social Network — the network was always an asset",
    description:
      "Every trade pays holders in Meta stock. 70% split on-chain, paid pro rata.",
    images: ["/brand/og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#05070d",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} ${jetbrains.variable}`}
    >
      <body className="grain vignette antialiased">{children}</body>
    </html>
  );
}
