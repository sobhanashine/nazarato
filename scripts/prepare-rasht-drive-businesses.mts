/**
 * Prepare a private, quarantined snapshot from an operator-provided Drive export.
 *
 * Usage:
 *   node --experimental-strip-types scripts/prepare-rasht-drive-businesses.mts \
 *     data/private/rasht-drive-businesses.source.json
 *
 * The script prints JSON to stdout. Keep inputs and outputs under data/private/;
 * that directory is gitignored because the source sheet's publication rights
 * are not confirmed.
 */

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import osmSnapshot from "../data/rasht-osm-businesses.json" with { type: "json" };
import {
  buildRashtDriveMatchReport,
  buildRashtDriveSnapshot,
} from "../lib/import/rasht-drive-businesses.ts";

const inputPath = process.argv[2];
if (!inputPath) {
  throw new Error(
    "Pass the path to a private Google Drive export JSON file as the first argument.",
  );
}

const raw = await readFile(resolve(inputPath), "utf8");
const parsed: unknown = JSON.parse(raw);
const snapshot = buildRashtDriveSnapshot(parsed);
if (!snapshot.ok) {
  const details = snapshot.issues
    .map((issue) => `${issue.path}: ${issue.message}`)
    .join("\n");
  throw new Error(`Drive export validation failed:\n${details}`);
}

console.log(
  JSON.stringify(
    {
      ...snapshot.value,
      matchReport: buildRashtDriveMatchReport(snapshot.value, osmSnapshot),
    },
    null,
    2,
  ),
);
