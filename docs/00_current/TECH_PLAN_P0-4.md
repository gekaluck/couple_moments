# Technical Plan - P0-4 (Sanitize ICS Content-Disposition)

**Status:** ✅ COMPLETED (2026-01-30)
**PR:** feature/p0-4-sanitize-ics-header

## Goal
Prevent header injection in the calendar export by sanitizing the filename used in the `Content-Disposition` header.

## Scope
- Update the ICS route to strip control characters and quotes from `space.name` before building the filename.

## Files to Change
- `src/app/api/spaces/[spaceId]/calendar.ics/route.ts`

## Implementation Steps
1. Add a small helper to sanitize `calendarName`:
   - Remove CR/LF (`\r`, `\n`).
   - Remove double quotes and backslashes.
   - Trim and collapse whitespace.
2. Use the sanitized name for both `calendarName` and filename construction.
3. Keep existing ICS content generation unchanged.

## Edge Cases
- If the sanitized name becomes empty, fall back to `"couple-moments"`.

## Validation / Tests
- Manual:
  - Set space name to include quotes/newlines and verify the download still works.
  - Inspect `Content-Disposition` in response headers for safe output.

## Rollout
- Safe to ship independently; no schema changes.
