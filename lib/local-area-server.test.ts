import { describe, expect, it, vi } from "vitest";
const read = vi.hoisted(() => vi.fn());
vi.mock("next/headers", () => ({ cookies: read }));
import { getPreferredArea } from "./local-area-server";
describe("server location preference", () => {
  it("uses the stored area only when the URL has no explicit choice", async () => {
    read.mockResolvedValue({ get: () => ({ value: "tohid" }) });
    expect(await getPreferredArea()).toBe("tohid");
    read.mockClear();
    expect(await getPreferredArea("all")).toBe("all");
    expect(read).not.toHaveBeenCalled();
    expect(await getPreferredArea(["imam-ali", "all"])).toBe("imam-ali");
  });
});
