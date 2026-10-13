const PRODUCTION_PROJECT_REF = "sdlmjdxrfyhuiegjysac";

/** Only an explicitly selected, separate Supabase project can serve staging. */
export function assertStagingDatabaseIsolation(
  url: string,
  stagingProjectRef: string | undefined,
): void {
  if (
    !stagingProjectRef ||
    !/^[a-z]{20}$/.test(stagingProjectRef) ||
    stagingProjectRef === PRODUCTION_PROJECT_REF
  ) {
    throw new Error("Staging requires a separate NAZARATO_STAGING_SUPABASE_REF");
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
    throw new Error("Staging database URL does not match the isolated project");
  }
}
