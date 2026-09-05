import { describe, expect, it } from "vitest";
import {
  OSM_PRESCREEN_VERSION,
  evaluateOsmPrescreen,
} from "./osm-prescreen";

function candidate(
  overrides: Partial<Parameters<typeof evaluateOsmPrescreen>[0]> = {},
) {
  return {
    slug: "rasht-osm-node-101",
    sourceUrl: "https://www.openstreetmap.org/node/101",
    licenseName: "ODbL-1.0",
    licenseUrl: "https://www.openstreetmap.org/copyright",
    attributionText: "© OpenStreetMap contributors",
    latitude: 37.28,
    longitude: 49.58,
    contact: {
      phone: "+981333112233",
      address: "رشت، گلسار",
      instagram: "cafe_rasht",
    },
    ...overrides,
  };
}

describe("evaluateOsmPrescreen", () => {
  it("marks a well-supported record as low risk with a versioned score", () => {
    expect(evaluateOsmPrescreen(candidate())).toEqual({
      version: OSM_PRESCREEN_VERSION,
      recommendation: "low_risk_review",
      score: 100,
      reasonCodes: [
        "valid_provenance",
        "rasht_coordinates",
        "phone_present",
        "address_present",
        "digital_channel_present",
      ],
    });
  });

  it("keeps a phone-only record in completion even when its score reaches 75", () => {
    expect(
      evaluateOsmPrescreen(
        candidate({
          contact: { phone: "+981333112233" },
        }),
      ),
    ).toMatchObject({
      recommendation: "needs_completion",
      score: 75,
      reasonCodes: expect.arrayContaining(["missing_context"]),
    });
  });

  it.each([
    {
      name: "untrusted source link",
      overrides: { sourceUrl: null },
      reason: "invalid_provenance",
    },
    {
      name: "coordinates outside Rasht",
      overrides: { latitude: 35.7, longitude: 51.4 },
      reason: "outside_rasht_bounds",
    },
    {
      name: "source identity mismatch",
      overrides: { slug: "rasht-osm-way-999" },
      reason: "source_identity_mismatch",
    },
  ])("marks $name as a high-risk exception", ({ overrides, reason }) => {
    expect(evaluateOsmPrescreen(candidate(overrides))).toMatchObject({
      recommendation: "high_risk_exception",
      reasonCodes: expect.arrayContaining([reason]),
    });
  });

  it("accepts a bounded semicolon-separated list of normalized Iranian phones", () => {
    expect(
      evaluateOsmPrescreen(
        candidate({
          contact: {
            phone: "+981332121749;+981332121805;+981332111296",
            address: "رشت",
          },
        }),
      ),
    ).not.toMatchObject({
      recommendation: "high_risk_exception",
      reasonCodes: expect.arrayContaining(["invalid_phone"]),
    });
  });
});
