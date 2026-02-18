import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPasswordResetToken } from "@/lib/password-reset";
import { sendEmail } from "@/lib/email";

// Always return the same message regardless of whether the email exists,
// to avoid leaking registered email addresses.
const GENERIC_MESSAGE =
  "If that email address is registered, you'll receive a reset link shortly.";

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

    // Build the reset URL. NEXT_PUBLIC_APP_URL must be set in production.
    const host = req.headers.get("host") ?? "localhost:3000";
    const protocol = host.startsWith("localhost") ? "http" : "https";
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? `${protocol}://${host}`;
    const resetUrl = `${baseUrl}/reset-password/${token}`;

    await sendEmail({
      to: user.email,
      subject: "Reset your Duet password",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
          <p>Hi ${user.name ?? "there"},</p>
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

    return NextResponse.json({ message: GENERIC_MESSAGE }, { status: 200 });
  } catch (err) {
    console.error("[forgot-password]", err);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
