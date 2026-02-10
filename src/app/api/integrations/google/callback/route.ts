import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getSessionUserId } from '@/lib/session';
import {
  exchangeCodeForTokens,
  getGoogleAccountInfo,
  syncCalendarList,
} from '@/lib/integrations/google/calendar';
import { encryptToken } from '@/lib/integrations/encryption';
import { syncAvailabilityBlocks } from '@/lib/integrations/google/freebusy';

/**
 * GET /api/integrations/google/callback
 * Handles OAuth callback from Google
 */
export async function GET(request: Request) {
  try {
    // Verify user is authenticated
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.redirect(
        new URL('/login?error=unauthorized', request.url)
      );
    }
    
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    // Handle user cancellation
    if (error === 'access_denied') {
      return NextResponse.redirect(
        new URL('/spaces?message=google_calendar_cancelled', request.url)
      );
    }
    
    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(
        new URL('/spaces?error=google_calendar_error', request.url)
      );
    }
    
    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/spaces?error=invalid_oauth_response', request.url)
      );
    }
    
    // Verify state parameter
    const cookieStore = await cookies();
    const storedState = cookieStore.get('google_oauth_state')?.value;
    
    if (!storedState || storedState !== state) {
      console.error('State mismatch:', { storedState, state });
      return NextResponse.redirect(
        new URL('/spaces?error=oauth_state_mismatch', request.url)
      );
    }
    
    // Clear the state cookie
    cookieStore.delete('google_oauth_state');
    
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);
    
    // Get Google account info
    const accountInfo = await getGoogleAccountInfo(tokens.accessToken);
    
    // Store or update external account
    const externalAccount = await prisma.externalAccount.upsert({
      where: {
        userId_provider: {
          userId: userId,
          provider: 'GOOGLE',
        },
      },
      create: {
        userId: userId,
        provider: 'GOOGLE',
        providerAccountId: accountInfo.email,
        accessToken: encryptToken(tokens.accessToken),
        refreshToken: tokens.refreshToken ? encryptToken(tokens.refreshToken) : null,
        tokenExpiresAt: tokens.expiresAt,
        scope: tokens.scope || null,
        revokedAt: null,
      },
      update: {
        providerAccountId: accountInfo.email,
        accessToken: encryptToken(tokens.accessToken),
        refreshToken: tokens.refreshToken ? encryptToken(tokens.refreshToken) : null,
        tokenExpiresAt: tokens.expiresAt,
        scope: tokens.scope || null,
        revokedAt: null, // Clear any previous revocation
      },
    });
    
    // Sync calendar list
    await syncCalendarList(externalAccount.id);
    
    // Initial availability sync
    await syncAvailabilityBlocks(externalAccount.id);
    
    // Redirect to settings with success message
    return NextResponse.redirect(
      new URL('/spaces?message=google_calendar_connected', request.url)
    );
  } catch (error) {
    console.error('Error in Google OAuth callback:', error);
    console.error('Error details:', error instanceof Error ? error.stack : error);
    return NextResponse.redirect(
      new URL(`/spaces?error=google_calendar_connection_failed&details=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown')}`, request.url)
    );
  }
}
