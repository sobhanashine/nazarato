export type SerializableSubscription = { endpoint: string; keys: { p256dh: string; auth: string } };

export function isPushEndpoint(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 2048) return false;
  try {
    const url = new URL(value);
    const hosts = ["fcm.googleapis.com", "updates.push.services.mozilla.com", "web.push.apple.com"];
    return url.protocol === "https:" && !url.username && !url.password && !url.port && !url.hash
      && (hosts.includes(url.hostname) || url.hostname.endsWith(".notify.windows.com"));
  } catch { return false; }
}
function isKey(value: unknown, bytes: number): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]+={0,2}$/.test(value) && value.length <= 100
    && Buffer.from(value,"base64url").length === bytes;
}
export function parseSubscription(value: unknown): SerializableSubscription | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (!isPushEndpoint(v.endpoint) || !v.keys || typeof v.keys !== "object") return null;
  const k = v.keys as Record<string, unknown>;
  if (!isKey(k.p256dh,65) || Buffer.from(k.p256dh,"base64url")[0] !== 4 || !isKey(k.auth,16)) return null;
  return { endpoint: v.endpoint, keys: { p256dh: k.p256dh, auth: k.auth } };
}
