# Comprehensive Code Review - Couple Moments
**Date:** January 20, 2026  
**Reviewer:** AI Code Review System  
**Latest Changes Analyzed:** Toast notifications (Sonner), ConfirmDialog, loading states, optimistic UI

---

## 🎉 Recent Improvements (Excellent Work!)

### 1. **Toast Notifications System** ✅
- **Added:** `sonner` library integrated in [layout.tsx](src/app/layout.tsx)
- **Styling:** Custom toast styles matching design system
- **Implementation:** Toast feedback added across all major forms:
  - Event comments
  - Event updates/deletes
  - Availability blocks
  - Idea creation/scheduling
  - Comment additions

**Impact:** Massive UX improvement - users now get immediate feedback for all actions.

### 2. **ConfirmDialog Component** ✅
- **New component:** [ConfirmDialog.tsx](src/components/ConfirmDialog.tsx)
- **Features:**
  - Reusable confirmation dialog
  - Loading states during async actions
  - Danger/warning variants
  - Proper error handling
- **Usage:** Replaces dangerous inline `confirm()` calls

**Impact:** Much safer deletion flows, prevents accidental data loss.

### 3. **Loading States & Optimistic UI** ✅
- **Loading spinners:** Added to all submit buttons using `Loader2` icon
- **Disabled states:** Buttons disabled during pending operations
- **Optimistic updates:** Event comments show immediately before server confirmation
- **useTransition hooks:** Proper React 19 concurrent features

**Impact:** App feels much more responsive and professional.

### 4. **Removed Dead Code** ✅
- **Removed:** Event reactions system ("+1" likes)
- **Removed:** Note reactions in Notes page
- **Rationale:** Streamlines codebase, focuses on core features

**Impact:** Cleaner code, less maintenance burden.

---

## 🐛 Critical Issues (Must Fix)

### 1. **TypeScript Null Safety in Calendar Page** 🔴
**File:** [calendar/page.tsx](src/app/spaces/[spaceId]/calendar/page.tsx)

**Problem:** 18 TypeScript errors - `space` is possibly null in server actions

**Location:** Lines 138, 143, 146, 175, 181, 184, 191, 204, 210, 220, 262, 265, 292, 297, 302, 305, 348, 351

**Current Code:**
```typescript
const space = await getCoupleSpaceForUser(spaceId, userId);
if (!space) {
  redirect("/spaces/onboarding");
}

async function handleCreate(formData: FormData) {
  "use server";
  // ...
  redirect(`/spaces/${space.id}/calendar`); // ERROR: 'space' is possibly 'null'
}
```

**Root Cause:** Server Actions are separate function scopes - TypeScript doesn't know that `space` was validated outside them.

**Fix Required:**
```typescript
async function handleCreate(formData: FormData) {
  "use server";
  const currentUserId = await requireUserId();
  const { spaceId } = await params; // Re-capture spaceId
  const currentSpace = await getCoupleSpaceForUser(spaceId, currentUserId);
  
  if (!currentSpace) {
    redirect("/spaces/onboarding");
  }
  
  // Now TypeScript knows currentSpace is not null
  redirect(`/spaces/${currentSpace.id}/calendar`);
}
```

**Priority:** HIGH - TypeScript errors should not be ignored, they prevent safe refactoring.

---

### 2. **Session Storage in Memory** 🔴
**File:** [session.ts](src/lib/session.ts)

**Problem:** Sessions use HMAC-signed cookies with stateless verification, but no session storage backend.

**Current Implementation:**
- Session token = `userId.timestamp.signature`
- Stored in HTTP-only cookie
- Verified cryptographically
- **No revocation possible** - can't invalidate sessions early

**Risks:**
1. **Can't log users out remotely** - token valid until expiry (30 days)
2. **Can't detect compromised accounts** - no session tracking
3. **Can't implement "log out all devices"**

**Recommendation:**
```typescript
// Option A: Add session table to database
model Session {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id])
}

// Option B: Use Redis for session storage (better for production)
```

**Priority:** MEDIUM - Works for MVP, but implement before production.

---

### 3. **Missing Error Boundaries** 🟡
**File:** [layout.tsx](src/app/layout.tsx)

**Problem:** No React Error Boundaries - entire page crashes on errors.

**Current State:**
```tsx
export default function RootLayout({ children }: ...) {
  return (
    <html lang="en">
      <body>
        {children} {/* Any error here crashes the whole app */}
        <Toaster />
      </body>
    </html>
  );
}
```

**Fix Required:**
```tsx
// Create components/ErrorBoundary.tsx
'use client';

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  
  componentDidCatch(error: Error) {
    console.error('Error caught:', error);
    toast.error('Something went wrong');
  }
  
  render() {
    if (this.hasError) {
      return <div>Something went wrong. Please refresh.</div>;
    }
    return this.props.children;
  }
}

// Use in layout
<ErrorBoundary>{children}</ErrorBoundary>
```

**Priority:** MEDIUM - Important for production stability.

---

## ⚠️ Code Quality Issues

### 4. **Inconsistent Icon Implementations** 🟡

**Problem:** Mixed approaches for icons across the codebase:

1. **Inline SVG components:**
```tsx
const PencilIcon = () => (
  <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24">
    {/* ... */}
  </svg>
);
```

2. **Lucide React icons:**
```tsx
import { Loader2, Trash2, Calendar } from "lucide-react";
```

3. **Icons with improper wrapping:**
```tsx
// Before (wrong - icon components can't have className)
<CalendarIcon className="..." />

// After (correct - wrapped in span)
<span className="...">
  <CalendarIcon />
</span>
```

**Recommendation:**
1. **Standardize on Lucide React** for all icons (already installed)
2. **Remove inline SVG icon components**
3. **Create icon wrapper component:**

```tsx
// components/Icon.tsx
export function Icon({ 
  icon: IconComponent, 
  className 
}: { 
  icon: LucideIcon; 
  className?: string;
}) {
  return (
    <span className={className}>
      <IconComponent />
    </span>
  );
}

// Usage
<Icon icon={Calendar} className="h-4 w-4 text-rose-500" />
```

**Priority:** LOW - Cosmetic, but improves consistency.

---

### 5. **Duplicate Utility Functions** 🟡

**Problem:** Same helper functions defined multiple times:

**Example 1: `getInitials()`**
- Defined in [event-comments.tsx](src/app/events/[eventId]/event-comments.tsx)
- Defined in [notes/page.tsx](src/app/spaces/[spaceId]/notes/page.tsx)
- Defined in [IdeaCard.tsx](src/components/planning/IdeaCard.tsx)

**Example 2: `formatTimestamp()` / `formatTimeAgo()`**
- Multiple variations across files

**Fix Required:**
```typescript
// Create lib/formatters.ts
export function getInitials(name: string | null, email: string): string {
  const value = (name ?? "").trim();
  if (value) {
    return value
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }
  return email.slice(0, 2).toUpperCase();
}

export function formatTimestamp(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatTimeAgo(value: string): string {
  // ... implementation
}
```

**Priority:** LOW - Refactoring opportunity, not urgent.

---

### 6. **Magic Strings for Gradients** 🟡

**Problem:** Hardcoded gradient classes scattered throughout:

```tsx
const TAG_GRADIENTS: Record<string, string> = {
  date: "from-rose-500 to-pink-600",
  together: "from-rose-500 to-pink-600",
  cozy: "from-orange-400 to-amber-500",
  weekend: "from-purple-400 to-indigo-500",
};

const AVATAR_GRADIENTS = [
  "from-rose-500 to-pink-600",
  "from-sky-500 to-indigo-600",
];
```

**Recommendation:**
```typescript
// lib/theme.ts
export const GRADIENTS = {
  primary: "from-rose-500 to-pink-600",
  secondary: "from-sky-500 to-indigo-600",
  accent: "from-amber-400 to-orange-500",
  tertiary: "from-purple-400 to-indigo-500",
} as const;

// Usage
className={`bg-gradient-to-r ${GRADIENTS.primary}`}
```

**Priority:** LOW - Nice-to-have for maintainability.

---

## 🔒 Security Issues

### 7. **No Input Sanitization** 🟡

**Problem:** User input directly rendered without sanitization.

**Example:**
```tsx
<p>{event.description}</p>
<div>{note.body}</div>
```

**Risk:** XSS vulnerability if user inputs malicious HTML/JavaScript.

**Current Mitigation:** React escapes by default, so **low risk**.

**Recommendation:**
- Add explicit sanitization for any `dangerouslySetInnerHTML` usage
- Consider adding DOMPurify if allowing rich text in future

**Priority:** LOW - React handles this, but be aware.

---

### 8. **Google Maps API Key Exposed** 🟡

**File:** [layout.tsx](src/app/layout.tsx)

```tsx
<Script
  src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`}
  strategy="beforeInteractive"
/>
```

**Issue:** `NEXT_PUBLIC_*` vars are exposed to client-side JavaScript.

**Current State:** 
- Key is restricted by HTTP referrer in Google Console (assumed)
- **Verify:** Ensure API key has proper restrictions

**Recommendation:**
```
Google Cloud Console > Credentials > API Key Restrictions:
✓ Application restrictions: HTTP referrers
✓ Website restrictions: yourdomain.com/*
✓ API restrictions: Maps JavaScript API, Places API
```

**Priority:** MEDIUM - Verify restrictions are in place.

---

## 🏗️ Architecture & Performance

### 9. **Missing Indexes on Database** 🟡

**File:** [schema.prisma](prisma/schema.prisma)

**Problem:** No explicit indexes on frequently queried fields.

**Current Schema:**
```prisma
model Event {
  id              String   @id @default(cuid())
  coupleSpaceId   String   // ❌ No index
  dateTimeStart   DateTime // ❌ No index
  type            EventType // ❌ No index
  // ...
}
```

**Recommendation:**
```prisma
model Event {
  // ... fields ...
  
  @@index([coupleSpaceId, dateTimeStart])
  @@index([coupleSpaceId, type])
  @@index([dateTimeStart])
}

model Note {
  // ... fields ...
  
  @@index([coupleSpaceId, kind])
  @@index([parentType, parentId])
}

model Idea {
  // ... fields ...
  
  @@index([coupleSpaceId, status])
}
```

**Impact:** Queries will slow down with larger datasets.

**Priority:** MEDIUM - Add before data grows significantly.

---

### 10. **N+1 Query Problems** 🟡

**Problem:** Potential N+1 queries when listing items with relations.

**Example 1:** Calendar page loads events, then queries comments per event
```typescript
const events = await listEventsForSpace({ spaceId });
const eventComments = await listEventCommentsForEvents(
  events.map((event) => event.id)
); // One query per event ID
```

**Better Approach:**
```typescript
// Use Prisma include to batch
const events = await prisma.event.findMany({
  where: { coupleSpaceId },
  include: {
    _count: {
      select: { notes: true }
    }
  }
});
```

**Priority:** LOW - Current implementation is okay for small datasets.

---

### 11. **Large Bundle Size from Headless UI** 🟡

**Problem:** `@headlessui/react` adds ~40KB to bundle, but only using Dialog and Transition.

**Current Usage:**
- `Dialog` for modals
- `Transition` for animations

**Alternative:**
- Custom modal component (lighter weight)
- CSS transitions instead of Transition component

**Recommendation:** Keep Headless UI for now (benefits outweigh costs), but be aware.

**Priority:** LOW - Optimize if bundle size becomes an issue.

---

## ✨ Best Practices & Patterns

### 12. **Excellent Use of Server Actions** ✅

**Observation:** Proper use of Next.js Server Actions throughout:

```typescript
async function handleCreate(formData: FormData) {
  "use server";
  const userId = await requireUserId();
  // ... validation ...
  await createEventForSpace(spaceId, userId, data);
  redirect(`/spaces/${spaceId}/calendar`);
}
```

**Strengths:**
- ✅ Authentication checked in every action
- ✅ Validation before database operations
- ✅ Redirects after mutations
- ✅ No exposed API endpoints for mutations

**Keep doing this!**

---

### 13. **Good Error Handling in New Code** ✅

**Observation:** Recent changes added proper try/catch with toast feedback:

```typescript
startTransition(async () => {
  try {
    await onSubmit(formData);
    toast.success("Event updated!");
    router.push(onCloseHref);
    router.refresh();
  } catch {
    toast.error("Failed to update event");
  }
});
```

**Recommendation:** Apply this pattern consistently to ALL server action calls.

---

### 14. **Optimistic UI Implementation** ✅

**Observation:** Event comments use optimistic updates:

```typescript
const [optimisticComments, addOptimisticComment] = useOptimistic(
  initialComments,
  (state, comment: Comment) => [...state, comment],
);

// Add comment optimistically
addOptimisticComment({
  id: `optimistic-${Date.now()}`,
  body: content,
  createdAt: new Date().toISOString(),
  author: currentUser,
});
```

**Excellent pattern!** Consider applying to:
- Idea creation
- Reactions (if re-added)
- Event creation

---

## 📊 Testing & Quality Assurance

### 15. **No Tests** 🔴

**Problem:** Zero test coverage.

**Recommendation:** Add tests incrementally:

**Priority 1: Critical Path Tests**
```typescript
// tests/auth.test.ts
describe('Authentication', () => {
  it('should hash passwords correctly', () => {
    // Test hashPassword function
  });
  
  it('should verify valid sessions', () => {
    // Test verifySessionToken
  });
});

// tests/events.test.ts
describe('Event Creation', () => {
  it('should create PLANNED event for future dates', () => {
    // Test createEventForSpace
  });
  
  it('should create MEMORY event for past dates', () => {
    // Test event type logic
  });
});
```

**Priority 2: Integration Tests**
- Test server actions with mock database
- Test user flows (register → create space → add event)

**Tools:**
- Vitest (fastest for Next.js)
- React Testing Library (component tests)
- Playwright (E2E tests)

**Priority:** MEDIUM - Add before major features.

---

## 🚀 Performance Optimizations

### 16. **Consider Route Caching Strategy** 🟡

**Observation:** All pages are dynamic (no static generation).

**Current State:**
```typescript
export default async function CalendarPage({ params }: PageProps) {
  // Server component - renders on every request
}
```

**Potential Optimization:**
```typescript
// Consider partial caching for infrequent changes
export const revalidate = 60; // Revalidate every 60 seconds

// Or use Incremental Static Regeneration (ISR)
export const dynamic = 'force-dynamic'; // Current behavior
```

**Recommendation:** Current approach is fine for MVP. Consider caching when scaling.

**Priority:** LOW - Optimize later.

---

### 17. **Image Optimization Missing** 🟡

**Problem:** Photo schema exists but no image optimization.

**When implementing photos:**
```typescript
// Use Next.js Image component
import Image from 'next/image';

<Image
  src={photo.storageUrl}
  alt={event.title}
  width={400}
  height={300}
  placeholder="blur"
/>
```

**Also consider:**
- Image resizing on upload (Sharp library)
- WebP format conversion
- CDN delivery

**Priority:** LOW - Implement when adding photo upload.

---

## 🎨 UI/UX Observations

### 18. **Accessibility Gaps** 🟡

**Issues Found:**

1. **Missing ARIA labels:**
```tsx
// Current
<button onClick={handleDelete}>
  <TrashIcon />
</button>

// Better
<button 
  onClick={handleDelete}
  aria-label="Delete event"
>
  <TrashIcon aria-hidden="true" />
</button>
```

2. **Form validation messages:**
```tsx
// Current
<input required />

// Better
<input 
  required 
  aria-invalid={hasError}
  aria-describedby="error-message"
/>
{hasError && <span id="error-message">Title is required</span>}
```

3. **Focus management:** Modals don't trap focus.

**Recommendation:**
- Add ARIA labels to icon-only buttons
- Implement form validation with error messages
- Use Headless UI's `FocusTrap` in modals

**Priority:** MEDIUM - Important for accessibility compliance.

---

### 19. **Mobile Responsiveness Needs Testing** 🟡

**Observation:** Responsive classes used throughout, but no mobile testing evident.

**Concerns:**
- Calendar grid may be cramped on small screens
- Modals should be full-screen on mobile
- Long event titles might overflow calendar cells

**Recommendation:**
```css
/* Test on actual devices or use browser DevTools */
/* Consider mobile-first design */
@media (max-width: 640px) {
  .calendar-grid {
    grid-template-columns: repeat(7, minmax(0, 1fr));
    font-size: 0.75rem;
  }
}
```

**Priority:** MEDIUM - Test thoroughly before launch.

---

## 📝 Documentation Gaps

### 20. **Missing Component Documentation** 🟡

**Problem:** No JSDoc or comments for complex components.

**Recommendation:**
```typescript
/**
 * Modal component for editing events.
 * 
 * @param isOpen - Controls modal visibility
 * @param onSubmit - Server action called on form submit
 * @param mapsApiKey - Optional Google Maps API key for place search
 * 
 * @example
 * <EventEditModal
 *   isOpen={true}
 *   onSubmit={handleUpdate}
 *   title="Dinner Date"
 * />
 */
export default function EventEditModal({ ... }) {
  // ...
}
```

**Priority:** LOW - Add as you build.

---

## 🎯 Recommendations Summary

### Immediate Actions (Do This Week)
1. ✅ **Fix TypeScript errors** in calendar page (re-fetch space in server actions)
2. ✅ **Add error boundaries** to root layout
3. ✅ **Verify Google Maps API key restrictions**
4. ✅ **Add database indexes** for common queries

### Short-term (Do This Month)
5. 📋 **Implement session storage** (database or Redis)
6. 📋 **Standardize icon usage** (all Lucide React)
7. 📋 **Add accessibility labels** to icon buttons
8. 📋 **Extract duplicate utility functions**
9. 📋 **Test mobile responsiveness** on actual devices

### Long-term (Before Production)
10. 📋 **Add test coverage** (critical paths first)
11. 📋 **Implement proper error handling** across all forms
12. 📋 **Create component library documentation**
13. 📋 **Performance audit** with Lighthouse
14. 📋 **Security audit** (penetration testing)

---

## 💯 Overall Assessment

### Code Quality: **B+** (Good, trending towards Excellent)

**Strengths:**
- ✅ Excellent use of modern Next.js patterns
- ✅ Clean separation of concerns (lib/ functions, components, pages)
- ✅ Recent improvements show strong understanding of UX
- ✅ Type safety with TypeScript (mostly)
- ✅ Consistent code style and naming conventions

**Weaknesses:**
- ⚠️ TypeScript errors in production code
- ⚠️ No test coverage
- ⚠️ Session management needs improvement
- ⚠️ Some accessibility gaps

### Recent Changes: **A+** (Excellent)

The recent additions (toast notifications, confirm dialogs, loading states) are exactly what was needed. Implementation is clean and follows best practices.

### Production Readiness: **70%**

**What's blocking production:**
1. TypeScript errors must be resolved
2. Session management needs database backing
3. Basic test coverage required
4. Accessibility compliance

**Timeline to production:** ~2-3 weeks of focused work.

---

## 🏆 Highlights

**Best Decisions Made:**
1. Using Server Components and Server Actions (modern, secure)
2. SQLite for MVP (fast development, easy migrations)
3. Unified Notes system (smart consolidation)
4. Adding Sonner for feedback (huge UX win)
5. Custom confirmation dialogs (prevents data loss)

**Most Impressive Code:**
- Optimistic UI in event comments
- Place integration with Google Maps API
- Calendar grid generation logic
- Creator color palette generation

---

## 📞 Next Steps

1. **Fix critical TypeScript errors** (1-2 hours)
2. **Add error boundaries** (1 hour)
3. **Review session security** (2-3 hours)
4. **Test mobile experience** (2-4 hours)
5. **Add database indexes** (1 hour)

**Total effort:** ~1-2 days of focused work to resolve critical issues.

After that, you'll have a solid, production-ready MVP! 🚀

---

**Last Updated:** January 20, 2026  
**Next Review:** After critical fixes are implemented
