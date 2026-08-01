/**
 * Demo mode configuration.
 *
 * Every value is read from the environment so a deployment that has not opted
 * in has no demo surface at all: `/demo` 404s and nothing else changes.
 */

/** Reserved by RFC 2606 — can never collide with a real signup or receive mail. */
export const DEMO_EMAIL_DOMAIN = "demo.duet.invalid";

export const DEMO_SPACE_NAME = "Alex & Sam";

function readPositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function isDemoModeEnabled() {
  return process.env.DEMO_MODE_ENABLED === "true";
}

/**
 * How long a sandbox lives. Long enough that a link sent yesterday still works,
 * short enough to bound how much throwaway data can accumulate.
 */
export function demoTtlHours() {
  return readPositiveInt(process.env.DEMO_TTL_HOURS, 24);
}

/**
 * Ceiling on live sandboxes. Past this, `/demo` stops provisioning instead of
 * letting a shared link grow the database without bound.
 */
export function demoMaxLiveSpaces() {
  return readPositiveInt(process.env.DEMO_MAX_LIVE_SPACES, 500);
}

/** New sandboxes per IP per hour. */
export const DEMO_RATE_LIMIT_PER_HOUR = 5;
