import crypto from "crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "cm_session";
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET ?? "dev-secret-change-in-production";
  return secret;
}

function signPayload(payload: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(aBuf, bBuf);
}

/**
 * Create a signed session token (no database required)
 */
export function createSession(userId: string): string {
  const issuedAt = Date.now();
  const payload = `${userId}.${issuedAt}`;
  const signature = signPayload(payload, getSessionSecret());
  return `${payload}.${signature}`;
}

/**
 * Verify a signed session token and return the user ID if valid
 */
export function verifySession(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  const [userId, issuedAtRaw, signature] = parts;
  const issuedAt = Number(issuedAtRaw);
  if (!userId || Number.isNaN(issuedAt)) {
    return null;
  }

  const payload = `${userId}.${issuedAtRaw}`;
  const expectedSignature = signPayload(payload, getSessionSecret());
  if (!safeEqual(signature, expectedSignature)) {
    return null;
  }

  const ageMs = Date.now() - issuedAt;
  if (ageMs > SESSION_TTL_MS) {
    return null;
  }

  return userId;
}

/**
 * Get the current user ID from the session cookie
 */
export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }
  return verifySession(token);
}

/**
 * Set the session cookie
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_TTL_MS / 1000,
    path: "/",
  });
}

/**
 * Clear the session cookie
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
