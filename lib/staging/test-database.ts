import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import type { StagingDatabase, Statement } from "./database";

type SqlValue = string | number | null;
interface SQLite {
  exec(sql: string): void;
  close(): void;
  prepare(sql: string): {
    get(...values: SqlValue[]): unknown;
    all(...values: SqlValue[]): unknown[];
    run(...values: SqlValue[]): { changes: number | bigint };
  };
}

/** Execute the real migration and queries locally; never contacts Cloudflare. */
export function testDatabase(): StagingDatabase & { close(): void } {
  const { DatabaseSync } = createRequire(import.meta.url)("node:sqlite") as {
    DatabaseSync: new (path: string) => SQLite;
  };
  const db = new DatabaseSync(":memory:");
  db.exec(readFileSync(new URL("../../cloudflare/migrations/202610150001_create_staging_services.sql", import.meta.url), "utf8"));
  const prepare = (sql: string): Statement => {
    let values: SqlValue[] = [];
    const statement: Statement = {
      bind(...input) { values = input; return statement; },
      async first<T>() { return (db.prepare(sql).get(...values) as T | undefined) ?? null; },
      async all<T>() { return { results: db.prepare(sql).all(...values) as T[] }; },
      async run() { return { meta: { changes: Number(db.prepare(sql).run(...values).changes) } }; },
    };
    return statement;
  };
  return {
    prepare,
    async batch(statements) {
      db.exec("BEGIN");
      try { const result = await Promise.all(statements.map((s) => s.run())); db.exec("COMMIT"); return result; }
      catch (error) { db.exec("ROLLBACK"); throw error; }
    },
    close() { db.close(); },
  };
}
