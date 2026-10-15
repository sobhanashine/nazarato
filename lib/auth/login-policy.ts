type Environment = Record<string, string | undefined>;

export function isStaging(env: Environment = process.env): boolean {
  return env.NAZARATO_DEPLOYMENT_ENV === "staging";
}

export function isLoginEnabled(env: Environment = process.env): boolean {
  if (isStaging(env)) {
    return env.NODE_ENV === "production" && env.NAZARATO_SMS_ENABLED === "true"
      && Boolean(env.KAVENEGAR_API_KEY?.trim() && env.KAVENEGAR_TEMPLATE?.trim())
      && (env.JWT_SECRET?.length ?? 0) >= 32;
  }
  return env.NODE_ENV === "development";
}
