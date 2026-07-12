# Duet — Design & UX Review (Phase 3), mobile-first

Date: 2026-07-11 · Reviewer pass at 390px (primary) with code cross-reference.
Scope: the design/UX enhancement pass in `REVIVAL_PLAN.md` Phase 3. Bug fixes live in Phase 2; this doc is *enhancements only*, prioritized mobile-first.

> **Method note.** The in-app preview browser could not produce screenshots this session (the screenshot action times out; the page itself renders fine — a11y-tree reads and interaction work). So this review is structural + code-grounded, cross-checked against live 390px accessibility snapshots. Pixel-level "feel" items (spacing rhythm, contrast in situ, real-device iOS) are called out as **needs-screenshot** and belong to the iterative screenshot sessions with Yevhenii.

## Headline

The June redesign already did a lot of the mobile heavy lifting. The mobile **calendar** (`MobileAgendaView`: collapsible month strip, day-focused view, past/upcoming toggles) and **empty states** are in good shape — better than the revival brief assumed. So Phase 3's highest-value work is **not** a card redesign; it's **first-run for the joining partner** and **consistency cleanup**. Recommend reordering the plan's 3a–3d accordingly.

Severity: **P1** (do this pass) / **P2** (nice) / **P3** (later). Effort: S/M/L.

---

## 1. First-run & onboarding (highest value — the "partner joins" moment)

| # | Finding | Severity | Effort |
|---|---------|----------|--------|
| FR-1 | **The joining partner's path is buried on mobile.** `spaces/onboarding/page.tsx` leads with the header "Create your cozy space" and the **Create** form; **Join with invite** is the *second* card, so on a 390px stack the partner arriving from an invite must scroll past a create form to reach the box they need — even when `?invite=` is present and prefilled. This is exactly the "girlfriend joining" case the plan prioritizes. **Fix:** when `?invite=` is present, promote Join to the top and de-emphasize Create (and adjust the header copy to "Join your partner's space"). | **P1** | S |
| FR-2 | **Onboarding page is very long on mobile.** Header + 2 forms + a 4-step "How Duet Works" + a 4-item "First 5 Minutes" checklist + a tabs grid all stack vertically. For a brand-new user on a phone it's a long scroll before anything actionable is complete. **Fix:** collapse the explainer/checklist into a single compact accordion or move below the fold with an anchor; keep the forms + one-line value prop above the fold. | **P2** | S–M |
| FR-3 | **The empty app's first screen.** After creating/joining, the partner lands on `/calendar`. Empty states there are good (month strip + "Tap a day to add your first event"), and the `OnboardingTour` auto-opens (5-step modal, per-space localStorage — correctly fires for both partners). Two things to confirm on device: (a) the 5-step tour modal height on 360px (each step has a 3-item highlights list — risk of vertical clipping), and (b) that the very first prompted action matches what we want partner #2 to do first. **Needs-screenshot + a decision (see Q&A).** | **P1** | S |

---

## 2. Consistency (tokens, type, spacing)

| # | Finding | Severity | Effort |
|---|---------|----------|--------|
| C-1 | **Component-level palette hardcoding (audit F19).** Phase 1 collapsed the duplicate *token* palettes, but ~35 components still hardcode `rose-*`/`amber-*`/`slate-*`/`sky-*`/`violet-*` Tailwind classes alongside the CSS-variable tokens. A brand tweak still means editing dozens of files. **Fix:** migrate the semantic ones (actions, accents, status) to tokens; keep only genuinely decorative gradients inline. Mechanical, reviewable in slices. | **P2** | M |
| C-2 | **No applied type scale on mobile.** Cards/agenda use one-off sizes: `text-[14.5px]`, `text-[10px]`, `text-[11px]`, `text-[9.5px]` micro-labels. Readable-but-ad-hoc. **Fix:** define 4–5 mobile type steps as utilities/tokens and apply; kills the 9–10px squint-text the audit flagged (F20). | **P2** | M |
| C-3 | **Tiny tap targets on the calendar top controls.** The "+ Event" / "Block time" pills in `add-controls.tsx` are `py-2` (~32px tall) — under the 44px touch minimum, and they're the empty-state's recommended path ("use the controls at the top"). The FAB already covers create on mobile, so either enlarge these pills or lean on the FAB and shrink their prominence. | **P2** | S |

---

## 3. Cards / blocks (the "rethink" — recommend *refine*, not redesign)

The plan asked for 2–3 card variants and picking one. But the June work already moved mobile to a coherent model: plan/idea cards are compact tap-target tiles (date/photo block left, title+meta right, chevron, no inline buttons), memory cards are inline-thumb rows, agenda rows have an accent stripe + chevron. This is good and internally consistent.

| # | Finding | Severity | Effort |
|---|---------|----------|--------|
| CB-1 | Rather than a from-scratch redesign, **refine the existing tile**: unify the accent-stripe treatment across plan/idea/agenda/memory so all four read as one family (currently each is slightly different), and standardize the meta row (time · place · creator) order and truncation. | **P2** | M |
| CB-2 | If you *do* want fresh directions, I'll produce a single static `card-variants.html` mockup (2–3 options at 390px) for a screenshot decision — but my recommendation is to bank the June model and spend the effort on first-run. **Decision in Q&A.** | — | — |

---

## 4. Loading & error states

| # | Finding | Severity | Effort |
|---|---------|----------|--------|
| LE-1 | Mutations use `sonner` toasts and buttons have `loading` states; per-route `loading.tsx` skeletons exist for the main routes. Baseline is decent. **Gap to close:** audit every async action for a visible pending state + a surfaced error (not a silent no-op) — spot-check idea/comment/photo/rating flows. | **P2** | M |
| LE-2 | **Memory covers still client-probe (audit F16).** Each memory card resolves its cover with `new Image()` on mount; a long memories list does N image probes on a phone (slow, battery). **Fix:** resolve/persist the cover URL server-side at write time. | **P2** | M |

---

## 5. Known audit remainders that surface on mobile (fold in here)

- **F13** — Activity search is desktop-only and only searches the current page; Memories year filter hidden on mobile. Mobile users can't search history. (M)
- **F21** — Activity filter chips use `role="tablist"`/`tab` without tab semantics; should be `aria-pressed` toggle buttons. (S, a11y)
- **F7** — Idea card actions are hover-only reveal with no `focus-within` (desktop keyboard a11y; low mobile impact). (S)
- **Bug #2 (button cutoff)** and **Bug #4 (calendar usability)** — carried from Phase 2. Bug #4 looks largely resolved by the June redesign in code; both need **your real-device screenshots** to confirm/target.

---

## Recommended Phase 3 order (revised, mobile-first)

1. **First-run (FR-1, FR-3, FR-2)** — the highest-leverage UX for the partner-joining moment.
2. **Consistency (C-1, C-2, C-3)** — makes every later change cheaper; kills squint-text and small targets.
3. **Cards (CB-1 refine)** — only after 1–2; skip a full redesign unless you want it.
4. **Loading/error + F13/F21 (LE-1, LE-2)** — polish.
5. **Bug #2 / #4** — once you send device screenshots.

## Decisions taken (2026-07-11)

- **Cards:** refine the existing June model (CB-1), no from-scratch redesign.
- **First action for a joining partner:** "Add a date idea."
- **Visual layer:** proceed with high-confidence structural fixes now; pixel-polish waits on screenshots (below).

## Implemented in this phase so far (branch `design-pass`)

- **FR-1 — invite-first onboarding.** When `?invite=` is present, the onboarding page now leads with "Join your partner on Duet", puts the Join card first on mobile, prefills + emphasizes it. Verified in `tests/onboarding.spec.ts`.
- **First action = add an idea.** The onboarding tour's final CTA is now "Add your first idea" and deep-links into the create-idea flow (`?action=idea`) instead of just closing.

## Screenshot checklist for Yevhenii (visual/real-device — send when you can)

These need real-device eyes; I'll target fixes precisely once you send them. Capture on your phone (portrait):

1. **Button cutoff (bug #2)** — the screen/where a button is clipped or mispositioned. Include a few px of the surrounding edge so I can see if it's safe-area or overflow.
2. **Mobile calendar feel (bug #4)** — calendar tab: month strip collapsed + expanded, and the agenda with a few events/blocks. Is anything cramped/unusable?
3. **Onboarding tour on your phone** — especially step 1 and the last step, to check the 5-step modal height on your device.
4. **Any screen that simply feels off** — spacing, contrast in sunlight, text truncation with real content.

Everything else in this doc (FR-2, consistency C-1/C-2/C-3, card refinement CB-1, loading/error LE-1/LE-2, F13/F21) I can progress from code; screenshots will sharpen the visual calls.
