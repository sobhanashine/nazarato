const PRODUCTION_PROJECT_REF = "sdlmjdxrfyhuiegjysac";

/** The target and sharing mode must both be explicitly selected for staging. */
export function assertStagingDatabaseIsolation(
  url: string,
  stagingProjectRef: string | undefined,
  mode: string | undefined = "isolated",
): void {
  const sharedMain = mode === "shared-main";
  if (
    !stagingProjectRef ||
    !/^[a-z]{20}$/.test(stagingProjectRef) ||
    (mode !== "isolated" && !sharedMain) ||
    (sharedMain
      ? stagingProjectRef !== PRODUCTION_PROJECT_REF
      : stagingProjectRef === PRODUCTION_PROJECT_REF)
  ) {
    throw new Error("Staging database target does not match its explicit sharing mode");
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid staging database URL");
  }
  if (
    parsed.origin !== `https://${stagingProjectRef}.supabase.co` ||
    parsed.username || parsed.password || parsed.pathname !== "/" ||
    parsed.search || parsed.hash
  ) {
    throw new Error("Staging database URL does not match the selected project");
  }
}
