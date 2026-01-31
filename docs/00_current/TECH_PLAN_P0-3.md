# Technical Plan - P0-3 (Middleware Auth Guard)

**Status:** ✅ COMPLETED (2026-01-30)
**PR:** feature/p0-3-middleware-auth-guard

## Goal
Add a lightweight middleware guard that blocks unauthenticated access to protected routes using the `cm_session` cookie as a presence check.

## Scope
- Add `middleware.ts` at repo root.
- Protect route prefixes:
  - `/spaces/*`
  - `/events/*`
  - `/api/couple-spaces/*`
  - `/api/spaces/*` (includes calendar export)
- Do not replace existing `requireUserId()` checks; this is a safety net.

## Files to Change
- `middleware.ts`

## Implementation Steps
1. Create `middleware.ts` with a `matcher` for the route prefixes above.
2. In middleware, read `cm_session` from `request.cookies`.
3. If missing:
   - For page routes: redirect to `/login`.
   - For API routes: return `401` JSON.
4. If present, allow the request to continue.

## Edge Cases
- Ensure static assets and public routes (`/login`, `/register`, `/`) are excluded.
- Keep middleware logic minimal to avoid perf costs.

## Validation / Tests
- Manual:
  - Access `/spaces/...` unauthenticated: redirected to `/login`.
  - Access `/api/couple-spaces` unauthenticated: 401.
  - Access `/login` and `/register` unauthenticated: allowed.

## Rollout
- Ship alongside P0-1 authorization changes; this is not a substitute for data-layer checks.
