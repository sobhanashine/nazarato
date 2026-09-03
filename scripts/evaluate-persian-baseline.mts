import { readFile } from "node:fs/promises";
import {
  evaluateBaseline,
  parseLabelledDataset,
} from "../lib/intelligence/evaluate-baseline.ts";

const datasetUrl = new URL(
  "../data/evaluation/persian-customer-voice.synthetic.json",
  import.meta.url,
);

async function main(): Promise<void> {
  const rawDataset: unknown = JSON.parse(await readFile(datasetUrl, "utf8"));
  const dataset = parseLabelledDataset(rawDataset);
  const report = evaluateBaseline(dataset.reviews, dataset.metadata);

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error: unknown) => {
  console.error("Persian baseline evaluation failed", {
    script: "scripts/evaluate-persian-baseline.mts",
    error: error instanceof Error ? error.message : "Unknown error",
  });
  process.exitCode = 1;
});
