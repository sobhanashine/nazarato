import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "نظراتو – بهترین نظرات کسب‌وکارها",
    short_name: "نظراتو",
    description:
      "پلتفرم نظرات واقعی ایرانیان. قبل از خرید، نظر بقیه رو بخون.",
    lang: "fa",
    dir: "rtl",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a0e18",
    theme_color: "#0a0e18",
    categories: ["business", "lifestyle", "shopping"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
    screenshots: [
      {
        src: "/pwa-banner-mobile.png",
        sizes: "1080x1920",
        type: "image/png",
        label: "نظراتو در موبایل",
      },
    ],
  };
}
