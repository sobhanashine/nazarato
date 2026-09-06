import { beforeEach, describe, expect, it, vi } from "vitest";

type QueryCall = {
  table: string;
  method: string;
  args: readonly unknown[];
};

type Query = PromiseLike<unknown> & {
  select(value: string): Query;
  eq(column: string, value: unknown): Query;
  neq(column: string, value: unknown): Query;
  in(column: string, values: readonly unknown[]): Query;
  gte(column: string, value: number): Query;
  limit(value: number): Query;
};

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  calls: [] as QueryCall[],
  responses: new Map<string, unknown>(),
}));

vi.mock("@/lib/supabase/server", () => ({
  supabaseAdmin: () => ({ from: mocks.from }),
}));

import { getSupabaseNabzBusinessPool } from "./supabase-business-pool";

function createQuery(table: string): Query {
  const record = (method: string, args: readonly unknown[]) => {
    mocks.calls.push({ table, method, args });
    return query;
  };
  const query: Query = {
    select: (value) => record("select", [value]),
    eq: (column, value) => record("eq", [column, value]),
    neq: (column, value) => record("neq", [column, value]),
    in: (column, values) => record("in", [column, values]),
    gte: (column, value) => record("gte", [column, value]),
    limit: (value) => record("limit", [value]),
    then: (resolve, reject) =>
      Promise.resolve(mocks.responses.get(table)).then(resolve, reject),
  };
  return query;
}

function approvedBusiness(id: string) {
  return {
    id,
    slug: `business-${id}`,
    name: `کسب‌وکار ${id}`,
    category_slug: "cafe",
    city: "رشت",
    status: "active",
    neighborhood_slug: "golsar",
    latitude: 37.28,
    longitude: 49.58,
    price_band: 2,
    contact: {},
    business_sources: [
      {
        status: "approved",
        field_payload: {
          name: `کسب‌وکار ${id}`,
          category_slug: "cafe",
          city: "رشت",
          neighborhood_slug: "golsar",
        },
      },
    ],
  };
}

describe("getSupabaseNabzBusinessPool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.calls.length = 0;
    mocks.responses.clear();
    mocks.from.mockImplementation((table: string) => createQuery(table));
  });

  it("reads only approved active Rasht food businesses and accepted first-party evidence", async () => {
    mocks.responses.set("businesses", {
      data: [approvedBusiness("a"), approvedBusiness("b")],
      error: null,
    });
    mocks.responses.set("comparison_votes", { data: [], error: null });
    mocks.responses.set("reviews", { data: [], error: null });

    await expect(getSupabaseNabzBusinessPool()).resolves.toEqual(
      expect.objectContaining({
        status: "ready",
        summary: expect.objectContaining({ duelReadyBusinessCount: 2 }),
      }),
    );

    expect(mocks.from).toHaveBeenCalledWith("businesses");
    expect(mocks.from).toHaveBeenCalledWith("comparison_votes");
    expect(mocks.from).toHaveBeenCalledWith("reviews");
    expect(mocks.calls).toContainEqual({
      table: "businesses",
      method: "eq",
      args: ["status", "active"],
    });
    expect(mocks.calls).toContainEqual({
      table: "businesses",
      method: "eq",
      args: ["city", "رشت"],
    });
    expect(mocks.calls).toContainEqual({
      table: "businesses",
      method: "eq",
      args: ["business_sources.status", "approved"],
    });
    expect(mocks.calls).toContainEqual({
      table: "businesses",
      method: "in",
      args: ["category_slug", ["cafe", "restaurant"]],
    });
    expect(mocks.calls).toContainEqual({
      table: "comparison_votes",
      method: "eq",
      args: ["moderation_status", "accepted"],
    });
    expect(mocks.calls).toContainEqual({
      table: "reviews",
      method: "eq",
      args: ["status", "published"],
    });
    expect(mocks.calls).toContainEqual({
      table: "reviews",
      method: "gte",
      args: ["review_analyses.confidence", 0.55],
    });
    expect(
      mocks.calls.find(
        (call) => call.table === "businesses" && call.method === "select",
      )?.args[0],
    ).toEqual(expect.stringContaining("business_sources!inner"));
  });

  it("returns unavailable and does not query signals when the provenance read fails", async () => {
    mocks.responses.set("businesses", {
      data: null,
      error: { message: "relation unavailable" },
    });

    await expect(getSupabaseNabzBusinessPool()).resolves.toEqual(
      expect.objectContaining({ status: "unavailable" }),
    );
    expect(mocks.from).toHaveBeenCalledTimes(1);
  });
});
