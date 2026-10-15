export interface Statement {
  bind(...values: (string | number | null)[]): Statement;
  first<T>(): Promise<T | null>;
  all<T>(): Promise<{ results: T[] }>;
  run(): Promise<{ meta: { changes: number } }>;
}
export interface StagingDatabase {
  prepare(sql: string): Statement;
  batch(statements: Statement[]): Promise<unknown[]>;
}

/** No production fallback: operational staging state must stay isolated. */
export async function stagingDatabase(): Promise<StagingDatabase> {
  if (process.env.NAZARATO_DEPLOYMENT_ENV !== "staging") throw new Error("Staging database is unavailable outside staging");
  const { getCloudflareContext } = await import("@opennextjs/cloudflare");
  const { env } = await getCloudflareContext({ async: true });
  const bindings = env as unknown as { STAGING_SERVICES?: StagingDatabase };
  if (!bindings.STAGING_SERVICES) throw new Error("Staging services binding is missing");
  return bindings.STAGING_SERVICES;
}

/** One atomic statement; multiple isolates cannot reset the send/guess budget. */
export async function consumeLimit(db: StagingDatabase, key: string, maximum: number, windowMs: number, cooldownMs = 0, now = Date.now()): Promise<boolean> {
  if (key.endsWith(":global")) await db.prepare("DELETE FROM rate_limits WHERE last_used_at<?").bind(now - 86_400_000).run();
  const row = await db.prepare(`INSERT INTO rate_limits (key, window_started_at, last_used_at, hits)
    VALUES (?, ?, ?, 1) ON CONFLICT(key) DO UPDATE SET
    hits = CASE WHEN window_started_at <= ? THEN 1 ELSE hits + 1 END,
    window_started_at = CASE WHEN window_started_at <= ? THEN ? ELSE window_started_at END,
    last_used_at = ?
    WHERE last_used_at <= ? AND (window_started_at <= ? OR hits < ?)
    RETURNING key`).bind(key, now, now, now - windowMs, now - windowMs, now, now, now - cooldownMs, now - windowMs, maximum).first<{ key: string }>();
  return row !== null;
}
