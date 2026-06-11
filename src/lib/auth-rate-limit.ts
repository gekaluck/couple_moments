type AttemptBucket = {
  count: number;
  resetAt: number;
};

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

const buckets = new Map<string, AttemptBucket>();

function now() {
  return Date.now();
}

function getBucket(key: string) {
  const currentTime = now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= currentTime) {
    const freshBucket = { count: 0, resetAt: currentTime + WINDOW_MS };
    buckets.set(key, freshBucket);
    return freshBucket;
  }
  return bucket;
}

function retryAfterSeconds(bucket: AttemptBucket) {
  return Math.max(1, Math.ceil((bucket.resetAt - now()) / 1000));
}

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

export function checkLoginRateLimit(params: {
  ip: string;
  email?: string | null;
}) {
  const keys = [`ip:${params.ip}`];
  if (params.email) {
    keys.push(`account:${params.email.toLowerCase()}`);
  }

  for (const key of keys) {
    const bucket = getBucket(key);
    if (bucket.count >= MAX_ATTEMPTS) {
      return {
        limited: true,
        retryAfterSeconds: retryAfterSeconds(bucket),
      };
    }
  }

  return { limited: false, retryAfterSeconds: 0 };
}

export function recordFailedLoginAttempt(params: {
  ip: string;
  email?: string | null;
}) {
  const keys = [`ip:${params.ip}`];
  if (params.email) {
    keys.push(`account:${params.email.toLowerCase()}`);
  }

  for (const key of keys) {
    getBucket(key).count += 1;
  }
}

export function resetLoginRateLimit(params: {
  ip: string;
  email?: string | null;
}) {
  buckets.delete(`ip:${params.ip}`);
  if (params.email) {
    buckets.delete(`account:${params.email.toLowerCase()}`);
  }
}
