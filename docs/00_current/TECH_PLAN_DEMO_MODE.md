# Technical Plan: Demo Mode

Status: **Implemented** on branch `demo-mode` (2026-07-31). Photo delivery was
superseded on 2026-08-04: the active fixture now stores real Place IDs and loads
fresh Places photos in the browser instead of requiring `public/demo/` assets.
Created: 2026-07-31

## Goal

A shareable link (`/demo`) that drops anyone — no account, no signup — into a Duet space that is already full of plans, ideas, memories and photos. The visitor can tap through every surface and change things freely. Nothing they do touches real data, and the sandbox disappears on its own.

This is a sales/presentation surface, not the first-run experience. It is separate from, and does not replace, `OnboardingTour` or `/spaces/onboarding`.

## Product decisions

Decided 2026-07-31 with Yevhenii:

- **Fresh sandbox per visitor.** Each `/demo` click provisions its own demo user + demo space and expires after 24h. Two people opening the link never see each other's edits.
- **Fully interactive.** The demo user is a normal user with a normal session; every mutation works. Only externally-costly or externally-visible actions are blocked (see Guardrails).
- **Photos bundled in the repo** under `public/demo/`. No API keys, no runtime image fetch, works in preview deployments.
- **Land straight in the space**, on the calendar/today view, with a persistent demo bar. The 3-step tour is reachable from that bar but does not block on entry.
- **Content is generated relative to "now"**, never cloned from a fixed snapshot. A demo whose "today" is empty and whose "upcoming plans" are in the past is worse than no demo.

## How this fits the existing architecture

Facts verified against the current tree — these are what make the plan cheap:

| Fact | Consequence |
|---|---|
| Auth is a DB-backed session token in the `cm_session` cookie (`src/lib/session.ts`), created by `createSession(userId)` + `setSessionCookie(token)`. | `/demo` can mint a real session for a demo user. No parallel auth path, no "demo mode" branching in `requireUserId()`. |
| Every mutation is an inline server action inside a page (`calendar/page.tsx`, `events/[eventId]/page.tsx`, `ideas/[ideaId]/page.tsx`, `settings/page.tsx`) or an API route, gated by `requireUserId()` + membership. | A demo user with a real membership gets the entire product working for free. **No per-action demo branching is needed** except for the guardrail list. |
| `middleware.ts` matches only `/feedback`, `/spaces/:path*`, `/events/:path*`, `/api/couple-spaces/:path*`, `/api/spaces/:path*`. | `/demo` is already unguarded. No middleware change required. |
| `PlanningCover` renders a native `<img>` with a raw `src`. | Local `public/demo/*.webp` paths render with no `next/image` remote allowlist work. |
| `IdeaCard.tsx:121` filters `placePhotoUrls` with `/^https?:\/\//i`. | Demo cover URLs must be **absolute** (`${NEXT_PUBLIC_APP_URL}/demo/…`), otherwise idea covers silently fall back to the placeholder. This is the one gotcha in the whole plan. |
| `Photo.storageUrl` is a free-form string; `Event.placePhotoUrls` / `Idea.placePhotoUrls` are free-form JSON arrays. | Demo photos need no upload pipeline — write the URLs directly. |
| Only `Session` has `onDelete: Cascade`. | Sandbox cleanup must delete in explicit dependency order (see Phase 4). |
| `scripts/seed-demo.ts` already writes a plausible content set, but requires a pre-existing space and members. | Good reference for content shape; not reusable at runtime as-is. Phase 5 refactors it onto the shared fixture. |

## Scope

### In scope

- `/demo` provisioning route and the demo session it creates.
- A content fixture module that builds a full space from date offsets.
- Bundled demo photo assets.
- Demo banner + exit/convert CTA.
- Guardrails on external-effect actions.
- Expiry and cleanup.
- `DEMO_MODE_ENABLED` env flag.

### Out of scope

- Changing the real onboarding flow.
- Analytics on demo usage (can be added later behind the same flag).
- Multi-language demo content.
- Letting a visitor convert a sandbox into a real account carrying its data over. The CTA links to `/register` with an empty space; data migration is a later enhancement.

## Data model

Two additive columns each, in one migration. Nothing existing changes.

```prisma
model User {
  // …
  isDemo          Boolean   @default(false)
}

model CoupleSpace {
  // …
  isDemo          Boolean   @default(false)
  demoExpiresAt   DateTime?

  @@index([isDemo, demoExpiresAt])
}
```

`isDemo` on `User` is what the guardrails read. `demoExpiresAt` on `CoupleSpace` is what cleanup reads. Both default false, so every existing row is unaffected and the migration is a pure `ALTER TABLE ADD COLUMN`.

Demo users get emails in a reserved, non-deliverable namespace: `demo-<random>@demo.duet.invalid`, where `<random>` comes from `crypto.randomBytes().toString("base64url")` — the same idiom already used for invite codes in `src/lib/couple-spaces.ts`, so no new dependency. `.invalid` is reserved by RFC 2606 and can never collide with a real signup or receive mail. The password hash is a random value that is never given out — demo accounts are unreachable through `/login`.

## Content fixture

New module `src/lib/demo/fixture.ts`. One exported function:

```ts
export function buildDemoContent(now: Date): DemoContent
```

It returns plain data — no Prisma calls — so it is unit-testable and reusable by both the runtime provisioner and `scripts/seed-demo.ts`.

Every date is an offset from `now`, so the demo always reads as live:

| Bucket | Count | Timing | Purpose |
|---|---|---|---|
| Today's plans | 1–2 | today, one in the evening | Populates the "today" summary in `spaces/[spaceId]/layout.tsx` and the mobile top bar |
| Upcoming plans | 5–6 | +2d … +6w, each with a cover photo | The picture-heavy "what's ahead" rail — the main thing the demo is selling |
| Ideas | 7–8 | mixed `NEW`/`PLANNED`, 2 with comments, most with covers | The ideas column |
| Memories | 8–10 | −3d … −8mo, spread across months | The memories timeline; several months so scrolling shows real grouping |
| Photos | 2–4 per memory, cover flagged | | `EventPhotoGallery` and memory covers |
| Ratings | on ~70% of memories | mixed 3–5 hearts, 2 with notes | Shows `HeartRating` in a populated state |
| Comments | ~12 | alternating between the two members | Shows a real back-and-forth, not one voice |
| Busy blocks | 2 | one spanning a future weekend, one recent | Availability rendering on the calendar |
| Activity | derived | | The activity feed fills itself from the writes above |

Two members: "Alex" and "Sam", with distinct `Membership.alias` / `initials` / `color` so creator colours are visibly different. The visitor is signed in as Alex.

Content is written once, in English, deliberately generic-couple (no names of real places that could look like an endorsement). Place fields (`placeName`, `placeAddress`) are filled with plausible fictional venues; `placeLat`/`placeLng` are omitted so no map tile requests or Google Maps key are needed.

## Photo assets

`public/demo/` — roughly 20–25 images, sourced from Unsplash/Pexels under their licences, converted to `.webp`, resized to ~1200px wide, target ≤ 90KB each (~2MB total). A `public/demo/CREDITS.md` records source and licence per file.

Naming is semantic and stable — `dinner-rooftop.webp`, `hike-ridge.webp`, `market-morning.webp` — so the fixture reads clearly and images can be swapped without touching code.

Helper in the fixture module:

```ts
const demoImage = (name: string) =>
  `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/demo/${name}`;
```

Absolute, per the `IdeaCard` filter noted above. `NEXT_PUBLIC_APP_URL` is already an established env var.

## Guardrails

The demo user is a normal user, so the guard list is short and specific. Each is a `user.isDemo` check that returns a friendly refusal rather than throwing.

| Surface | Why | Behaviour in demo |
|---|---|---|
| `handleUploadPhoto` (`events/[eventId]/page.tsx:323`) | Cloudinary upload cost + storing stranger-uploaded files | Upload control replaced with "Photo upload is disabled in the demo" |
| `/api/integrations/google/start` and the Google settings card | Real OAuth consent against your Google project | Card renders in a disabled state with an explanatory line |
| `/api/couple-spaces/[spaceId]/invite` + invite card | Would emit a working join code into a throwaway space | Card shows a static fake code, copy disabled |
| `/feedback` (Resend) | Would send you a mail per curious visitor | Link hidden in demo; page redirects to the space |
| Password reset / email reminders | Address is `.invalid` | Not reachable — `/login` never resolves a demo account |
| ICS export (`/api/spaces/[spaceId]/calendar.ics`) | Harmless, and nice to show | **Allowed** |
| Everything else — create/edit/delete events, ideas, comments, ratings, busy blocks, settings, space rename | Sandbox, self-destructs | **Allowed** |

New helper `src/lib/demo/guard.ts`:

```ts
export async function isDemoSession(): Promise<boolean>
export function assertNotDemo(action: string): never | void
```

## Abuse & cost control

A public link that writes to the database needs a ceiling.

1. **Cookie reuse first.** If the request already carries a valid, unexpired demo session, `/demo` redirects into the existing sandbox instead of provisioning a new one. Refreshes and re-clicks cost nothing.
2. **IP rate limit** on provisioning, reusing the in-memory bucket pattern from `src/lib/auth-rate-limit.ts` (`getClientIp`) — e.g. 5 sandboxes per IP per hour.
3. **Global cap.** If live (unexpired) demo spaces exceed a configured ceiling (default 500), `/demo` serves a static "demo is busy, try again shortly" page rather than provisioning.
4. **Kill switch.** `DEMO_MODE_ENABLED=false` (the default when unset) makes `/demo` a 404. Nothing about demo mode is reachable in an environment that has not opted in.

## Implementation phases

Each phase is independently reviewable. Suggested branch: `demo-mode`.

### Phase 1 — Data + fixture (no UI)

- Migration adding `User.isDemo`, `CoupleSpace.isDemo`, `CoupleSpace.demoExpiresAt` + index.
- `src/lib/demo/fixture.ts` — `buildDemoContent(now)`, pure data.
- `src/lib/demo/provision.ts` — `provisionDemoSpace()`: creates 2 users + space + memberships, writes the fixture in one `prisma.$transaction`, sets `demoExpiresAt = now + 24h`, returns `{ spaceId, sessionToken }`.
- Unit test: `buildDemoContent` places at least one event today, ≥5 in the future, ≥8 in the past, and every referenced image filename exists in `public/demo/`.

Gate: `npx tsc --noEmit`, `npm run lint`, new unit test green.

### Phase 2 — Entry route + photos

- Add the `public/demo/` assets and `CREDITS.md`.
- `src/app/demo/route.ts` (GET): flag check → existing-demo-session reuse → rate limit → global cap → `provisionDemoSpace()` → `setSessionCookie` → redirect to `/spaces/<id>/calendar`.
- `.env.example` + `DEPLOYMENT.md`: `DEMO_MODE_ENABLED`, `DEMO_MAX_LIVE_SPACES`, `DEMO_TTL_HOURS`.

Gate: clicking `/demo` locally lands in a populated space; every card shows a photo, including idea covers (the absolute-URL check).

### Phase 3 — Demo shell UI

- `src/components/demo/DemoBar.tsx` — slim persistent bar, rendered from `spaces/[spaceId]/layout.tsx` when the space is a demo, **in place of** `BetaNoticeBar` (not stacked above it — two banners is exactly the mobile first-screen problem `BetaNoticeBar` was already trimmed for). Contents: "Demo space — nothing here is real", a "How it works" link that opens `OnboardingTour` with `forceOpen`, and a "Create your own space" CTA to `/register`.
- Demo-aware hiding/disabling per the Guardrails table.
- `/demo` CTA on the landing page (`src/app/page.tsx`), as a third, quieter button next to "Create your space" / "Log in".

Gate: 📸 mobile screenshot review at 390px and 360px across calendar, ideas, memories, event detail — the demo bar must not eat the first screen.

### Phase 4 — Expiry & cleanup

- `src/lib/demo/cleanup.ts` — `deleteExpiredDemoSpaces()`. Deletion order matters because only `Session` cascades:

  `Reaction` → `Rating` → `Photo` → `Note` → `ChangeLogEntry` → `AvailabilityBlock` → `Event` (before `Idea`, since `Event.originIdeaId` references it) → `Idea` → `Membership` → `CoupleSpace` → `Session` → `User`.

- `src/app/api/demo/cleanup/route.ts` — POST, protected by a `CRON_SECRET` bearer check.
- `vercel.json`: add a `crons` entry running it hourly. (The file currently has no `crons` key.)
- Belt and braces: `/demo` opportunistically deletes a small batch of expired sandboxes on each provision, so cleanup still happens if the cron is never wired up.
- Test: provision a sandbox, backdate `demoExpiresAt`, run cleanup, assert zero orphan rows across all eleven tables.

Gate: full test suite green; no foreign-key errors in the cleanup path.

### Phase 5 — Consolidation (optional, same branch or follow-up)

- Rewrite `scripts/seed-demo.ts` to call `buildDemoContent()` so dev seeding and demo mode can never drift apart.
- Playwright smoke test: `/demo` → space renders → create an idea → it appears. Guarded so it only runs when `DEMO_MODE_ENABLED=true`.

## Testing

- Unit: fixture shape and date distribution; image-filename existence.
- Unit: cleanup deletes everything and touches no non-demo row (assert a real space seeded alongside survives untouched).
- Playwright smoke: the `/demo` → interact → success path.
- Manual: two browsers open `/demo` simultaneously and get different `spaceId`s.
- Manual: with `DEMO_MODE_ENABLED` unset, `/demo` is a 404.

## Risks

| Risk | Mitigation |
|---|---|
| Demo rows pollute production analytics or user counts | `isDemo` flag makes them filterable everywhere; state it in `ARCHITECTURE.md` |
| Cleanup cron silently stops, DB fills with sandboxes | Opportunistic cleanup on provision + the global live-space cap both bound growth independently |
| A visitor treats the demo as real and reports "bugs" | Persistent demo bar wording; feedback link hidden in demo |
| Demo content ages badly (venue names, tone) | All copy lives in one fixture file; swapping it is a single-file edit |
| Photo licences | `public/demo/CREDITS.md` per file, checked before the assets land |

## Open questions

- Should the demo space name be branded ("Alex & Sam") or neutral ("Demo space")? Affects the top bar on every screenshot.
- 24h TTL — long enough that someone can revisit a link you sent yesterday, short enough to bound cost. Confirm.
- Do you want a `/demo?tour=1` variant for links where the tour *should* auto-open, for a colder audience?

## Related docs

- `docs/00_current/ARCHITECTURE.md` — update route surface + data model on implementation
- `docs/00_current/DECISIONS.md` — record the four product decisions above
- `docs/00_current/rollout_plan.md` — track phase status
- `docs/00_current/DEPLOYMENT.md` — new env vars and the cron entry
