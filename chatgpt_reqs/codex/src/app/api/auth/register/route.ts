import { NextResponse } from "next/server";

import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseJsonOrForm } from "@/lib/request";
import {
  createSession,
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
} from "@/lib/session";

export async function POST(request: Request) {
  const body = await parseJsonOrForm<{
    email?: string | null;
    password?: string | null;
    name?: string | null;
  }>(request);

  const email = body.email?.toLowerCase().trim();
  const password = body.password?.trim();
  const name = body.name?.trim() || null;

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 },
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return NextResponse.json(
      { error: "An account with that email already exists." },
      { status: 409 },
    );
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
