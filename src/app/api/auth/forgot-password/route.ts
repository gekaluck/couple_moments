import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPasswordResetToken } from "@/lib/password-reset";
import { sendEmail } from "@/lib/email";

// Always return the same message regardless of whether the email exists,
// to avoid leaking registered email addresses.
const GENERIC_MESSAGE =
  "If that email address is registered, you'll receive a reset link shortly.";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getResetBaseUrl(): string {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_APP_URL must be set in production.");
  }

  return "http://localhost:3000";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const email =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : null;

    if (!email) {
      return NextResponse.json({ message: GENERIC_MESSAGE }, { status: 200 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true },
    });

    // Respond identically whether or not the user exists.
    if (!user) {
      return NextResponse.json({ message: GENERIC_MESSAGE }, { status: 200 });
    }

    const token = await createPasswordResetToken(user.id);

    // Never derive the reset URL from request headers to avoid host header injection.
    const baseUrl = getResetBaseUrl();
    const resetUrl = `${baseUrl}/reset-password/${token}`;
    const displayName = escapeHtml(user.name?.trim() || "there");

    const emailResult = await sendEmail({
      to: user.email,
      subject: "Reset your Duet password",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
          <p>Hi ${displayName},</p>
          <p>We received a request to reset your Duet password.</p>
          <p style="margin:24px 0;">
            <a href="${resetUrl}"
               style="background:#e11d48;color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:600;display:inline-block;">
              Reset password
            </a>
          </p>
          <p style="color:#6b7280;font-size:14px;">
            This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.
          </p>
          <p style="color:#6b7280;font-size:14px;">— The Duet team</p>
        </div>
      `,
      text: `Reset your Duet password: ${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`,
    });

    if (!emailResult.success) {
      throw new Error(emailResult.error ?? "Email delivery failed.");
    }

    return NextResponse.json({ message: GENERIC_MESSAGE }, { status: 200 });
  } catch (err) {
    console.error("[forgot-password]", err);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
