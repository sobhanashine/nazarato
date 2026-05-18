import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
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
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable}>
      <body>
        {children}
        <MobileTabBar />
        <InstallPrompt />
        <RegisterSW />
      </body>
    </html>
  );
}
