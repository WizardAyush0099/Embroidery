import type { Metadata } from "next";
import { Bodoni_Moda, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-bodoni",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Atelier Brodé — Bespoke Hand Embroidery & Heavyweight Streetwear",
    template: "%s · Atelier Brodé",
  },
  description:
    "Hand-guided embroidery on 450 GSM organic cotton, heavyweight fleece and raw Belgian linen. Bespoke monograms, custom commissions and archival Indian karigar craftsmanship.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: {
    title: "Atelier Brodé — Wear Your Story. Stitch Your Identity.",
    description:
      "Bespoke hand-guided and multi-head precision embroidery on sustainably woven organic cotton, heavyweight fleece and raw linen.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bodoni.variable} ${jakarta.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
