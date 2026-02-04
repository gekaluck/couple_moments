import { NextResponse } from "next/server";
import { z } from "zod";

import { verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { parseJsonOrForm } from "@/lib/request";
import {
  createSession,
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
} from "@/lib/session";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!ip) {
    return NextResponse.json(
      { error: "Unable to determine client IP." },
      { status: 400 },
    );
  }
  const rateLimit = checkRateLimit(`auth:login:${ip}`, 5, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Try again shortly." },
      {
        status: 429,
        headers: {
          "Retry-After": rateLimit.retryAfterSeconds.toString(),
        },
      },
    );
  }

  const body = await parseJsonOrForm<Record<string, unknown>>(request);
  const schema = z.object({
    email: z.string().trim().email(),
    password: z.string().trim().min(1),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const issues = parsed.error.flatten().fieldErrors;
    const errorMessage =
      Object.values(issues).flat().join(" ") || "Email and password are required.";
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase();
  const password = parsed.data.password;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 },
    );
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 },
    );
  }

  // Create signed session token
  const token = await createSession(user.id);
  const redirectUrl = new URL("/", request.url);
  const response = NextResponse.redirect(redirectUrl, { status: 303 });

  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_MS / 1000,
    path: "/",
  });

  return response;
}
