import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import { Backdrop } from "@/components/layout/Backdrop";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { RegisterSW } from "@/components/pwa/RegisterSW";
import "./globals.css";

const vazirmatn = Vazirmatn({
  variable: "--font-vazirmatn",
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0e18" },
    { media: "(prefers-color-scheme: light)", color: "#0a0e18" },
  ],
};

export const metadata: Metadata = {
  title: "نظراتو – بهترین نظرات کسب‌وکارها",
  description: "بهترین نظرات کسب‌وکارها در نظراتو",
  applicationName: "نظراتو",
  appleWebApp: {
    capable: true,
    title: "نظراتو",
    statusBarStyle: "black-translucent",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fa"
      dir="rtl"
      data-scroll-behavior="smooth"
      className={`${vazirmatn.variable} scroll-smooth scheme-dark`}
    >
      <body className="relative min-h-screen overflow-x-hidden bg-[#06080f] text-strong antialiased [text-rendering:optimizeLegibility] selection:bg-mint/35 selection:text-white pb-[calc(76px+env(safe-area-inset-bottom))] md:pb-0">
        <Backdrop />
        {children}
        <MobileTabBar />
        <InstallPrompt />
        <RegisterSW />
      </body>
    </html>
  );
}
