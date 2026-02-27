import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validatePasswordResetToken } from "@/lib/password-reset";
import { hashPassword } from "@/lib/auth";
import { clearSessionCookie } from "@/lib/session";

const MIN_PASSWORD_LENGTH = 8;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const token = typeof body?.token === "string" ? body.token.trim() : null;
    const password = typeof body?.password === "string" ? body.password : null;

    if (!token || !password) {
      return NextResponse.json({ message: "Invalid request." }, { status: 400 });
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
        { status: 400 },
      );
    }

    const userId = await validatePasswordResetToken(token);
    if (!userId) {
      return NextResponse.json(
        { message: "This reset link is invalid or has expired." },
        { status: 400 },
      );
    }

    const passwordHash = await hashPassword(password);

    // Update password, mark token as used, and invalidate all existing sessions
    // in a single transaction so the user must log in fresh.
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { token },
        data: { usedAt: new Date() },
      }),
      prisma.session.deleteMany({ where: { userId } }),
    ]);

    // Clear the current browser session cookie if present.
    await clearSessionCookie();

    return NextResponse.json(
      { message: "Password updated successfully." },
      { status: 200 },
    );
  } catch (err) {
    console.error("[reset-password]", err);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
