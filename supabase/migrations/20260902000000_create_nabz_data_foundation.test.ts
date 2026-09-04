import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL("./20260902000000_create_nabz_data_foundation.sql", import.meta.url),
  "utf8",
);
const rollback = readFileSync(
  new URL("../rollbacks/20260902000000_create_nabz_data_foundation.down.sql", import.meta.url),
  "utf8",
);

describe("Nabz data-foundation migration", () => {
  it("creates and RLS-protects every private intelligence table", () => {
    for (const table of [
      "business_sources",
      "comparison_votes",
      "review_analyses",
      "review_analysis_corrections",
      "taste_profiles",
    ]) {
      expect(migration).toContain(`create table if not exists public.${table}`);
      expect(migration).toContain(
        `alter table public.${table} enable row level security`,
      );
    }
    expect(migration).not.toMatch(/create policy[\s\S]+on public\.(business_sources|comparison_votes|review_analyses|review_analysis_corrections|taste_profiles)/i);
  });

  it("enforces quarantine, deduplication, and private model-version invariants", () => {
    expect(migration).toContain("uq_business_sources_business_payload_hash");
    expect(migration).toContain("ck_business_sources_permission_status");
    expect(migration).toContain("ck_business_sources_type_permission");
    expect(migration).toContain("ck_business_sources_open_license_metadata");
    expect(migration).toContain("ck_business_sources_fixture_status");
    expect(migration).toContain("uq_comparison_votes_user_pair_window");
    expect(migration).toContain("uq_comparison_votes_session_pair_window");
    expect(migration).toContain("uq_review_analyses_active_review");
    expect(migration).toContain("idx_review_analysis_corrections_evaluation");
    expect(migration).toContain("model_output       jsonb not null");
    expect(migration).toContain("human_label        jsonb not null");
    expect(migration).toContain("uq_taste_profiles_active_user");
  });

  it("has an explicit rollback for every added table and business column", () => {
    for (const table of [
      "taste_profiles",
      "review_analysis_corrections",
      "review_analyses",
      "comparison_votes",
      "business_sources",
    ]) {
      expect(rollback).toContain(`drop table if exists public.${table}`);
    }
    for (const column of [
      "price_band",
      "longitude",
      "latitude",
      "neighborhood_slug",
    ]) {
      expect(rollback).toContain(`drop column if exists ${column}`);
    }
  });
});
