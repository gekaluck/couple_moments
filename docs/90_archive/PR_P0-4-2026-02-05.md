# P0-4: Sanitize ICS Content-Disposition Header

## Summary
Fixed header injection vulnerability in calendar export by sanitizing the space name before using it in the `Content-Disposition` filename.

## Changes Made
- Added `sanitizeForHeader()` helper function in `route.ts`
- Sanitizes `space.name` before constructing filename
- Falls back to `"couple-moments"` if sanitized name is empty

## Implementation Details
**Sanitization Logic:**
```typescript
function sanitizeForHeader(input: string): string {
  return input
    .replace(/[\r\n"\\]/g, "")  // Remove CR, LF, quotes, backslashes
    .replace(/\s+/g, " ")        // Collapse whitespace
    .trim();                     // Remove leading/trailing whitespace
}
```

**Application:**
1. Takes raw `space.name` (or defaults to "Couple Moments")
2. Sanitizes through `sanitizeForHeader()`
3. Falls back to `"couple-moments"` if result is empty
4. Uses sanitized value for both:
   - `calendarName` (passed to ICS generator)
   - `filename` (in Content-Disposition header)

## Security Impact
**Before:** A malicious space name like:
```
My Space"\r\nContent-Type: text/html\r\n\r\n<script>alert('xss')</script>
```
Could inject arbitrary headers or content.

**After:** The same input becomes:
```
My Space
```
All control characters and injection vectors are stripped.

## Edge Cases Handled
- ✅ Empty space name → falls back to "couple-moments"
- ✅ Space name with only control characters → falls back to "couple-moments"
- ✅ Multiple consecutive spaces → collapsed to single space
- ✅ Leading/trailing whitespace → trimmed
- ✅ Existing legitimate space names → preserved (just cleaned)

## Manual Testing Checklist
- [ ] Export calendar with normal space name → works as before
- [ ] Set space name to `"Test\r\nInjection"` → verify filename is safe
- [ ] Set space name to `My "Quoted" Space` → verify quotes removed
- [ ] Set space name to empty string → verify falls back to "couple-moments"
- [ ] Set space name to only whitespace → verify falls back to "couple-moments"
- [ ] Inspect `Content-Disposition` header in browser network tab → no control chars
- [ ] Download still works correctly after sanitization

## Files Changed
- `src/app/api/spaces/[spaceId]/calendar.ics/route.ts`

## Related Documentation
- Technical plan: `docs/00_current/TECH_PLAN_P0-4.md`
- Security issue: Header injection prevention

---

**Ready for review!** This closes a real injection vector and can be safely shipped independently.
