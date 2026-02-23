import type { Metadata } from "next";
import { geistMono, geistSans } from "@/lib/fonts";
import { getSiteUrl } from "@/lib/seo";
import { WebsiteClickTracker } from "@/components/website-click-tracker";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Sfane | Premium Everyday Carry",
    template: "%s | Sfane",
  },
  description:
    "Premium duffle bags, toiletry kits, and tiffin bags crafted for gym, office, and everyday travel.",
  keywords: [
    "Sfane",
    "duffle bags",
    "toiletry kit",
    "tiffin bags",
    "gym bags",
    "travel bags",
    "buy bags online India",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Sfane",
    title: "Sfane | Premium Everyday Carry",
    description:
      "Premium duffle bags, toiletry kits, and tiffin bags crafted for gym, office, and everyday travel.",
    images: [
      {
        url: "/sfanelogo.png",
        width: 1200,
        height: 630,
        alt: "Sfane premium carry collection",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sfane | Premium Everyday Carry",
    description:
      "Premium duffle bags, toiletry kits, and tiffin bags crafted for gym, office, and everyday travel.",
    images: ["/sfanelogo.png"],
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
  icons: {
    icon: "/sfane-icon.png",
    shortcut: "/sfane-icon.png",
    apple: "/sfane-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <WebsiteClickTracker />
        {children}
      </body>
    </html>
  );
}
