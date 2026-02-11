import { NextResponse } from "next/server";
import { z } from "zod";

import { formatZodFieldErrors } from "@/lib/api-utils";
import {
  buildAuthErrorResponse,
  isFormSubmission,
} from "@/lib/auth-error-response";
import { verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseJsonOrForm } from "@/lib/request";
import {
  createSession,
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
} from "@/lib/session";

type LoginErrorCode = "invalid-credentials" | "invalid-input";

const LOGIN_ERROR_MESSAGES: Record<LoginErrorCode, string> = {
  "invalid-credentials": "Invalid email or password.",
  "invalid-input": "Email and password are required.",
};

export async function POST(request: Request) {
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
      return buildAuthErrorResponse({
        request,
        formRedirectPath: "/login",
        errorCode: "invalid-input",
        status: 400,
        errorMessages: LOGIN_ERROR_MESSAGES,
        options: {
          email: rawEmail,
        },
      });
    }
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const password = parsed.data.password;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return buildAuthErrorResponse({
      request,
      formRedirectPath: "/login",
      errorCode: "invalid-credentials",
      status: 401,
      errorMessages: LOGIN_ERROR_MESSAGES,
      options: {
        email,
      },
    });
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return buildAuthErrorResponse({
      request,
      formRedirectPath: "/login",
      errorCode: "invalid-credentials",
      status: 401,
      errorMessages: LOGIN_ERROR_MESSAGES,
      options: {
        email,
      },
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
