import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware auth guard
 * 
 * Checks for presence of cm_session cookie on protected routes.
 * This is a safety net - individual pages/API routes still enforce
 * authorization with requireUserId() and space membership checks.
 */
export function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get("cm_session");
  const { pathname, search } = request.nextUrl;

  // If no session cookie exists, block access
  if (!sessionToken) {
    // For API routes, return 401
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // For page routes, redirect to login
    const loginUrl = new URL("/login", request.url);
    const redirectTo = `${pathname}${search}`;
    loginUrl.searchParams.set("redirect", redirectTo);
    return NextResponse.redirect(loginUrl);
  }

  // Allow request to continue
  return NextResponse.next();
}

/**
 * Configure which routes this middleware runs on
 */
export const config = {
  matcher: [
    "/feedback",
    "/spaces/:path*",
    "/events/:path*",
    "/api/couple-spaces/:path*",
    "/api/spaces/:path*",
  ],
};
