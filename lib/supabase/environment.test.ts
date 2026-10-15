import { describe, expect, it } from "vitest";
import { databaseSchema, storageBucket } from "./environment";

describe("database environment isolation", () => {
  const stage = { NAZARATO_DEPLOYMENT_ENV: "staging", NAZARATO_DATABASE_SCHEMA: "nazarato_staging" };
  it("keeps production on public and staging on its explicit namespace", () => {
    expect(databaseSchema({})).toBe("public");
    expect(databaseSchema(stage)).toBe("nazarato_staging");
    expect(databaseSchema({ NAZARATO_DATABASE_SCHEMA: "nazarato_staging" }, true)).toBe("nazarato_staging");
  });
  it("fails closed for missing, public or injected staging schema names", () => {
    for (const schema of [undefined, "public", "other", "nazarato_staging;drop schema public"]) {
      expect(() => databaseSchema({ ...stage, NAZARATO_DATABASE_SCHEMA: schema })).toThrow();
    }
    expect(() => databaseSchema({ NAZARATO_DATABASE_SCHEMA: "nazarato_staging" })).toThrow();
  });
  it("separates both upload buckets from production", () => {
    for (const name of ["claim-proofs", "business-photos"] as const) {
      expect(storageBucket(name, stage)).toBe(`${name}-staging`);
      expect(storageBucket(name, {})).toBe(name);
    }
  });
});
