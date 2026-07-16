import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const SITE_URL = "https://aurex-motors-ecru.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "AUREX MOTORS — The Future Has Arrived",
  description:
    "AUREX GT-1. An all-electric grand tourer designed to redefine performance: 0–100 km/h in 2.4s, 340 km/h, 720 km of range. Experience the film.",
  keywords: [
    "AUREX MOTORS",
    "electric car",
    "luxury EV",
    "grand tourer",
    "AUREX GT-1",
  ],
  openGraph: {
    title: "AUREX MOTORS — The Future Has Arrived",
    description:
      "An all-electric grand tourer designed to redefine performance.",
    url: SITE_URL,
    siteName: "AUREX MOTORS",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "AUREX MOTORS — The Future Has Arrived",
    description:
      "An all-electric grand tourer designed to redefine performance.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#050507",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body className="grain">
        {children}
      </body>
    </html>
  );
}
