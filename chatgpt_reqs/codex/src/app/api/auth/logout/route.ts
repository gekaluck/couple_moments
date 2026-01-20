import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/session";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/logged-out", request.url));
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
  return response;
}
