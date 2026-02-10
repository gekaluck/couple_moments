import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { internalServerError, requireApiUserId } from "@/lib/api-utils";
import { generateAuthUrl } from "@/lib/integrations/google/calendar";

/**
 * GET /api/integrations/google/start
 * Initiates Google OAuth flow
 */
export async function GET() {
  try {
    // Verify user is authenticated
    const auth = await requireApiUserId();
    if (!auth.ok) {
      return auth.response;
    }
    // Generate a random state parameter for CSRF protection
    const state = crypto.randomBytes(32).toString("hex");
    
    // Store state in a signed cookie (expires in 10 minutes)
    const cookieStore = await cookies();
    cookieStore.set("google_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 10 * 60, // 10 minutes
      path: "/",
    });
    
    // Generate OAuth URL
    const authUrl = generateAuthUrl(state);
    
    // Redirect to Google OAuth consent screen
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Error starting Google OAuth:", error);
    return internalServerError("Failed to start authorization flow");
  }
}
