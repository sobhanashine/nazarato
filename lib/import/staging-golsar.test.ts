import { describe, expect, it } from "vitest";
import { prepareStagingGolsar } from "./staging-golsar";

const cafe = {
  google_place_id: "fictional-place-123", name: "کافهٔ آزمون", address_readable: "رشت، توحید",
  latitude: 37.3, longitude: 49.58, source_url: "https://www.google.com/maps/search/?query=cafe",
  captured_at: "2026-09-25T00:28:00.000Z", source_provider: "google_maps_via_apify",
  permission_basis: "unknown", publication_status: "not_approved", pilot_category_proposed: "cafe",
};

describe("staging Golsar import", () => {
  it("retains stable identity and unresolved provenance without importing opinions or people", () => {
    const input = { items: [{ ...cafe, rating: 4.9, reviews: [{ author: "private person", text: "copied opinion" }], photo: "private-photo" }] };
    const [row] = prepareStagingGolsar(input);
    expect(row.id).toMatch(/^[a-f0-9-]{36}$/);
    expect(prepareStagingGolsar(input)[0].id).toBe(row.id);
    expect(row.field_payload).toMatchObject({ usage_scope: "staging_only", publication_status: "not_approved", permission_basis: "unknown", owner_verified: false });
    expect(JSON.stringify(row)).not.toMatch(/private person|copied opinion|private-photo|4\.9/);
    expect(row).not.toHaveProperty("review_count");
    expect(row).not.toHaveProperty("owner_id");
  });
  it("rejects duplicate identities or malformed provenance before any write", () => {
    expect(() => prepareStagingGolsar({ items: [cafe, cafe] })).toThrow();
    expect(() => prepareStagingGolsar({ items: [{ ...cafe, publication_status: "approved" }] })).toThrow();
    expect(() => prepareStagingGolsar({ items: [{ ...cafe, latitude: 0 }] })).toThrow();
  });
});
