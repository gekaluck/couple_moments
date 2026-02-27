import crypto from "crypto";
import { prisma } from "./prisma";

const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

/**
 * Creates a password reset token for the given user.
 * Deletes any existing unused tokens for that user first.
 */
export async function createPasswordResetToken(userId: string): Promise<string> {
  // Invalidate existing tokens for this user before creating a new one.
  await prisma.passwordResetToken.deleteMany({ where: { userId, usedAt: null } });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS);

  await prisma.passwordResetToken.create({
    data: { token, userId, expiresAt },
  });

  return token;
}

/**
 * Validates a reset token. Returns the userId if valid, null otherwise.
 * A token is valid if it exists, has not been used, and has not expired.
 */
export async function validatePasswordResetToken(token: string): Promise<string | null> {
  const record = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!record) return null;
  if (record.usedAt) return null;
  if (record.expiresAt < new Date()) return null;

  return record.userId;
}
