import { createHash } from "node:crypto";
export const NABZ_ANONYMOUS_COOKIE = "nzr_nabz_session";
export function validAnonymousToken(value: string | undefined): value is string { return Boolean(value && /^[A-Za-z0-9_-]{32}$/.test(value)); }
export function hashAnonymousToken(token: string): string { return createHash("sha256").update(token).digest("hex"); }
