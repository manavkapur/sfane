import localFont from "next/font/local";

export const geistSans = localFont({
  src: [
    { path: "../fonts/Geist-1.woff2", weight: "100 900", style: "normal" },
    { path: "../fonts/Geist-2.woff2", weight: "100 900", style: "normal" },
  ],
  variable: "--font-geist-sans",
  display: "swap",
});

export const geistMono = localFont({
  src: [
    { path: "../fonts/Geist_Mono-1.woff2", weight: "100 900", style: "normal" },
    { path: "../fonts/Geist_Mono-2.woff2", weight: "100 900", style: "normal" },
  ],
  variable: "--font-geist-mono",
  display: "swap",
});

export const manrope = localFont({
  src: [
    { path: "../fonts/Manrope-1.woff2", weight: "200 800", style: "normal" },
    { path: "../fonts/Manrope-2.woff2", weight: "200 800", style: "normal" },
  ],
  display: "swap",
});

export const playfairDisplay = localFont({
  src: [
    { path: "../fonts/Playfair_Display-1.woff2", weight: "600", style: "normal" },
    { path: "../fonts/Playfair_Display-2.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
});

export const cormorantGaramond = localFont({
  src: [
    { path: "../fonts/Cormorant_Garamond-1.woff2", weight: "400", style: "normal" },
    { path: "../fonts/Cormorant_Garamond-2.woff2", weight: "500", style: "normal" },
  ],
  display: "swap",
});
