# Codebase Evaluation Summary

## Critical issues (must fix)
- Missing authorization checks in idea mutations: `updateIdea`, `deleteIdea`, and `createIdeaComment` do not verify that `ideaId` belongs to the current user’s space, and the server actions in `src/app/spaces/[spaceId]/calendar/page.tsx` pass `ideaId` from form data. This allows any authenticated user who learns an `ideaId` to update/delete/comment across spaces. Files: `src/lib/ideas.ts`, `src/app/spaces/[spaceId]/calendar/page.tsx`.

## Important issues (should fix)
- CSRF protections are absent for cookie-authenticated POST routes. `sameSite=lax` helps but does not replace CSRF tokens. Affected: `src/app/api/auth/login/route.ts`, `src/app/api/auth/register/route.ts`, `src/app/api/auth/logout/route.ts`, and other POST API routes under `src/app/api/`.
- No rate limiting or lockout for login/register endpoints, enabling brute-force attempts. Files: `src/app/api/auth/login/route.ts`, `src/app/api/auth/register/route.ts`.
- `updateEvent`/`deleteEvent` in `src/lib/events.ts` do not enforce membership checks; current callers check membership, but this is not enforced at the data layer (defense-in-depth risk).
- `calendar.ics` response uses `space.name` in `Content-Disposition` without sanitizing quotes/newlines. Header injection is possible if a space name includes control characters. File: `src/app/api/spaces/[spaceId]/calendar.ics/route.ts`.

## Minor issues (nice to fix)
- Password policy is minimal (only presence). No length or strength checks. File: `src/app/api/auth/register/route.ts`.
- `parseJsonOrForm` casts unvalidated inputs and falls back to `{}` on invalid JSON, which can mask client errors and reduce type safety. File: `src/lib/request.ts`.
- Documentation consistency: docs state photo uploads are not implemented, while code includes direct Cloudinary upload flow (`src/components/photos/PhotoUploader.tsx`, `src/app/events/[eventId]/page.tsx`).
