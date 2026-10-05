import { getDiscoveryCatalog } from "@/lib/data/discovery";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { SmflowWidget } from "@/components/integrations/SmflowWidget";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { RegisterSW } from "@/components/pwa/RegisterSW";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { ReviewSheetProvider } from "@/components/review/ReviewSheetProvider";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const vazirmatn = localFont({
  src: [
    { path: "./fonts/vazirmatn-arabic.woff2", weight: "100 900", style: "normal" },
    { path: "./fonts/vazirmatn-latin.woff2", weight: "100 900", style: "normal" },
  ],
  variable: "--font-vazirmatn",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F6F4ED",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  robots: { index: false, follow: true },
  title: "نظراتو — تجربه‌های محلی، انتخاب‌های بهتر",
  description: "کافه و رستوران‌های رشت را پیدا کن؛ با اطلاعات روشن و تجربهٔ دست اول، بهتر انتخاب کن.",
  applicationName: "نظراتو",
  appleWebApp: {
    capable: true,
    title: "نظراتو",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.webp", type: "image/webp" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: ["/favicon.webp"],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { businesses, local } = await getDiscoveryCatalog();
  return (
    <html
      lang="fa"
      dir="rtl"
      data-scroll-behavior="smooth"
      className={`${vazirmatn.variable} scroll-smooth scheme-light`}
    >
      <body className="relative min-h-screen bg-canvas text-strong antialiased [text-rendering:optimizeLegibility] selection:bg-mint/15 selection:text-strong pb-[calc(72px+env(safe-area-inset-bottom))] md:pb-0">
        <ReviewSheetProvider businesses={businesses} localPreview={local}>
          {children}
          <MobileTabBar />
        </ReviewSheetProvider>
        <InstallPrompt />
        <RegisterSW />
        <ToastProvider />
        <SmflowWidget />
      </body>
    </html>
  );
}
