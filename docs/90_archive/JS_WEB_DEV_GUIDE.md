# JavaScript & Web Development Guide for Python Developers

A practical guide using examples from this codebase (Duet - a couples planning app).

---

## Table of Contents

1. [JavaScript vs Python: Quick Comparison](#1-javascript-vs-python-quick-comparison)
2. [TypeScript: Adding Types to JavaScript](#2-typescript-adding-types-to-javascript)
3. [Async/Await: How JavaScript Handles Concurrency](#3-asyncawait-how-javascript-handles-concurrency)
4. [React: Building User Interfaces](#4-react-building-user-interfaces)
5. [Next.js: Full-Stack React Framework](#5-nextjs-full-stack-react-framework)
6. [Common Patterns in This Codebase](#6-common-patterns-in-this-codebase)

---

## 1. JavaScript vs Python: Quick Comparison

### Basic Syntax Differences

| Concept | Python | JavaScript/TypeScript |
|---------|--------|----------------------|
| Variables | `name = "value"` | `const name = "value"` or `let name = "value"` |
| Functions | `def fn(x):` | `function fn(x) {}` or `const fn = (x) => {}` |
| String formatting | `f"Hello {name}"` | `` `Hello ${name}` `` (backticks) |
| None/null | `None` | `null` or `undefined` |
| Dictionary | `{"key": "value"}` | `{ key: "value" }` |
| List | `[1, 2, 3]` | `[1, 2, 3]` (called "array") |
| Boolean | `True`, `False` | `true`, `false` |
| Comments | `# comment` | `// comment` or `/* block */` |

### Variable Declarations

```javascript
// const = cannot reassign (like Python's convention for CONSTANTS, but enforced)
const API_URL = "https://api.example.com";

// let = can reassign (like regular Python variables)
let counter = 0;
counter = counter + 1; // OK

// var = old way, avoid it (has scoping issues)
```

### Arrow Functions (Lambda on Steroids)

From `src/components/planning/IdeasColumn.tsx`:

```typescript
// Python lambda: lambda x: x * 2
// JS arrow function (single expression):
const double = (x) => x * 2;

// Multi-line arrow function:
const processIdea = (idea) => {
  const title = idea.title.trim();
  return { ...idea, title };
};

// Arrow functions in array methods (like Python's map/filter):
// Python: list(map(lambda x: x.id, ideas))
// JavaScript:
ideas.map((idea) => idea.id);

// Python: list(filter(lambda x: x.status == "NEW", ideas))
// JavaScript:
ideas.filter((idea) => idea.status === "NEW");
```

### Destructuring (Unpacking on Steroids)

From `src/components/planning/IdeaCard.tsx:63-74`:

```typescript
// Python tuple unpacking:
// name, email = user

// JavaScript object destructuring:
export default function IdeaCard({
  idea,
  commentCount,
  comments,
  currentUserId,
  mapsApiKey,
  hasGoogleCalendar = false,  // with default value
  onSchedule,
  onAddComment,
  onDelete,
  onEdit,
}: IdeaCardProps) {
  // All these variables are now available
}

// Array destructuring (like Python):
const [first, second] = [1, 2];

// React's useState uses this pattern:
const [isOpen, setIsOpen] = useState(false);
// isOpen = current value
// setIsOpen = function to update it
```

### Spread Operator (...)

```typescript
// Python: {**dict1, **dict2} to merge dicts
// JavaScript:
const merged = { ...object1, ...object2 };

// Python: [*list1, *list2]
// JavaScript:
const combined = [...array1, ...array2];

// Common pattern - copy and modify:
const updatedIdea = { ...idea, title: "New Title" };
```

### Optional Chaining (?.) and Nullish Coalescing (??)

From `src/components/planning/IdeaCard.tsx:128-133`:

```typescript
// Python: place_name if place_name else place_address
// JavaScript optional chaining:
idea.placeName || idea.placeAddress

// Safe property access (won't crash if null):
// Python: user.get("profile", {}).get("name")
// JavaScript:
user?.profile?.name

// Nullish coalescing (default only if null/undefined):
const count = commentCounts[idea.id] ?? 0;
// Different from || which treats 0, "", false as falsy
```

---

## 2. TypeScript: Adding Types to JavaScript

TypeScript is JavaScript with type annotations. Think of it like Python type hints, but enforced at compile time.

### Basic Type Annotations

From `src/components/planning/IdeaCard.tsx:25-41`:

```typescript
// Define a type (like Python's TypedDict or dataclass)
type Idea = {
  id: string;
  title: string;
  description: string | null;  // Union type: string OR null
  tags: string[];              // Array of strings
  createdAt: Date;
  createdBy: { name: string | null; email: string };  // Nested object
  placeId?: string | null;     // ? means optional (might not exist)
  placeName?: string | null;
};

// Function with typed parameters
function processIdea(idea: Idea): string {
  return idea.title;
}

// Arrow function with types
const getTitle = (idea: Idea): string => idea.title;
```

### Props Types (Component Parameters)

From `src/components/planning/IdeasColumn.tsx:35-48`:

```typescript
type IdeasColumnProps = {
  ideas: Idea[];
  commentCounts: Record<string, number>;  // Like Python's Dict[str, int]
  currentUserId: string;
  mapsApiKey?: string;                     // Optional prop
  hasGoogleCalendar?: boolean;
  onCreateIdea: (formData: FormData) => Promise<void>;  // Function type
  autoOpen?: boolean;
};
```

### Generics (Like Python's Generic[T])

```typescript
// Python: def first(items: List[T]) -> T
// TypeScript:
function first<T>(items: T[]): T {
  return items[0];
}

// Record<K, V> is like Dict[K, V]
const counts: Record<string, number> = {
  "idea-1": 5,
  "idea-2": 3,
};
```

---

## 3. Async/Await: How JavaScript Handles Concurrency

### The Event Loop (Key Difference from Python)

JavaScript is **single-threaded** but **non-blocking**. It uses an "event loop" that:

1. Runs your code until it hits an async operation (API call, timer, etc.)
2. Registers a callback for when that operation completes
3. Continues running other code
4. When the operation completes, runs the callback

**Python comparison:**
- Python threads: True parallelism (GIL aside), can run multiple things simultaneously
- Python asyncio: Similar to JS, cooperative multitasking
- JavaScript: Always like asyncio, no true threads in browser

### Promises (The Foundation)

A Promise represents a value that will be available in the future.

```typescript
// A Promise can be:
// - Pending: still waiting
// - Fulfilled: completed successfully with a value
// - Rejected: failed with an error

// Creating a promise (rarely do this manually):
const myPromise = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve("Done!");  // Success
    // or: reject(new Error("Failed!"));  // Failure
  }, 1000);
});

// Using a promise (old way with .then):
myPromise
  .then((result) => console.log(result))
  .catch((error) => console.error(error));
```

### Async/Await (Modern Way)

From `src/lib/integrations/google/events.ts:52-151`:

```typescript
// async function = returns a Promise automatically
// await = pause here until Promise resolves

export async function createGoogleCalendarEvent(
  userId: string,
  event: DuetEvent
): Promise<{ success: boolean; externalEventId?: string; error?: string }> {
  try {
    // await pauses execution until this completes
    const account = await prisma.externalAccount.findFirst({
      where: {
        userId,
        provider: 'GOOGLE',
        revokedAt: null,
      },
    });

    if (!account) {
      return { success: false, error: 'No Google account connected' };
    }

    // Another await - waits for this to complete
    const oauth2Client = await getAuthenticatedClient(account.id);

    // Then continues with the result
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // ... more async operations

  } catch (error) {
    // Catches any errors from awaited operations
    console.error('Error creating Google Calendar event:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
```

### Python Comparison

```python
# Python asyncio equivalent:
async def create_google_calendar_event(user_id: str, event: DuetEvent):
    try:
        account = await prisma.external_account.find_first(
            where={"user_id": user_id, "provider": "GOOGLE"}
        )

        if not account:
            return {"success": False, "error": "No Google account connected"}

        oauth2_client = await get_authenticated_client(account.id)
        # ... etc

    except Exception as error:
        return {"success": False, "error": str(error)}
```

### Parallel Async Operations

```typescript
// Sequential (slow) - each waits for previous:
const user = await getUser(id);
const posts = await getPosts(id);
const comments = await getComments(id);

// Parallel (fast) - all start at once:
const [user, posts, comments] = await Promise.all([
  getUser(id),
  getPosts(id),
  getComments(id),
]);

// Python equivalent:
# user, posts, comments = await asyncio.gather(
#     get_user(id),
#     get_posts(id),
#     get_comments(id),
# )
```

---

## 4. React: Building User Interfaces

React is a library for building UIs using **components** - reusable pieces of UI.

### Components = Functions That Return UI

From `src/components/planning/IdeasColumn.tsx`:

```typescript
// A component is just a function that returns JSX (HTML-like syntax)
export default function IdeasColumn({
  ideas,
  commentCounts,
  // ... other props
}: IdeasColumnProps) {

  // Logic goes here
  const hasIdeas = ideas.length > 0;

  // Return JSX (the UI)
  return (
    <div className="flex flex-col gap-4">
      <h3>New ideas</h3>
      {/* Conditional rendering */}
      {hasIdeas ? (
        <div>
          {/* Loop through array */}
          {ideas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
        </div>
      ) : (
        <EmptyState title="No ideas yet" />
      )}
    </div>
  );
}
```

### JSX: HTML in JavaScript

```typescript
// JSX looks like HTML but is actually JavaScript
// It compiles to function calls

// This JSX:
<div className="container">
  <h1>{title}</h1>
  <button onClick={handleClick}>Click me</button>
</div>

// Becomes (roughly):
React.createElement('div', { className: 'container' },
  React.createElement('h1', null, title),
  React.createElement('button', { onClick: handleClick }, 'Click me')
)

// Key differences from HTML:
// - className instead of class (class is reserved in JS)
// - camelCase for attributes: onClick, onChange, htmlFor
// - {} for JavaScript expressions
// - Self-closing tags required: <input /> not <input>
```

### useState: Managing Component State

From `src/components/planning/IdeaCard.tsx:76-80`:

```typescript
// useState creates a "state variable" that triggers re-render when changed

export default function IdeaCard({ idea }: IdeaCardProps) {
  // Declare state: [currentValue, setterFunction] = useState(initialValue)
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // When you call the setter, React re-renders the component
  return (
    <div>
      <button onClick={() => setIsCommentsOpen(true)}>
        Open Comments
      </button>

      {/* Conditionally render based on state */}
      {isCommentsOpen && (
        <div className="comments-panel">
          {/* Comments UI */}
        </div>
      )}
    </div>
  );
}
```

### useEffect: Side Effects (Like Python's __init__ or cleanup)

```typescript
import { useEffect, useState } from "react";

function MyComponent({ userId }) {
  const [user, setUser] = useState(null);

  // useEffect runs AFTER the component renders
  useEffect(() => {
    // This runs when component mounts or userId changes
    async function fetchUser() {
      const data = await fetch(`/api/users/${userId}`);
      setUser(await data.json());
    }
    fetchUser();

    // Optional: return a cleanup function
    return () => {
      // This runs when component unmounts or before next effect
      console.log("Cleaning up...");
    };
  }, [userId]);  // Dependency array: re-run when these change

  // Empty array [] = run only once on mount
  // No array = run after every render (usually wrong)
  // [dep1, dep2] = run when any dependency changes
}
```

From `src/components/planning/IdeaCard.tsx:102-106`:

```typescript
useEffect(() => {
  if (isCommentsOpen) {
    inputRef.current?.focus();  // Focus the input when comments open
  }
}, [isCommentsOpen]);  // Only run when isCommentsOpen changes
```

### useTransition: Non-Blocking Updates

From `src/components/planning/IdeaCard.tsx:100`:

```typescript
// useTransition lets you mark updates as "low priority"
// The UI stays responsive during slow operations

const [isPending, startTransition] = useTransition();

// In a form submit handler:
const handleSubmit = (event) => {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);

  // Wrap the slow operation in startTransition
  startTransition(async () => {
    try {
      await onSchedule(formData);  // Slow server call
      toast.success("Event created!");
    } catch {
      toast.error("Failed to schedule");
    }
  });
};

// isPending is true while the transition is running
<button disabled={isPending}>
  {isPending ? "Creating..." : "Create event"}
</button>
```

---

## 5. Next.js: Full-Stack React Framework

Next.js adds server-side capabilities to React.

### Server Components vs Client Components

**Server Components** (default in Next.js App Router):
- Run on the server only
- Can directly access databases, file system
- Cannot use useState, useEffect, onClick, etc.
- Rendered to HTML on server, sent to browser

**Client Components** (marked with "use client"):
- Run in the browser
- Can use interactivity (state, effects, events)
- Cannot directly access server resources

From `src/components/planning/IdeaCard.tsx:1`:

```typescript
"use client";  // This makes it a Client Component

// Now we can use hooks and event handlers
import { useState, useTransition } from "react";

export default function IdeaCard({ idea }) {
  const [isOpen, setIsOpen] = useState(false);  // OK in client component

  return (
    <button onClick={() => setIsOpen(true)}>  {/* OK in client component */}
      Open
    </button>
  );
}
```

From `src/app/spaces/[spaceId]/calendar/page.tsx` (Server Component - no "use client"):

```typescript
// This is a Server Component (no "use client" directive)
// It runs on the server, can directly query database

export default async function CalendarPage({ params, searchParams }: PageProps) {
  const userId = await requireUserId();

  // Direct database access - only possible on server
  const events = await listEventsForSpace({
    spaceId: space.id,
    from: monthStart,
    to: monthEnd,
  });

  // Pass data down to client components
  return (
    <IdeasColumn
      ideas={ideasForPlanning}
      currentUserId={userId}
    />
  );
}
```

### Server Actions

Server Actions are functions that run on the server but can be called from the client. Think of them like API endpoints, but simpler.

From `src/app/spaces/[spaceId]/calendar/page.tsx:156-237`:

```typescript
// Define a server action inside a Server Component
async function handleCreate(formData: FormData) {
  "use server";  // This marks it as a Server Action

  // This code runs on the SERVER, not in the browser
  const currentUserId = await requireUserId();
  const title = formData.get("title")?.toString().trim() ?? "";

  // Direct database access
  const event = await createEventForSpace(spaceIdForActions, currentUserId, {
    title,
    // ... other fields
  });

  // Can call external APIs securely (API keys stay on server)
  if (addToGoogleCalendar) {
    await createGoogleCalendarEvent(currentUserId, {
      id: event.id,
      // ...
    });
  }
}

// Pass to client component
return (
  <CalendarAddControls
    onCreateEvent={handleCreate}  // Client can call this
  />
);
```

In the client component:

```typescript
"use client";

export default function CalendarAddControls({ onCreateEvent }) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        onCreateEvent(formData);  // Calls the server action
      }}
    >
      <input name="title" />
      <button type="submit">Create</button>
    </form>
  );
}
```

### Dynamic Routes

File: `src/app/spaces/[spaceId]/calendar/page.tsx`

The `[spaceId]` in the path means it's a dynamic route parameter:

```typescript
// URL: /spaces/abc123/calendar
// The [spaceId] folder name becomes a parameter

type PageProps = {
  params: Promise<{ spaceId: string }>;  // Contains route parameters
  searchParams?: Promise<{ month?: string }>;  // Contains ?query=params
};

export default async function CalendarPage({ params, searchParams }: PageProps) {
  const { spaceId } = await params;  // "abc123"
  const search = await searchParams;
  const month = search?.month;  // from ?month=2024-02
}
```

### Cookies and Authentication

From `src/app/spaces/[spaceId]/calendar/page.tsx:57-66`:

```typescript
import { cookies } from "next/headers";

export default async function CalendarPage({ params, searchParams }: PageProps) {
  // Read cookies on the server
  const cookieStore = await cookies();
  const calendarWeekStart =
    cookieStore.get("cm_calendar_week_start")?.value === "monday"
      ? "monday"
      : "sunday";

  // Check authentication
  const userId = await requireUserId();  // Throws/redirects if not logged in
}
```

---

## 6. Common Patterns in This Codebase

### Form Handling with FormData

From `src/components/planning/IdeaCard.tsx:311-326`:

```typescript
<form
  onSubmit={(event) => {
    event.preventDefault();  // Don't reload the page
    const formData = new FormData(event.currentTarget);

    // FormData is like a dict of form field values
    // Server action receives this and extracts values:
    // formData.get("date") -> "2024-02-15"

    startTransition(async () => {
      await onSchedule(formData);
    });
  }}
>
  <input type="hidden" name="ideaId" value={idea.id} />
  <input name="date" type="date" required />
  <input name="time" type="time" />
  <button type="submit">Create event</button>
</form>
```

### Optimistic Updates

From `src/components/planning/IdeaCard.tsx:245-268`:

```typescript
// Show the change immediately, before server confirms

const [localComments, setLocalComments] = useState(comments);

const handleSubmit = (event) => {
  const formData = new FormData(event.currentTarget);
  const content = formData.get("content")?.toString().trim() ?? "";

  // 1. Create optimistic (fake) comment immediately
  const optimistic = {
    id: `temp-${Date.now()}`,
    body: content,
    createdAt: new Date().toISOString(),
    author: { id: currentUserId, name: "You", email: "you" },
  };

  // 2. Update UI immediately
  setLocalComments((prev) => [...prev, optimistic]);

  // 3. Clear the input
  event.currentTarget.reset();

  // 4. Send to server (user sees change while this happens)
  startTransition(async () => {
    try {
      await onAddComment(formData);
      toast.success("Comment added");
      // Server response will refresh with real data
    } catch {
      toast.error("Failed to add comment");
      // Could revert optimistic update here
    }
  });
};
```

### The Prisma ORM Pattern

From `src/lib/integrations/google/calendar.ts:88-139`:

```typescript
// Prisma is like SQLAlchemy for JavaScript
// It provides type-safe database queries

// Find one record
const account = await prisma.externalAccount.findUnique({
  where: { id: externalAccountId },
});

// Find first matching
const account = await prisma.externalAccount.findFirst({
  where: {
    userId,
    provider: 'GOOGLE',
    revokedAt: null,  // Only non-revoked accounts
  },
});

// Find with relations (like SQLAlchemy joinedload)
const link = await prisma.externalEventLink.findUnique({
  where: { eventId },
  include: { externalAccount: true },  // Include related record
});

// Update a record
await prisma.externalAccount.update({
  where: { id: externalAccountId },
  data: {
    accessToken: encryptToken(accessToken),
    tokenExpiresAt: tokenExpiresAt,
  },
});

// Create a record
await prisma.externalEventLink.create({
  data: {
    eventId: event.id,
    externalAccountId: account.id,
    externalEventId: response.data.id,
    calendarId,
  },
});

// Transaction (all-or-nothing)
await prisma.$transaction(async (tx) => {
  await tx.externalAvailabilityBlock.deleteMany({
    where: { externalAccountId },
  });
  await tx.externalAvailabilityBlock.createMany({
    data: busyBlocks,
  });
});
```

### Error Handling Pattern

```typescript
// Try/catch with proper error typing
try {
  const result = await someAsyncOperation();
  return { success: true, data: result };
} catch (error) {
  console.error('Operation failed:', error);

  // TypeScript: error is 'unknown', need to check type
  return {
    success: false,
    error: error instanceof Error ? error.message : 'Unknown error'
  };
}
```

### Token Refresh Pattern

From `src/lib/integrations/google/calendar.ts:104-132`:

```typescript
// Check if token needs refresh (within 5 minutes of expiry)
const needsRefresh = !tokenExpiresAt ||
  tokenExpiresAt.getTime() < Date.now() + 5 * 60 * 1000;

if (needsRefresh && account.refreshToken) {
  try {
    const refreshed = await refreshAccessToken(decryptedRefreshToken);
    accessToken = refreshed.accessToken;

    // Persist new token to database
    await prisma.externalAccount.update({
      where: { id: externalAccountId },
      data: {
        accessToken: encryptToken(accessToken),
        tokenExpiresAt: refreshed.expiresAt,
      },
    });
  } catch (error) {
    // Mark account as revoked if refresh fails
    await prisma.externalAccount.update({
      where: { id: externalAccountId },
      data: { revokedAt: new Date() },
    });
    throw new Error('Failed to refresh token. Please reconnect.');
  }
}
```

---

## Quick Reference

### Common File Extensions

| Extension | Purpose |
|-----------|---------|
| `.ts` | TypeScript (no JSX) |
| `.tsx` | TypeScript with JSX (React components) |
| `.js` | JavaScript |
| `.jsx` | JavaScript with JSX |

### Folder Structure in This Project

```
src/
├── app/                    # Next.js App Router (pages and API routes)
│   ├── api/               # API endpoints
│   ├── spaces/[spaceId]/  # Dynamic routes
│   └── login/             # Static routes
├── components/            # Reusable React components
│   ├── planning/         # Feature-specific components
│   └── ui/               # Generic UI components
└── lib/                   # Shared utilities and business logic
    ├── integrations/     # External service integrations
    └── prisma.ts         # Database client
```

### Key Dependencies

| Package | Purpose | Python Equivalent |
|---------|---------|-------------------|
| `react` | UI components | - |
| `next` | Full-stack framework | FastAPI + Jinja2 |
| `prisma` | Database ORM | SQLAlchemy |
| `googleapis` | Google API client | google-api-python-client |
| `typescript` | Type checking | mypy |
| `tailwindcss` | CSS utility classes | - |

---

## Further Learning

1. **TypeScript**: [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
2. **React**: [React Docs](https://react.dev/)
3. **Next.js**: [Next.js Docs](https://nextjs.org/docs)
4. **Prisma**: [Prisma Docs](https://www.prisma.io/docs)
