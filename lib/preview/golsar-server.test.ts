import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getLocalGolsarCafes } from "./golsar-server";

const mocks = vi.hoisted(() => ({ readFile: vi.fn(), headers: vi.fn() }));
vi.mock("node:fs/promises", () => ({ readFile: mocks.readFile }));
vi.mock("next/headers", () => ({ headers: mocks.headers }));
const snapshot = { items: [{ google_place_id: "test-place-123", name: "کافه آزمایشی", source_url: "https://www.google.com/maps/", source_provider: "google_maps_via_apify", permission_basis: "unknown", publication_status: "not_approved", pilot_category_proposed: "cafe", latitude: 37.3, longitude: 49.58, captured_at: "2026-09-25T00:00:00Z" }] };

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("NAZARATO_LOCAL_PREVIEW", "true");
  mocks.headers.mockResolvedValue(new Headers({ host: "127.0.0.1:3016" }));
  mocks.readFile.mockResolvedValue(JSON.stringify(snapshot));
});
afterEach(() => vi.unstubAllEnvs());

describe("private catalog boundary", () => {
  it("reads validated data only in opted-in localhost development", async () => {
    expect(await getLocalGolsarCafes()).toMatchObject([{ id: "test-place-123", name: "کافه آزمایشی" }]);
    expect(mocks.readFile).toHaveBeenCalledTimes(1);
  });
  it("never reads the file or request headers in production, even with the flag", async () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(await getLocalGolsarCafes()).toBeNull();
    expect(mocks.readFile).not.toHaveBeenCalled();
    expect(mocks.headers).not.toHaveBeenCalled();
  });
  it("does not activate without the opt-in flag", async () => {
    vi.stubEnv("NAZARATO_LOCAL_PREVIEW", "false");
    expect(await getLocalGolsarCafes()).toBeNull();
    expect(mocks.headers).not.toHaveBeenCalled();
  });
  it("never reads the private file for a public Host", async () => {
    mocks.headers.mockResolvedValue(new Headers({ host: "nazarato.ir" }));
    expect(await getLocalGolsarCafes()).toBeNull();
    expect(mocks.readFile).not.toHaveBeenCalled();
  });
  it("returns an empty local catalog on invalid data, without fixture fallback", async () => {
    mocks.readFile.mockResolvedValue(JSON.stringify({ items: [] }));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await getLocalGolsarCafes()).toEqual([]);
    log.mockRestore();
  });
});
