import { expect, it } from "vitest";
import { POST } from "./route";

it("rejects retired audio submissions without returning a transcript", async () => {
  const response = POST();
  expect(response.status).toBe(410);
  expect(await response.text()).toBe("");
});
