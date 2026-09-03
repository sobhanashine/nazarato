export const COMPARISON_SCENARIOS = [
  "date",
  "laptop",
  "budget",
  "local-food",
] as const;

export type ComparisonScenario = (typeof COMPARISON_SCENARIOS)[number];

export interface ComparisonVoteInput {
  citySlug: "rasht";
  scenarioSlug: ComparisonScenario;
  winnerBusinessId: string;
  loserBusinessId: string;
  reasonText?: string;
}

export interface ComparisonVoteIssue {
  path: string;
  message: string;
}

export type ParseComparisonVoteResult =
  | { ok: true; value: ComparisonVoteInput }
  | { ok: false; issues: readonly ComparisonVoteIssue[] };

export type ComparisonVoteIdentity =
  | { kind: "user"; userId: string }
  | { kind: "anonymous"; databaseSessionId: string };

export interface ComparisonVoteRow {
  user_id: string | null;
  anonymous_session_id: string | null;
  city_slug: "rasht";
  scenario_slug: ComparisonScenario;
  winner_business_id: string;
  loser_business_id: string;
  reason_text: string | null;
}

export interface ComparisonVoteRepository {
  areBusinessesPublicationApproved(
    winnerBusinessId: string,
    loserBusinessId: string,
  ): Promise<boolean>;
  insertVote(row: ComparisonVoteRow): Promise<"inserted" | "duplicate">;
}

export type SubmitComparisonVoteResult =
  | { ok: true; status: "inserted" | "duplicate" }
  | { ok: false; status: "ineligible" };

const ALLOWED_KEYS = new Set([
  "citySlug",
  "scenarioSlug",
  "winnerBusinessId",
  "loserBusinessId",
  "reasonText",
]);

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isScenario(value: unknown): value is ComparisonScenario {
  return (
    typeof value === "string" &&
    COMPARISON_SCENARIOS.some((scenario) => scenario === value)
  );
}

export function parseComparisonVoteInput(
  value: unknown,
): ParseComparisonVoteResult {
  if (!isRecord(value)) {
    return {
      ok: false,
      issues: [{ path: "body", message: "درخواست باید یک شیء JSON باشد." }],
    };
  }

  const issues: ComparisonVoteIssue[] = [];
  for (const key of Object.keys(value)) {
    if (!ALLOWED_KEYS.has(key)) {
      issues.push({ path: key, message: "فیلد پشتیبانی نمی‌شود." });
    }
  }

  const citySlug = value.citySlug;
  if (citySlug !== "rasht") {
    issues.push({ path: "citySlug", message: "در این نسخه فقط رشت پشتیبانی می‌شود." });
  }

  const scenarioSlug = value.scenarioSlug;
  if (!isScenario(scenarioSlug)) {
    issues.push({ path: "scenarioSlug", message: "موقعیت انتخاب‌شده معتبر نیست." });
  }

  const winnerBusinessId = value.winnerBusinessId;
  if (typeof winnerBusinessId !== "string" || !UUID_PATTERN.test(winnerBusinessId)) {
    issues.push({ path: "winnerBusinessId", message: "شناسه انتخاب برنده معتبر نیست." });
  }

  const loserBusinessId = value.loserBusinessId;
  if (typeof loserBusinessId !== "string" || !UUID_PATTERN.test(loserBusinessId)) {
    issues.push({ path: "loserBusinessId", message: "شناسه انتخاب دیگر معتبر نیست." });
  }

  if (
    typeof winnerBusinessId === "string" &&
    typeof loserBusinessId === "string" &&
    winnerBusinessId === loserBusinessId
  ) {
    issues.push({ path: "loserBusinessId", message: "دو طرف مقایسه باید متفاوت باشند." });
  }

  const rawReason = value.reasonText;
  let reasonText: string | undefined;
  if (rawReason !== undefined && rawReason !== null && rawReason !== "") {
    if (typeof rawReason !== "string") {
      issues.push({ path: "reasonText", message: "دلیل باید متن باشد." });
    } else {
      const normalized = rawReason.trim();
      if (normalized.length === 0 || normalized.length > 120) {
        issues.push({ path: "reasonText", message: "دلیل باید بین ۱ تا ۱۲۰ نویسه باشد." });
      } else {
        reasonText = normalized;
      }
    }
  }

  if (
    issues.length > 0 ||
    citySlug !== "rasht" ||
    !isScenario(scenarioSlug) ||
    typeof winnerBusinessId !== "string" ||
    typeof loserBusinessId !== "string"
  ) {
    return { ok: false, issues };
  }

  return {
    ok: true,
    value: {
      citySlug,
      scenarioSlug,
      winnerBusinessId,
      loserBusinessId,
      ...(reasonText ? { reasonText } : {}),
    },
  };
}

/** Raw vote POSTs are browser-only in this MVP, so an exact Origin match is required. */
export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) {
    return false;
  }

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export async function submitComparisonVote(
  input: ComparisonVoteInput,
  identity: ComparisonVoteIdentity,
  repository: ComparisonVoteRepository,
): Promise<SubmitComparisonVoteResult> {
  const eligible = await repository.areBusinessesPublicationApproved(
    input.winnerBusinessId,
    input.loserBusinessId,
  );
  if (!eligible) {
    return { ok: false, status: "ineligible" };
  }

  const status = await repository.insertVote({
    user_id: identity.kind === "user" ? identity.userId : null,
    anonymous_session_id:
      identity.kind === "anonymous" ? identity.databaseSessionId : null,
    city_slug: input.citySlug,
    scenario_slug: input.scenarioSlug,
    winner_business_id: input.winnerBusinessId,
    loser_business_id: input.loserBusinessId,
    reason_text: input.reasonText ?? null,
  });

  return { ok: true, status };
}
