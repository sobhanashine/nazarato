export type OtpSendLimitResult =
  | { allowed: true }
  | {
      allowed: false;
      reason: "cooldown" | "window_limit";
      retryAfterSeconds: number;
    };

type Entry = {
  windowStartedAt: number;
  lastSentAt: number;
  sends: number;
};

type OtpSendRateLimiterOptions = {
  cooldownMs: number;
  windowMs: number;
  maxSends: number;
  maxEntries: number;
};

/**
 * Bounded pilot-stage abuse control. It protects a single app process; a
 * shared Redis/DB limiter remains necessary before multi-instance scale.
 */
export class OtpSendRateLimiter {
  private readonly entries = new Map<string, Entry>();

  constructor(private readonly options: OtpSendRateLimiterOptions) {}

  get size(): number {
    return this.entries.size;
  }

  consume(key: string, now = Date.now()): OtpSendLimitResult {
    this.prune(now);
    const current = this.entries.get(key);

    if (current && now - current.lastSentAt < this.options.cooldownMs) {
      return {
        allowed: false,
        reason: "cooldown",
        retryAfterSeconds: Math.ceil(
          (this.options.cooldownMs - (now - current.lastSentAt)) / 1_000,
        ),
      };
    }

    if (current && now - current.windowStartedAt < this.options.windowMs) {
      if (current.sends >= this.options.maxSends) {
        return {
          allowed: false,
          reason: "window_limit",
          retryAfterSeconds: Math.ceil(
            (this.options.windowMs - (now - current.windowStartedAt)) / 1_000,
          ),
        };
      }
      this.entries.set(key, {
        ...current,
        lastSentAt: now,
        sends: current.sends + 1,
      });
      return { allowed: true };
    }

    if (this.entries.size >= this.options.maxEntries) {
      const oldestKey = this.entries.keys().next().value;
      if (typeof oldestKey === "string") this.entries.delete(oldestKey);
    }
    this.entries.set(key, { windowStartedAt: now, lastSentAt: now, sends: 1 });
    return { allowed: true };
  }

  private prune(now: number): void {
    for (const [key, entry] of this.entries) {
      if (now - entry.windowStartedAt >= this.options.windowMs) {
        this.entries.delete(key);
      }
    }
  }
}
