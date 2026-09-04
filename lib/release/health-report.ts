export type DatabaseHealth = "ok" | "unconfigured" | "error";
export type NazaratoDataMode = "fictional-demo" | "pilot" | "production";

export type HealthReport = {
  schemaVersion: 1;
  service: "nazarato";
  ok: boolean;
  releaseSha: string | "unknown";
  environment: "development" | "preview" | "production" | "test" | "unknown";
  database: DatabaseHealth;
  demoMode: boolean;
  checkedAt: string;
};

type HealthEnvironment = Readonly<Record<string, string | undefined>>;

type BuildHealthReportInput = {
  env: HealthEnvironment;
  dataMode: NazaratoDataMode;
  probeDatabase: () => Promise<void>;
  now?: () => Date;
};

const RELEASE_SHA_KEYS = [
  "RELEASE_SHA",
  "VERCEL_GIT_COMMIT_SHA",
  "GITHUB_SHA",
] as const;

const RELEASE_SHA_PATTERN = /^[0-9a-f]{7,64}$/i;

export function resolveReleaseSha(env: HealthEnvironment): string | "unknown" {
  for (const key of RELEASE_SHA_KEYS) {
    const value = env[key]?.trim();
    if (value && RELEASE_SHA_PATTERN.test(value)) {
      return value.toLowerCase();
    }
  }
  return "unknown";
}

function resolveEnvironment(
  env: HealthEnvironment,
): HealthReport["environment"] {
  const value = env.VERCEL_ENV ?? env.NODE_ENV;
  if (
    value === "development" ||
    value === "preview" ||
    value === "production" ||
    value === "test"
  ) {
    return value;
  }
  return "unknown";
}

function hasDatabaseConfiguration(env: HealthEnvironment): boolean {
  return Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
}

export async function buildHealthReport({
  env,
  dataMode,
  probeDatabase,
  now = () => new Date(),
}: BuildHealthReportInput): Promise<HealthReport> {
  const releaseSha = resolveReleaseSha(env);
  let database: DatabaseHealth = "unconfigured";

  if (hasDatabaseConfiguration(env)) {
    try {
      await probeDatabase();
      database = "ok";
    } catch {
      database = "error";
    }
  }

  const demoMode = dataMode === "fictional-demo";
  return {
    schemaVersion: 1,
    service: "nazarato",
    ok: releaseSha !== "unknown" && database === "ok" && !demoMode,
    releaseSha,
    environment: resolveEnvironment(env),
    database,
    demoMode,
    checkedAt: now().toISOString(),
  };
}
