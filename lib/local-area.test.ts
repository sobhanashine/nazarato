import { describe, expect, it } from "vitest";
import { businessInArea, resolveArea } from "./local-area";
import type { Business } from "./data/businesses";
const cafe: Business = { slug: "cafe-test", name: "کافه", category: "کافه", city: "رشت", initial: "ک", color: "#123456", score: "—", reviews: "۰", searchText: "Rasht, Tohid Blvd" };
describe("manual area preference", () => {
  it("defaults to Rasht and restores a valid browser preference", () => {
    expect(resolveArea(undefined)).toBe("rasht");
    expect(resolveArea(undefined, "tohid")).toBe("tohid");
  });
  it("gives an explicit URL precedence, including all areas", () => {
    expect(resolveArea("all", "tohid")).toBe("all");
    expect(resolveArea("golsar", "all")).toBe("golsar");
  });
  it("rejects malformed URL or stored values without widening the area", () => {
    expect(resolveArea("<script>", "all")).toBe("rasht");
    expect(resolveArea(undefined, {})).toBe("rasht");
  });
  it("matches city and address independently, without relying on a business name", () => {
    expect(businessInArea(cafe, "tohid")).toBe(true);
    expect(businessInArea(cafe, "golsar")).toBe(true);
    expect(businessInArea(cafe, "imam-ali")).toBe(false);
    expect(businessInArea({ ...cafe, city: "تهران" }, "tohid")).toBe(false);
    expect(businessInArea({ ...cafe, name: "کافه توحید", searchText: "" }, "tohid")).toBe(false);
    expect(businessInArea({ ...cafe, city: "تهران" }, "all")).toBe(true);
  });
});
