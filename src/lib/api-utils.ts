import { NextResponse } from "next/server";
import { z } from "zod";

import { getSessionUserId } from "@/lib/session";

type AuthSuccess = {
  ok: true;
  userId: string;
};

type AuthFailure = {
  ok: false;
  response: NextResponse;
};

type ParseSuccess<T> = {
  data: T;
  response: null;
};

type ParseFailure = {
  data: null;
  response: NextResponse;
};

export function apiError(message: string, status: number, details?: unknown) {
  const payload = details === undefined ? { error: message } : { error: message, details };
  return NextResponse.json(payload, { status });
}

export function badRequest(message = "Invalid request.", details?: unknown) {
  return apiError(message, 400, details);
}

export function unauthorized(message = "Unauthorized.") {
  return apiError(message, 401);
}

export function forbidden(message = "Forbidden.") {
  return apiError(message, 403);
}

export function notFound(message = "Not found.") {
  return apiError(message, 404);
}

export function conflict(message = "Conflict.") {
  return apiError(message, 409);
}

export function internalServerError(message = "Internal server error.", details?: unknown) {
  return apiError(message, 500, details);
}

export async function requireApiUserId() {
  const userId = await getSessionUserId();
  if (!userId) {
    return {
      ok: false,
      response: unauthorized(),
    } satisfies AuthFailure;
  }
  return {
    ok: true,
    userId,
  } satisfies AuthSuccess;
}

export function formatZodFieldErrors(error: z.ZodError, fallback = "Invalid input.") {
  const issues = error.flatten().fieldErrors;
  return Object.values(issues).flat().join(" ") || fallback;
}

export function parseOrBadRequest<T>(
  schema: z.ZodType<T>,
  payload: unknown,
  message = "Invalid request.",
): ParseSuccess<T> | ParseFailure {
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return {
      data: null,
      response: badRequest(message),
    };
  }
  return {
    data: parsed.data,
    response: null,
  };
}
