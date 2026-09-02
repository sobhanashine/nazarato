import { describe, expect, it } from "vitest";
import snapshot from "../../data/rasht-osm-businesses.json";
import { prepareBusinessImport } from "./business-import";

function duplicateKey(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^(کافه رستوران|کافه|رستوران|کافی شاپ|کبابی)\s+/u, "")
    .replace(/[^\p{L}\p{N}]/gu, "")
    .toLocaleLowerCase("fa-IR");
}

describe("Rasht OpenStreetMap candidate snapshot", () => {
  it("contains a balanced, uniquely sourced set of 50 candidates", () => {
    expect(snapshot.imports).toHaveLength(50);
    expect(
      snapshot.imports.filter(
        (entry) => entry.business.categorySlug === "cafe",
      ),
    ).toHaveLength(25);
    expect(
      snapshot.imports.filter(
        (entry) => entry.business.categorySlug === "restaurant",
      ),
    ).toHaveLength(25);

    const sourceRefs = snapshot.imports.map((entry) => entry.source.sourceRef);
    const nameKeys = snapshot.imports.map((entry) =>
      duplicateKey(entry.business.name),
    );
    expect(new Set(sourceRefs).size).toBe(50);
    expect(new Set(nameKeys).size).toBe(50);
  });

  it("retains the ODbL manifest and quarantines every candidate", () => {
    expect(snapshot.manifest).toMatchObject({
      source: "OpenStreetMap contributors",
      license: "ODbL-1.0",
      licenseUrl: "https://www.openstreetmap.org/copyright",
      attribution: "© OpenStreetMap contributors",
      selectedCount: 50,
    });

    for (const input of snapshot.imports) {
      expect(input.source).toMatchObject({
        sourceType: "open_dataset",
        permissionBasis: "open_license",
        licenseName: "ODbL-1.0",
        licenseUrl: "https://www.openstreetmap.org/copyright",
        attributionText: "© OpenStreetMap contributors",
        publicationApproved: false,
      });
      const prepared = prepareBusinessImport(input);
      expect(prepared.ok).toBe(true);
      if (!prepared.ok) continue;
      expect(prepared.value.publishable).toBe(false);
      expect(prepared.value.business.status).toBe("pending");
      expect(prepared.value.source.status).toBe("quarantined");
    }
  });

  it("contains factual allowlisted fields with normalized coordinates and phones", () => {
    let phones = 0;
    for (const input of snapshot.imports) {
      expect(input.business.city).toBe("رشت");
      expect(input.business.latitude).toBeGreaterThanOrEqual(37.22);
      expect(input.business.latitude).toBeLessThanOrEqual(37.36);
      expect(input.business.longitude).toBeGreaterThanOrEqual(49.5);
      expect(input.business.longitude).toBeLessThanOrEqual(49.69);
      expect(input.business).not.toHaveProperty("description");
      expect(input.business).not.toHaveProperty("rating");
      expect(input.business).not.toHaveProperty("reviews");
      expect(input.business).not.toHaveProperty("logoUrl");

      const phone = input.business.contact?.phone;
      if (phone) {
        phones += 1;
        for (const number of phone.split(";")) {
          expect(number).toMatch(/^\+98\d{10}$/);
        }
      }
    }
    expect(phones).toBeGreaterThanOrEqual(40);
  });
});
