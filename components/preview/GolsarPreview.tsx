"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { GolsarCafe } from "@/lib/preview/golsar";

/** Old private preview links now open the actual dev product pages. */
export function GolsarPreview({ cafes }: { cafes: GolsarCafe[] }) {
  const router = useRouter();
  useEffect(() => {
    let id = "";
    try { id = decodeURIComponent(window.location.hash.replace(/^#cafe\//, "")); } catch { /* Invalid links fall back to the catalog. */ }
    router.replace(cafes.some(cafe => cafe.id === id) ? `/company/${encodeURIComponent(id)}` : "/");
  }, [cafes, router]);
  return <p role="status" className="px-6 py-12 text-center text-muted">در حال بازکردن نظراتو…</p>;
}
