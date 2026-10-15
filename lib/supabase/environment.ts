type Environment = Record<string, string | undefined>;

/** Production can never select the staging namespace; staging never falls back. */
export function databaseSchema(env: Environment, builtForStaging = false): "public" | "nazarato_staging" {
  const staging = builtForStaging || env.NAZARATO_DEPLOYMENT_ENV === "staging";
  if (staging) {
    if (env.NAZARATO_DATABASE_SCHEMA !== "nazarato_staging") {
      throw new Error("Staging requires its isolated database schema");
    }
    return "nazarato_staging";
  }
  if (env.NAZARATO_DATABASE_SCHEMA && env.NAZARATO_DATABASE_SCHEMA !== "public") {
    throw new Error("A non-staging runtime cannot select the staging schema");
  }
  return "public";
}

export function storageBucket(name: "claim-proofs" | "business-photos", env: Environment = process.env): string {
  return databaseSchema(env) === "nazarato_staging" ? `${name}-staging` : name;
}
