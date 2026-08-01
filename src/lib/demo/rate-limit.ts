import { DEMO_RATE_LIMIT_PER_HOUR } from "@/lib/demo/config";

/**
 * Per-IP ceiling on sandbox provisioning, mirroring `auth-rate-limit.ts`.
 *
 * In-memory and therefore per-instance — same trade-off the login limiter
 * already makes. It is one of three independent bounds (cookie reuse and the
 * global live-space cap are the others), so a serverless cold start letting a
 * few extra through is not a problem.
 */

type Bucket = { count: number; resetAt: number };

const WINDOW_MS = 60 * 60 * 1000;
const buckets = new Map<string, Bucket>();

export function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("cf-connecting-ip") ??
    "unknown"
  );
}

export function consumeDemoProvisionAllowance(ip: string) {
  const now = Date.now();
  const existing = buckets.get(`ip:${ip}`);
  const bucket =
    !existing || existing.resetAt <= now
      ? { count: 0, resetAt: now + WINDOW_MS }
      : existing;
  buckets.set(`ip:${ip}`, bucket);

  if (bucket.count >= DEMO_RATE_LIMIT_PER_HOUR) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}
