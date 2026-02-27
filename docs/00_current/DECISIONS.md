# Decisions

This file records high-level decisions and trade-offs. Add dated entries as they are made.

## Format
```
## YYYY-MM-DD - Decision Title
- Context:
- Decision:
- Alternatives considered:
- Consequences:
```

## 2026-01-30 - Mutation-level authorization checks (P0-1)
- Context: 13 mutation functions in `src/lib/` executed writes without verifying space membership. Authorization relied solely on call-site checks (page layouts, API routes). `deleteNote()` had no author check.
- Decision: Add inline membership verification to every mutation. Use `getCoupleSpaceForUser` for space-scoped creates, `findFirst` with membership WHERE for entity-scoped mutations. `deleteNote()` gets both membership + author check. Both partners can edit/delete shared planning content (events, ideas); only the author can delete their own notes.
- Alternatives considered: Shared middleware/wrapper function — rejected to avoid a new abstraction for a straightforward pattern. Prisma middleware — rejected as too implicit and harder to reason about per-function.
- Consequences: Defense in depth — legitimate callers that already check membership will pass both checks. `deleteEvent`/`deleteIdea` now check before child note deletion, preventing unauthorized data destruction. UI follow-up needed: hide delete button on partner's notes (P1-4 scope).

## 2026-01-30 - Revert idea on event deletion (P0-2)
- Context: When users deleted an event that was scheduled from an idea, the idea remained in PLANNED status with `convertedToEventId` pointing to a non-existent event. Users had no way to recover or re-schedule these "buried" ideas.
- Decision: Enhanced `deleteEvent()` to automatically revert linked ideas by setting `convertedToEventId = null` and `status = NEW`. Added a changelog entry "Idea restored (event deleted)" for transparency. Wrapped in try-catch to gracefully handle missing ideas without blocking event deletion.
- Alternatives considered: Manual idea recovery UI — rejected as it adds complexity and doesn't match user expectations. Leave idea in PLANNED state — rejected as it creates permanent data loss.
- Consequences: Ideas now automatically return to "New Ideas" list when their linked event is deleted, matching natural user mental model. Activity log provides transparency. Edge case of missing ideas handled gracefully.

## 2026-01-30 - Middleware auth guard (P0-3)
- Context: Protected routes (`/spaces/*`, `/events/*`, `/api/*`) relied solely on page-level and mutation-level authorization checks. No early guard to reject unauthenticated requests before route handlers execute.
- Decision: Added Next.js middleware that checks for `cm_session` cookie presence. Returns 401 for API routes, redirects to `/login` for page routes. Keeps logic minimal (cookie presence only, no validation). Existing `requireUserId()` checks remain as the authoritative layer.
- Alternatives considered: Validate token in middleware — rejected as it duplicates logic and adds latency. Rely only on route-level checks — rejected as defense in depth is preferable.
- Consequences: Unauthenticated requests fail faster (at middleware layer). Reduces unnecessary route handler execution. Provides user-friendly redirects for page routes. Does not replace existing authorization - acts as safety net.

## 2026-01-30 - Sanitize ICS header (P0-4)
- Context: Calendar export route used `space.name` directly in `Content-Disposition` filename without sanitization. Malicious space names with control characters (CR/LF/quotes) could inject arbitrary HTTP headers.
- Decision: Added `sanitizeForHeader()` helper that strips `\r`, `\n`, `"`, `\\`, collapses whitespace, and trims. Falls back to "couple-moments" if result is empty. Applied to both calendar name and filename.
- Alternatives considered: URL-encode filename — rejected as it doesn't prevent header injection, only filename issues. Validate space name on creation — rejected as too restrictive and doesn't fix existing data.
- Consequences: Header injection vector closed. Legitimate space names preserved (just cleaned). No schema changes or migrations needed. Safe to deploy independently.

## 2026-02-05 - Google Calendar Integration Architecture (M4)
- Context: Users wanted to see their existing calendar commitments (busy times) when planning dates. Manual entry of availability blocks was tedious and error-prone.
- Decision: Implemented OAuth2 flow with Google Calendar API using FreeBusy queries. Tokens encrypted with AES-256-GCM before storage. External blocks displayed as read-only with time ranges, distinct from editable manual blocks. Both block types use dashed border style to indicate unavailability.
- Alternatives considered:
  - Full event sync — rejected as privacy concern (don't need event titles/details, just busy/free)
  - iCal import — rejected as requires manual re-import, no live sync
  - Replace manual blocks entirely — rejected as users may want to mark busy time not in their calendar
- Consequences: Users can connect Google Calendar once and see busy times automatically. Manual blocks remain for ad-hoc unavailability. Color-coded per user for multi-partner visibility. Requires additional env vars (TOKEN_ENCRYPTION_KEY, GOOGLE_* credentials).

## 2026-02-17 - Password reset via signed token + Resend email
- Context: No password recovery path existed. Beta testers who forget their password require manual DB intervention.
- Decision: Token-based reset flow. `PasswordResetToken` table stores a 32-byte hex token with 1-hour expiry and single-use enforcement (`usedAt`). API routes at `/api/auth/forgot-password` and `/api/auth/reset-password`. Email sent via Resend API (fetch-based, no SDK). On reset: all existing sessions are deleted so the user must log in fresh. Email address is never leaked — the forgot-password endpoint always returns the same generic message regardless of whether the email exists.
- Alternatives considered: Magic link login — rejected as it changes the login model. NextAuth credentials — rejected as we have a working custom auth system.
- Consequences: Requires `RESEND_API_KEY` and `RESEND_FROM_EMAIL` in production. Dev without API key logs the reset URL to the console. Requires `NEXT_PUBLIC_APP_URL` in production for correct link generation.

## ADR Index
- ADR-2026-01-30-custom-session-auth.md
- ADR-2026-01-30-tags-json-string.md
- ADR-2026-01-30-mutation-auth-checks.md

## Links
- READ_THIS_FIRST.md
- docs/00_current/ARCHITECTURE.md
- docs/00_current/CONTEXT.md
- docs/00_current/rollout_plan.md
