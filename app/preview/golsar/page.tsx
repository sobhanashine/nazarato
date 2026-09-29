import type { Metadata } from "next";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { GolsarPreview } from "@/components/preview/GolsarPreview";
import { isLocalGolsarPreview, parseGolsarExport, type GolsarCafe } from "@/lib/preview/golsar";

export const metadata: Metadata = {
  title: "کافه‌های گلسار | پیش‌نمایش محلی نظراتو",
  robots: { index: false, follow: false },
};

export default async function GolsarPreviewPage() {
  if (!isLocalGolsarPreview(process.env.NODE_ENV, process.env.NAZARATO_LOCAL_PREVIEW, (await headers()).get("host"))) notFound();
  let cafes: GolsarCafe[];
  try {
    // Runtime file read: the private export is never imported into a public bundle.
    const raw = await readFile(path.join(process.cwd(), "data/private/golsar-pilot.json"), "utf8");
    if (raw.length > 1_000_000) throw new Error("Snapshot exceeds limit");
    cafes = parseGolsarExport(JSON.parse(raw));
  } catch {
    console.error("[preview/golsar] private snapshot unavailable or invalid");
    return <main className="mx-auto max-w-xl px-6 py-24"><h1 className="text-2xl font-bold">دادهٔ پیش‌نمایش آماده نیست</h1><p className="mt-4 text-muted">فایل خصوصی کافه‌های گلسار باید آماده و بررسی شود. با بارگذاری دوباره می‌توانی مجدداً امتحان کنی.</p></main>;
  }
  return <GolsarPreview cafes={cafes} />;
}
