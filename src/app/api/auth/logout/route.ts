import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { deleteSession, SESSION_COOKIE_NAME } from "@/lib/session";

// Ensure route runs dynamically on Node.js runtime (not edge/static)
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function logout(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await deleteSession(token);
  }

  const response = NextResponse.redirect(new URL("/logged-out", request.url), 303);
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
  return response;
}

export async function GET(request: Request) {
  return logout(request);
}

export async function POST(request: Request) {
  return logout(request);
}
