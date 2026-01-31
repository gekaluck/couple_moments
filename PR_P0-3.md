# P0-3: Middleware Auth Guard

## Summary
Added lightweight middleware that blocks unauthenticated access to protected routes by checking for the presence of the `cm_session` cookie.

## Changes Made
- Created `middleware.ts` at repo root with route matchers for:
  - `/spaces/*` - redirects to `/login`
  - `/events/*` - redirects to `/login`
  - `/api/couple-spaces/*` - returns 401
  - `/api/spaces/*` - returns 401 (includes calendar export)

## Implementation Details
1. Middleware checks for `cm_session` cookie presence
2. For API routes: returns JSON `{ error: "Unauthorized" }` with 401 status
3. For page routes: redirects to `/login` using `NextResponse.redirect()`
4. If cookie exists: allows request to continue with `NextResponse.next()`
5. Uses Next.js matcher config to specify protected route patterns

## Design Decisions
- **Cookie presence check only** - Does not validate token or check expiration (existing `requireUserId()` handles that)
- **Safety net layer** - Pages and API routes keep their existing authorization checks as the authoritative layer
- **Minimal logic** - Keeps middleware fast; all business logic remains in route handlers
- **Public routes excluded** - `/login`, `/register`, `/`, and static assets are not matched

## Edge Cases Handled
- ✅ Static assets and public routes excluded via matcher config
- ✅ Different behavior for API vs page routes (401 vs redirect)
- ✅ Does not replace existing data-layer authorization checks

## Manual Testing Checklist
- [ ] Access `/spaces/[id]/calendar` without auth → redirects to `/login`
- [ ] Access `/events/[id]` without auth → redirects to `/login`
- [ ] Access `/api/couple-spaces/*` without auth → returns 401 JSON
- [ ] Access `/api/spaces/[id]/calendar.ics` without auth → returns 401
- [ ] Access `/login` without auth → allowed (page loads)
- [ ] Access `/register` without auth → allowed (page loads)
- [ ] Access `/` without auth → allowed (page loads)
- [ ] Access protected routes WITH valid session → allowed (continues normally)
- [ ] Verify existing `requireUserId()` checks still work (defense in depth)

## Files Changed
- `middleware.ts` (new file)

## Related Documentation
- Technical plan: `docs/00_current/TECH_PLAN_P0-3.md`
- Related to P0-1 (mutation authorization checks)

---

**Ready for review!** This implements the P0-3 technical plan exactly as specified.
