import { describe, expect, it } from "vitest";
import {
  attachOsmCompletionProposals,
  parseOsmCompletionProposalRows,
  prepareOsmCompletionProposal,
  validateOsmCompletionTargets,
} from "./osm-completion";
import { parseOsmReviewRows } from "./osm-review";

const sourceId = "10000000-0000-4000-8000-000000000001";

function proposal(overrides: Record<string, unknown> = {}) {
  return {
    sourceId,
    sourceRef: "https://sayebookcafe.com/contact",
    permissionBasis: "public_factual_contact",
    contact: {
      phone: "۰۱۳ ۳۳۱۱ ۲۲۳۳",
      address: "  رشت، گلسار  ",
      website: "sayebookcafe.com",
      instagram: "@sayebookcafe",
    },
    ...overrides,
  };
}

describe("prepareOsmCompletionProposal", () => {
  it("normalizes allowlisted factual fields and creates a stable payload hash", () => {
    const result = prepareOsmCompletionProposal(proposal());

    expect(result).toMatchObject({
      ok: true,
      value: {
        sourceId,
        sourceRef: "https://sayebookcafe.com/contact",
        permissionBasis: "public_factual_contact",
        contact: {
          phone: "+981333112233",
          address: "رشت، گلسار",
          website: "https://sayebookcafe.com/",
          instagram: "sayebookcafe",
        },
        payloadHash: expect.stringMatching(/^[0-9a-f]{64}$/),
      },
    });
  });

  it("rejects copied content outside the factual completion allowlist", () => {
    expect(
      prepareOsmCompletionProposal(
        proposal({ contact: { rating: "4.9", review: "عالی بود" } }),
      ),
    ).toEqual({
      ok: false,
      error: "فقط تلفن، نشانی، وب‌سایت یا اینستاگرام قابل ثبت است.",
    });
  });

  it("requires at least one valid completion field and an HTTPS source", () => {
    expect(
      prepareOsmCompletionProposal(proposal({ contact: {} })),
    ).toEqual({
      ok: false,
      error: "حداقل یک فیلد معتبر برای تکمیل لازم است.",
    });
    expect(
      prepareOsmCompletionProposal(proposal({ sourceRef: "javascript:alert(1)" })),
    ).toEqual({
      ok: false,
      error: "آدرس منبع باید یک لینک HTTPS معتبر باشد.",
    });
  });

  it("rejects a phone list when any supplied number is invalid", () => {
    expect(
      prepareOsmCompletionProposal(
        proposal({ contact: { phone: "۰۱۳ ۳۳۱۱ ۲۲۳۳;123" } }),
      ),
    ).toEqual({
      ok: false,
      error: "یکی از فیلدهای تکمیل معتبر نیست.",
    });
  });

  it("forces known directory leads to remain unknown-permission evidence", () => {
    const sourceRef = "https://www.google.com/maps/place/example";
    expect(prepareOsmCompletionProposal(proposal({ sourceRef }))).toEqual({
      ok: false,
      error: "برای منبع دایرکتوری، مبنای مجوز را «نامشخص» انتخاب کن.",
    });
    expect(
      prepareOsmCompletionProposal(
        proposal({ sourceRef, permissionBasis: "unknown" }),
      ),
    ).toMatchObject({
      ok: true,
      value: { sourceRef, permissionBasis: "unknown" },
    });
  });

  it("produces the same hash regardless of contact key order", () => {
    const first = prepareOsmCompletionProposal(
      proposal({ contact: { address: "رشت", instagram: "@cafe" } }),
    );
    const second = prepareOsmCompletionProposal(
      proposal({ contact: { instagram: "@cafe", address: "رشت" } }),
    );
    expect(first.ok && second.ok && first.value.payloadHash).toBe(
      second.ok ? second.value.payloadHash : null,
    );
  });
});

describe("validateOsmCompletionTargets", () => {
  it("accepts only fields that are still missing from the original OSM row", () => {
    expect(
      validateOsmCompletionTargets(
        { address: "رشت", instagram: "cafe" },
        { phone: "+981333112233" },
      ),
    ).toEqual({ ok: true });
    expect(
      validateOsmCompletionTargets(
        { phone: "+981333112244" },
        { phone: "+981333112233" },
      ),
    ).toEqual({
      ok: false,
      error: "فقط فیلدهایی که هنوز در منبع OSM خالی‌اند قابل پیشنهاد هستند.",
    });
  });
});

describe("OSM completion proposal history", () => {
  const businessId = "20000000-0000-4000-8000-000000000001";

  function rawProposal(overrides: Record<string, unknown> = {}) {
    return {
      id: "30000000-0000-4000-8000-000000000001",
      business_id: businessId,
      source_type: "manual_public_facts",
      source_ref: "https://sayebookcafe.com/contact",
      permission_basis: "public_factual_contact",
      field_payload: { contact: { phone: "+981333112233" } },
      captured_at: "2026-09-05T10:00:00.000Z",
      status: "quarantined",
      created_by: "40000000-0000-4000-8000-000000000001",
      ...overrides,
    };
  }

  it("parses allowlisted factual evidence without treating it as approved data", () => {
    expect(parseOsmCompletionProposalRows([rawProposal()])).toEqual([
      {
        id: "30000000-0000-4000-8000-000000000001",
        businessId,
        sourceUrl: "https://sayebookcafe.com/contact",
        sourceWarning: null,
        permissionBasis: "public_factual_contact",
        contact: { phone: "+981333112233" },
        capturedAt: "2026-09-05T10:00:00.000Z",
        createdBy: "40000000-0000-4000-8000-000000000001",
      },
    ]);
  });

  it("keeps unsafe source references visible as warnings but never as links", () => {
    const [item] = parseOsmCompletionProposalRows([
      rawProposal({ source_ref: "javascript:alert(1)" }),
    ]);

    expect(item.sourceUrl).toBeNull();
    expect(item.sourceWarning).toBe("لینک منبع تکمیلی معتبر نیست");
  });

  it("rejects completion rows containing copied reviews or ratings", () => {
    expect(() =>
      parseOsmCompletionProposalRows([
        rawProposal({ field_payload: { contact: {}, rating: 4.9 } }),
      ]),
    ).toThrow("unexpected OSM completion proposal");
  });

  it("rejects stored directory evidence mislabeled as official factual contact", () => {
    expect(() =>
      parseOsmCompletionProposalRows([
        rawProposal({
          source_ref: "https://www.google.com/maps/place/example",
          permission_basis: "public_factual_contact",
        }),
      ]),
    ).toThrow("unexpected OSM completion proposal");
  });

  it("attaches proposal history newest-first without changing the machine score", () => {
    const [candidate] = parseOsmReviewRows([
      {
        id: sourceId,
        source_type: "open_dataset",
        source_ref: "https://www.openstreetmap.org/node/101",
        permission_basis: "open_license",
        license_name: "ODbL-1.0",
        license_url: "https://www.openstreetmap.org/copyright",
        attribution_text: "© OpenStreetMap contributors",
        field_payload: { contact: {} },
        captured_at: "2026-09-02T19:07:36.000Z",
        status: "quarantined",
        businesses: {
          id: businessId,
          name: "کافه باران",
          slug: "rasht-osm-node-101",
          category_slug: "cafe",
          city: "رشت",
          status: "pending",
          latitude: 37.28,
          longitude: 49.58,
        },
      },
    ]);
    const originalScore = candidate.prescreen.score;
    const [attached] = attachOsmCompletionProposals([candidate], [
      rawProposal(),
      rawProposal({
        id: "30000000-0000-4000-8000-000000000002",
        captured_at: "2026-09-05T11:00:00.000Z",
        permission_basis: "unknown",
        source_ref: "https://www.google.com/maps/place/example",
        field_payload: { contact: { address: "رشت، گلسار" } },
      }),
    ]);

    expect(attached.completionProposals.map((item) => item.id)).toEqual([
      "30000000-0000-4000-8000-000000000002",
      "30000000-0000-4000-8000-000000000001",
    ]);
    expect(attached.prescreen.score).toBe(originalScore);
    expect(attached.completenessScore).toBe(0);
  });
});
