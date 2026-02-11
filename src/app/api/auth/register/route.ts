import { NextResponse } from "next/server";
import { z } from "zod";

import { formatZodFieldErrors } from "@/lib/api-utils";
import {
  buildAuthErrorResponse,
  isFormSubmission,
  normalizeAuthRedirectPath,
} from "@/lib/auth-error-response";
import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseJsonOrForm } from "@/lib/request";
import {
  createSession,
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
} from "@/lib/session";

// Ensure route runs dynamically on Node.js runtime (not edge/static)
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RegisterErrorCode = "duplicate-email" | "invalid-input";

const REGISTER_ERROR_MESSAGES: Record<RegisterErrorCode, string> = {
  "duplicate-email": "An account with that email already exists.",
  "invalid-input": "Email and password are required.",
};

export async function POST(request: Request) {
  const body = await parseJsonOrForm<Record<string, unknown>>(request);
  const rawEmail =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const redirectTo = normalizeAuthRedirectPath(body.redirectTo);

  const schema = z.object({
    email: z.string().trim().email(),
    password: z.string().trim().min(1),
    name: z.string().trim().optional().nullable(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const errorMessage = formatZodFieldErrors(
      parsed.error,
      "Email and password are required.",
    );
    if (isFormSubmission(request)) {
      return buildAuthErrorResponse({
        request,
        formRedirectPath: "/register",
        errorCode: "invalid-input",
        status: 400,
        errorMessages: REGISTER_ERROR_MESSAGES,
        options: {
          email: rawEmail,
          redirectTo,
        },
      });
    }
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const password = parsed.data.password;
  const name = parsed.data.name?.trim() || null;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return buildAuthErrorResponse({
      request,
      formRedirectPath: "/register",
      errorCode: "duplicate-email",
      status: 409,
      errorMessages: REGISTER_ERROR_MESSAGES,
      options: {
        email,
        redirectTo,
      },
    });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
    },
  });

  // Create signed session token
  const token = await createSession(user.id);
  const redirectUrl = new URL(redirectTo ?? "/", request.url);
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
