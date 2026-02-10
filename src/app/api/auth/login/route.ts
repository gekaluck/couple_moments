import { NextResponse } from "next/server";
import { z } from "zod";

import { formatZodFieldErrors } from "@/lib/api-utils";
import { verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { parseJsonOrForm } from "@/lib/request";
import {
  createSession,
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
} from "@/lib/session";

type LoginErrorCode =
  | "invalid-credentials"
  | "invalid-input"
  | "ip-unavailable"
  | "rate-limited";

function getLoginErrorMessage(errorCode: LoginErrorCode) {
  if (errorCode === "invalid-credentials") {
    return "Invalid email or password.";
  }
  if (errorCode === "invalid-input") {
    return "Email and password are required.";
  }
  if (errorCode === "ip-unavailable") {
    return "Unable to determine client IP.";
  }
  return "Too many login attempts. Try again shortly.";
}

function isFormSubmission(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  return (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  );
}

function buildLoginErrorResponse(
  request: Request,
  errorCode: LoginErrorCode,
  status: number,
  options?: { email?: string; retryAfterSeconds?: number },
) {
  if (isFormSubmission(request)) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("error", errorCode);
    if (options?.email) {
      redirectUrl.searchParams.set("email", options.email);
    }
    if (options?.retryAfterSeconds) {
      redirectUrl.searchParams.set(
        "retryAfter",
        options.retryAfterSeconds.toString(),
      );
    }
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  return NextResponse.json(
    { error: getLoginErrorMessage(errorCode) },
    {
      status,
      headers: options?.retryAfterSeconds
        ? { "Retry-After": options.retryAfterSeconds.toString() }
        : undefined,
    },
  );
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!ip) {
    return buildLoginErrorResponse(request, "ip-unavailable", 400);
  }
  const rateLimit = checkRateLimit(`auth:login:${ip}`, 5, 60_000);
  if (!rateLimit.allowed) {
    return buildLoginErrorResponse(request, "rate-limited", 429, {
      retryAfterSeconds: rateLimit.retryAfterSeconds,
    });
  }

  const body = await parseJsonOrForm<Record<string, unknown>>(request);
  const rawEmail =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  const schema = z.object({
    email: z.string().trim().email(),
    password: z.string().trim().min(1),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const errorMessage = formatZodFieldErrors(
      parsed.error,
      "Email and password are required.",
    );
    if (isFormSubmission(request)) {
      return buildLoginErrorResponse(request, "invalid-input", 400, {
        email: rawEmail,
      });
    }
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
    return buildLoginErrorResponse(request, "invalid-credentials", 401, {
      email,
    });
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return buildLoginErrorResponse(request, "invalid-credentials", 401, {
      email,
    });
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
