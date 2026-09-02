import { describe, expect, it } from "vitest";
import {
  executeBusinessImport,
  prepareBusinessImport,
  type BusinessImportRepository,
  type PreparedBusinessRow,
  type PreparedBusinessSourceRow,
} from "./business-import";
import { rashtBusinessImportFixtures } from "./rasht-business-fixtures";

const OWNER_INPUT = {
  business: {
    slug: "cafe-sabz-rasht",
    name: "  کافه سبز  ",
    categorySlug: "cafe",
    city: "رشت",
    neighborhoodSlug: "golsar",
    latitude: 37.2992,
    longitude: 49.5841,
    priceBand: 2,
    contact: { phone: " 01312345678 ", instagram: "cafe_sabz" },
  },
  source: {
    sourceType: "owner_submission",
    sourceRef: "owner-intake://pilot-1",
    permissionBasis: "owner_consent",
    capturedAt: "2026-09-02T12:00:00+03:30",
  },
};

class MemoryImportRepository implements BusinessImportRepository {
  private businesses = new Map<string, { id: string; row: PreparedBusinessRow }>();
  private sources = new Map<
    string,
    { id: string; row: PreparedBusinessSourceRow & { business_id: string } }
  >();

  async upsertBusiness(business: PreparedBusinessRow) {
    const existing = this.businesses.get(business.slug);
    if (existing) return { id: existing.id, created: false };
    const id = `business-${this.businesses.size + 1}`;
    this.businesses.set(business.slug, {
      id,
      row: { ...business, status: "pending" },
    });
    return { id, created: true };
  }

  async markBusinessPublishable(businessId: string) {
    for (const [slug, value] of this.businesses.entries()) {
      if (value.id === businessId && value.row.status === "pending") {
        this.businesses.set(slug, {
          ...value,
          row: { ...value.row, status: "active" },
        });
      }
    }
  }

  async upsertSource(
    source: PreparedBusinessSourceRow & { business_id: string },
  ) {
    const key = `${source.business_id}:${source.payload_hash}`;
    const existing = this.sources.get(key);
    if (existing) return { id: existing.id, created: false };
    const id = `source-${this.sources.size + 1}`;
    this.sources.set(key, { id, row: source });
    return { id, created: true };
  }

  counts() {
    return { businesses: this.businesses.size, sources: this.sources.size };
  }

  businessStatus(slug: string) {
    return this.businesses.get(slug)?.row.status;
  }
}

describe("prepareBusinessImport", () => {
  it("normalizes an owner-approved factual profile into a publishable plan", () => {
    const result = prepareBusinessImport(OWNER_INPUT);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.publishable).toBe(true);
    expect(result.value.business).toMatchObject({
      slug: "cafe-sabz-rasht",
      name: "کافه سبز",
      city: "رشت",
      status: "active",
      price_band: 2,
      contact: { phone: "01312345678", instagram: "cafe_sabz" },
    });
    expect(result.value.source.status).toBe("approved");
    expect(result.value.source.payload_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(result.value.source.captured_at).toBe("2026-09-02T08:30:00.000Z");
  });

  it("rejects descriptions, ratings, reviews, images, and unsupported contact fields", () => {
    const result = prepareBusinessImport({
      ...OWNER_INPUT,
      business: {
        ...OWNER_INPUT.business,
        description: "Copied promotional copy",
        rating: 4.9,
        reviews: ["Copied review"],
        logoUrl: "https://example.test/logo.jpg",
        contact: { ...OWNER_INPUT.business.contact, menu: "copied-menu" },
      },
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.map((issue) => issue.path)).toEqual(
      expect.arrayContaining([
        "business.description",
        "business.rating",
        "business.reviews",
        "business.logoUrl",
        "business.contact.menu",
      ]),
    );
  });

  it("rejects a permission claim that does not match its source type", () => {
    const result = prepareBusinessImport({
      ...OWNER_INPUT,
      source: {
        ...OWNER_INPUT.source,
        sourceType: "manual_public_facts",
        permissionBasis: "owner_consent",
      },
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues).toContainEqual({
      path: "source.permissionBasis",
      message:
        "Permission basis owner_consent does not match source type manual_public_facts.",
    });
  });

  it("quarantines a public-facts import when reuse permission is unknown", () => {
    const result = prepareBusinessImport({
      ...OWNER_INPUT,
      source: {
        ...OWNER_INPUT.source,
        sourceType: "manual_public_facts",
        sourceRef: "https://directory.example.test/business/123",
        permissionBasis: "unknown",
      },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.publishable).toBe(false);
    expect(result.value.business.status).toBe("pending");
    expect(result.value.source.status).toBe("quarantined");
  });
});

describe("executeBusinessImport", () => {
  it("is idempotent for the same business and source payload", async () => {
    const repository = new MemoryImportRepository();
    const first = await executeBusinessImport(OWNER_INPUT, repository);
    const second = await executeBusinessImport(OWNER_INPUT, repository);

    expect(first.ok && first.value.businessCreated).toBe(true);
    expect(first.ok && first.value.sourceCreated).toBe(true);
    expect(second.ok && second.value.businessCreated).toBe(false);
    expect(second.ok && second.value.sourceCreated).toBe(false);
    expect(repository.counts()).toEqual({ businesses: 1, sources: 1 });
    expect(repository.businessStatus("cafe-sabz-rasht")).toBe("active");
  });

  it("leaves a new approved profile pending when source persistence fails", async () => {
    const repository = new MemoryImportRepository();
    repository.upsertSource = async () => {
      throw new Error("simulated source failure");
    };

    await expect(executeBusinessImport(OWNER_INPUT, repository)).rejects.toThrow(
      "simulated source failure",
    );
    expect(repository.businessStatus("cafe-sabz-rasht")).toBe("pending");
  });

  it("quarantines every development fixture and produces stable distinct hashes", () => {
    const firstPass = rashtBusinessImportFixtures.map(prepareBusinessImport);
    const secondPass = rashtBusinessImportFixtures.map(prepareBusinessImport);

    expect(firstPass.every((result) => result.ok)).toBe(true);
    const firstHashes = firstPass.flatMap((result) =>
      result.ok ? [result.value.source.payload_hash] : [],
    );
    const secondHashes = secondPass.flatMap((result) =>
      result.ok ? [result.value.source.payload_hash] : [],
    );
    expect(new Set(firstHashes).size).toBe(rashtBusinessImportFixtures.length);
    expect(secondHashes).toEqual(firstHashes);
    for (const result of firstPass) {
      if (!result.ok) continue;
      expect(result.value.publishable).toBe(false);
      expect(result.value.business.status).toBe("pending");
      expect(result.value.source.status).toBe("quarantined");
    }
  });
});
