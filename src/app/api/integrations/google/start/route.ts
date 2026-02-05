import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { generateAuthUrl } from '@/lib/integrations/google/calendar';
import { getCurrentUserId } from '@/lib/current-user';

/**
 * GET /api/integrations/google/start
 * Initiates Google OAuth flow
 */
export async function GET(request: Request) {
  try {
    // Verify user is authenticated
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Generate a random state parameter for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');
    
    // Store state in a signed cookie (expires in 10 minutes)
    const cookieStore = await cookies();
    cookieStore.set('google_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60, // 10 minutes
      path: '/',
    });
    
    // Generate OAuth URL
    const authUrl = generateAuthUrl(state);
    
    // Redirect to Google OAuth consent screen
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Error starting Google OAuth:', error);
    return NextResponse.json(
      { error: 'Failed to start authorization flow' },
      { status: 500 }
    );
  }
}
