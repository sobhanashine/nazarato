import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GolsarPreview } from "@/components/preview/GolsarPreview";
import { getLocalGolsarCafes } from "@/lib/preview/golsar-server";

export const metadata: Metadata = {
  title: "کافه‌های گلسار | پیش‌نمایش محلی نظراتو",
  robots: { index: false, follow: false },
};

export default async function GolsarPreviewPage() {
  const cafes = await getLocalGolsarCafes();
  if (cafes === null) notFound();
  if (cafes.length === 0) {
    return <main className="mx-auto max-w-xl px-6 py-24"><h1 className="text-2xl font-bold">دادهٔ پیش‌نمایش آماده نیست</h1><p className="mt-4 text-muted">فایل خصوصی کافه‌های گلسار باید آماده و بررسی شود. با بارگذاری دوباره می‌توانی مجدداً امتحان کنی.</p></main>;
  }
  return <GolsarPreview cafes={cafes} />;
}
