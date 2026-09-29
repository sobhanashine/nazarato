import { describe, expect, it } from "vitest";
import { toGolsarBusiness, toGolsarBusinessDetail } from "./golsar-product";
import type { GolsarCafe } from "./golsar";

const cafe: GolsarCafe = { id: "test-cafe-place-123", name: "کافه وک", sourceName: "Wok", address: "رشت، بلوار توحید", street: "توحید", phone: "+981333333333", instagram: "https://www.instagram.com/wok.cafe/", latitude: 37.3, longitude: 49.58, plusCodes: ["6H6P+74M"], sourceUrl: "https://www.google.com/maps/", capturedAt: "2026-09-25T00:00:00Z", priority: 2, categoryNote: "", closed: false };

describe("Golsar data in existing product contracts", () => {
  it("keeps identity and factual contact information for native profile pages", () => {
    const detail = toGolsarBusinessDetail(cafe);
    expect(detail.slug).toBe(cafe.id);
    expect(detail.name).toBe(cafe.name);
    expect(detail.contact).toEqual({ phone: cafe.phone, instagram: "wok.cafe" });
    expect(detail.info).toContainEqual({ label: "نشانی", value: cafe.address });
    expect(detail.info).toContainEqual({ label: "کد موقعیت", value: "6H6P+74M" });
  });
  it("does not turn a source-only candidate into verified ownership, ratings or reviews", () => {
    const detail = toGolsarBusinessDetail(cafe);
    const card = toGolsarBusiness(cafe);
    expect(detail.verified).toBe(false);
    expect(detail.claimed).toBe(false);
    expect(detail.reviews).toEqual([]);
    expect(detail.hours).toBeUndefined();
    expect(card.score).toBe("—");
    expect(card.reviewCount).toBe(0);
  });
  it("retains streets for search and omits missing contact instead of inventing it", () => {
    expect(toGolsarBusiness(cafe).searchText).toContain("توحید");
    expect(toGolsarBusinessDetail({ ...cafe, phone: null, instagram: null }).contact).toEqual({});
  });
});
