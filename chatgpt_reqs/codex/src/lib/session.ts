import crypto from "crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "cm_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not set");
  }
  return secret;
}

function signSession(payload: string, secret: string) {
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

export function createSessionToken(userId: string) {
  const issuedAt = Date.now();
  const payload = `${userId}.${issuedAt}`;
  const signature = signSession(payload, getSessionSecret());
  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string) {
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
  const expectedSignature = signSession(payload, getSessionSecret());
  if (!safeEqual(signature, expectedSignature)) {
    return null;
  }

  const ageSeconds = (Date.now() - issuedAt) / 1000;
  if (ageSeconds > SESSION_TTL_SECONDS) {
    return null;
  }

  return userId;
}

export async function getSessionUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }
  return verifySessionToken(token);
}
