import { cache } from "react";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { headers } from "next/headers";
import { isLocalGolsarPreview, parseGolsarExport, type GolsarCafe } from "./golsar";

/** Production never reads the private file. Empty local catalogs never fall back to fixtures. */
export const getLocalGolsarCafes = cache(async (): Promise<GolsarCafe[] | null> => {
  if (process.env.NODE_ENV !== "development" || process.env.NAZARATO_LOCAL_PREVIEW !== "true") return null;
  if (!isLocalGolsarPreview(process.env.NODE_ENV, process.env.NAZARATO_LOCAL_PREVIEW, (await headers()).get("host"))) return null;
  try {
    const raw = await readFile(path.join(process.cwd(), "data/private/golsar-pilot.json"), "utf8");
    if (raw.length > 1_000_000) throw new Error("Snapshot exceeds limit");
    return parseGolsarExport(JSON.parse(raw));
  } catch {
    console.error("[golsar-product] private snapshot unavailable or invalid");
    return [];
  }
});
