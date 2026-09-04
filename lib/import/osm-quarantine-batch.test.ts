import { describe, expect, it } from "vitest";
import type {
  BusinessImportRepository,
  PreparedBusinessRow,
  PreparedBusinessSourceRow,
} from "./business-import";
import {
  classifyOsmRemoteState,
  executeOsmQuarantinedBatch,
  planOsmQuarantinedBatch,
} from "./osm-quarantine-batch";

function osmInput(id: string, categorySlug: "cafe" | "restaurant") {
  return {
    business: {
      slug: `rasht-osm-node-${id}`,
      name: categorySlug === "cafe" ? `کافه ${id}` : `رستوران ${id}`,
      categorySlug,
      city: "رشت",
      latitude: 37.28,
      longitude: 49.58,
      contact: { phone: "+989121234567" },
    },
    source: {
      sourceType: "open_dataset",
      sourceRef: `https://www.openstreetmap.org/node/${id}`,
      permissionBasis: "open_license",
      licenseName: "ODbL-1.0",
      licenseUrl: "https://www.openstreetmap.org/copyright",
      attributionText: "© OpenStreetMap contributors",
      publicationApproved: false,
      capturedAt: "2026-09-02T19:07:36Z",
    },
  };
}

function snapshot(...imports: unknown[]) {
  return {
    manifest: {
      source: "OpenStreetMap contributors",
      selectedCount: imports.length,
    },
    imports,
  };
}

class MemoryRepository implements BusinessImportRepository {
  businesses = new Map<string, { id: string; row: PreparedBusinessRow }>();
  sources = new Map<
    string,
    { id: string; row: PreparedBusinessSourceRow & { business_id: string } }
  >();
  publishCalls = 0;
  writeCalls = 0;

  async upsertBusiness(business: PreparedBusinessRow) {
    this.writeCalls += 1;
    const existing = this.businesses.get(business.slug);
    if (existing) return { id: existing.id, created: false };
    const id = `business-${this.businesses.size + 1}`;
    this.businesses.set(business.slug, {
      id,
      row: { ...business, status: "pending" },
    });
    return { id, created: true };
  }

  async upsertSource(
    source: PreparedBusinessSourceRow & { business_id: string },
  ) {
    this.writeCalls += 1;
    const key = `${source.business_id}:${source.payload_hash}`;
    const existing = this.sources.get(key);
    if (existing) return { id: existing.id, created: false };
    const id = `source-${this.sources.size + 1}`;
    this.sources.set(key, { id, row: source });
    return { id, created: true };
  }

  async markBusinessPublishable() {
    this.publishCalls += 1;
  }
}

describe("planOsmQuarantinedBatch", () => {
  it("accepts only pending businesses backed by quarantined OSM sources", () => {
    const result = planOsmQuarantinedBatch(
      snapshot(osmInput("101", "cafe"), osmInput("202", "restaurant")),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.summary).toEqual({
      planned: 2,
      cafes: 1,
      restaurants: 1,
    });
    expect(result.value.items.every((item) => !item.plan.publishable)).toBe(true);
    expect(
      result.value.items.every(
        (item) =>
          item.plan.business.status === "pending" &&
          item.plan.source.status === "quarantined",
      ),
    ).toBe(true);
  });

  it("rejects an approved source before the repository receives any write", async () => {
    const approved = osmInput("303", "cafe");
    approved.source.publicationApproved = true;
    const repository = new MemoryRepository();

    const result = await executeOsmQuarantinedBatch(
      snapshot(approved),
      repository,
    );

    expect(result.ok).toBe(false);
    expect(repository.writeCalls).toBe(0);
    expect(repository.publishCalls).toBe(0);
  });

  it("rejects duplicate OSM identities before writing", () => {
    const duplicate = osmInput("404", "restaurant");
    const result = planOsmQuarantinedBatch(snapshot(duplicate, duplicate));

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.some((issue) => issue.path === "imports[1].business.slug")).toBe(
      true,
    );
  });
});

describe("executeOsmQuarantinedBatch", () => {
  it("is idempotent and never calls the publication hook", async () => {
    const input = snapshot(
      osmInput("505", "cafe"),
      osmInput("606", "restaurant"),
    );
    const repository = new MemoryRepository();

    const first = await executeOsmQuarantinedBatch(input, repository);
    const second = await executeOsmQuarantinedBatch(input, repository);

    expect(first.ok && first.value).toMatchObject({
      planned: 2,
      businessesCreated: 2,
      sourcesCreated: 2,
    });
    expect(second.ok && second.value).toMatchObject({
      planned: 2,
      businessesCreated: 0,
      sourcesCreated: 0,
    });
    expect(repository.publishCalls).toBe(0);
    expect(repository.businesses.size).toBe(2);
    expect(repository.sources.size).toBe(2);
  });
});

describe("classifyOsmRemoteState", () => {
  it("allows new rows and exact idempotent rows but blocks active collisions", () => {
    const plan = planOsmQuarantinedBatch(
      snapshot(osmInput("707", "cafe"), osmInput("808", "restaurant")),
    );
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;

    const exact = plan.value.items[0];
    const result = classifyOsmRemoteState(
      plan.value,
      [
        { id: "business-707", slug: exact.plan.business.slug, status: "pending" },
        {
          id: "business-808",
          slug: plan.value.items[1].plan.business.slug,
          status: "active",
        },
      ],
      [
        {
          business_id: "business-707",
          payload_hash: exact.plan.source.payload_hash,
          status: "quarantined",
        },
      ],
    );

    expect(result.safe).toBe(false);
    expect(result.newCount).toBe(0);
    expect(result.idempotentCount).toBe(1);
    expect(result.issues).toContainEqual({
      slug: "rasht-osm-node-808",
      message: "Existing business is not a safe pending OSM import row.",
    });
  });

  it("blocks a pending row when extra provenance is already attached", () => {
    const plan = planOsmQuarantinedBatch(snapshot(osmInput("909", "cafe")));
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;

    const expectedSource = plan.value.items[0].plan.source;
    const result = classifyOsmRemoteState(
      plan.value,
      [{ id: "business-909", slug: "rasht-osm-node-909", status: "pending" }],
      [
        {
          business_id: "business-909",
          payload_hash: expectedSource.payload_hash,
          status: "quarantined",
        },
        {
          business_id: "business-909",
          payload_hash: "different-provenance",
          status: "quarantined",
        },
      ],
    );

    expect(result.safe).toBe(false);
    expect(result.issues).toContainEqual({
      slug: "rasht-osm-node-909",
      message: "Existing pending business has unmatched or non-quarantined provenance.",
    });
  });
});
