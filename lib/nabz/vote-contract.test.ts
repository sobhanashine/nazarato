import { describe, expect, it, vi } from "vitest";
import {
  isSameOriginRequest,
  parseComparisonVoteInput,
  submitComparisonVote,
  type ComparisonVoteRepository,
} from "./vote-contract";

const WINNER_ID = "11111111-1111-4111-8111-111111111111";
const LOSER_ID = "22222222-2222-4222-8222-222222222222";

const validInput = {
  citySlug: "rasht",
  scenarioSlug: "date",
  winnerBusinessId: WINNER_ID,
  loserBusinessId: LOSER_ID,
  reasonText: "  فضای آرام‌تری داشت  ",
};

describe("parseComparisonVoteInput", () => {
  it("normalizes a valid Rasht vote at the request boundary", () => {
    expect(parseComparisonVoteInput(validInput)).toEqual({
      ok: true,
      value: {
        ...validInput,
        reasonText: "فضای آرام‌تری داشت",
      },
    });
  });

  it("rejects unknown fields, non-UUID IDs, duplicate choices, and unsupported scenarios", () => {
    const result = parseComparisonVoteInput({
      ...validInput,
      winnerBusinessId: "demo-place",
      loserBusinessId: "demo-place",
      scenarioSlug: "worst-business",
      copiedRating: 4.9,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.issues.map((issue) => issue.path)).toEqual(
      expect.arrayContaining([
        "copiedRating",
        "winnerBusinessId",
        "loserBusinessId",
        "scenarioSlug",
      ]),
    );
  });
});

describe("isSameOriginRequest", () => {
  it("accepts the product origin and rejects a cross-site POST", () => {
    expect(
      isSameOriginRequest(
        new Request("https://nazarato.ir/api/nabz/votes", {
          headers: { origin: "https://nazarato.ir" },
        }),
      ),
    ).toBe(true);

    expect(
      isSameOriginRequest(
        new Request("https://nazarato.ir/api/nabz/votes", {
          headers: { origin: "https://attacker.example" },
        }),
      ),
    ).toBe(false);
  });
});

describe("submitComparisonVote", () => {
  it("persists an eligible anonymous vote without exposing the raw cookie token", async () => {
    const insertVote = vi.fn().mockResolvedValue("inserted" as const);
    const repository: ComparisonVoteRepository = {
      areBusinessesPublicationApproved: vi.fn().mockResolvedValue(true),
      insertVote,
    };
    const parsed = parseComparisonVoteInput(validInput);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    const result = await submitComparisonVote(
      parsed.value,
      { kind: "anonymous", databaseSessionId: "hashed-session-id" },
      repository,
    );

    expect(result).toEqual({ ok: true, status: "inserted" });
    expect(insertVote).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: null,
        anonymous_session_id: "hashed-session-id",
      }),
    );
  });

  it("refuses votes when either business lacks publication approval", async () => {
    const insertVote = vi.fn();
    const repository: ComparisonVoteRepository = {
      areBusinessesPublicationApproved: vi.fn().mockResolvedValue(false),
      insertVote,
    };
    const parsed = parseComparisonVoteInput(validInput);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    const result = await submitComparisonVote(
      parsed.value,
      { kind: "user", userId: "user-id" },
      repository,
    );

    expect(result).toEqual({ ok: false, status: "ineligible" });
    expect(insertVote).not.toHaveBeenCalled();
  });
});
