# Couple Moments - Rollout Plan

**Created:** January 27, 2026
**Status:** Pre-production

---

## Table of Contents
1. [UI Testing Checklist](#ui-testing-checklist)
2. [UX Enhancement Opportunities](#ux-enhancements)
3. [Known Bugs & Issues](#known-bugs)
4. [Photo Upload Implementation](#photo-upload)
5. [Deployment Checklist](#deployment)
6. [Future Roadmap](#roadmap)

---

## 1. UI Testing Checklist {#ui-testing-checklist}

### Authentication Flow
| Test Case | Route | Status |
|-----------|-------|--------|
| Register new user with valid data | `/register` | [ ] |
| Register with existing email (should fail) | `/register` | [ ] |
| Register with weak password | `/register` | [ ] |
| Login with valid credentials | `/login` | [ ] |
| Login with wrong password | `/login` | [ ] |
| Login with non-existent email | `/login` | [ ] |
| Logout clears session | Nav → Logout | [ ] |
| Protected routes redirect to login | `/spaces/*` when logged out | [ ] |

### Space Onboarding
| Test Case | Route | Status |
|-----------|-------|--------|
| Create new space | `/spaces/onboarding` | [ ] |
| Space name validation (empty, too long) | `/spaces/onboarding` | [ ] |
| Redirect to calendar after creation | `/spaces/onboarding` | [ ] |

### Calendar Page
| Test Case | Route | Status |
|-----------|-------|--------|
| Calendar renders current month | `/spaces/[id]/calendar` | [ ] |
| Navigate to previous month | Prev button | [ ] |
| Navigate to next month | Next button | [ ] |
| Navigate to today | Today button | [ ] |
| Toggle compact/comfortable view | Density toggle | [ ] |
| Click day opens new event modal | Click any day | [ ] |
| Events display on correct days | Visual check | [ ] |
| Availability blocks display correctly | Visual check | [ ] |
| Past days show reduced opacity | Visual check | [ ] |
| Today highlighted with border | Visual check | [ ] |
| Export calendar (ICS download) | Export button | [ ] |

### Event Creation (Modal)
| Test Case | Route | Status |
|-----------|-------|--------|
| Open via day click | Calendar day click | [ ] |
| Open via "+ Event" button (nav) | Nav button | [ ] |
| Open via "New event" button (momentum) | Momentum pane | [ ] |
| Title required validation | Submit without title | [ ] |
| Date required validation | Submit without date | [ ] |
| Time is optional | Submit without time | [ ] |
| Tags comma-separated input | Add tags | [ ] |
| Description textarea | Add description | [ ] |
| Cancel closes modal | Cancel button | [ ] |
| ESC key closes modal | Keyboard | [ ] |
| Click backdrop closes modal | Click outside | [ ] |
| Success toast on creation | Submit valid form | [ ] |
| Event appears on calendar | After creation | [ ] |

### Availability Block
| Test Case | Route | Status |
|-----------|-------|--------|
| Create availability block | "+ Unavailable" button | [ ] |
| Title required | Submit without title | [ ] |
| Start/end date required | Submit without dates | [ ] |
| Block spans multiple days | Create multi-day block | [ ] |
| Edit existing block | Click block on calendar | [ ] |
| Update block success | Edit and save | [ ] |
| Block displays on calendar | Visual check | [ ] |

### Ideas (Planning Section)
| Test Case | Route | Status |
|-----------|-------|--------|
| Create new idea | "+ Idea" button | [ ] |
| Idea appears in list | After creation | [ ] |
| Add comment to idea | Comment input | [ ] |
| Comments display correctly | Visual check | [ ] |
| Schedule idea as event | Schedule button | [ ] |
| Delete idea | Delete button | [ ] |
| Delete confirmation dialog | Before delete | [ ] |
| Expand/collapse idea details | Click idea | [ ] |

### Upcoming Plans (Momentum Pane)
| Test Case | Route | Status |
|-----------|-------|--------|
| Shows next 14 days of events | Visual check | [ ] |
| Event cards link to detail | Click event | [ ] |
| Comment count displays | Visual check | [ ] |
| "Show more" pagination | If >5 events | [ ] |
| Empty state when no plans | Delete all events | [ ] |

### Event Detail Page
| Test Case | Route | Status |
|-----------|-------|--------|
| Page loads with event data | `/events/[id]` | [ ] |
| Back button returns to calendar | Back link | [ ] |
| Edit event opens modal | Edit button | [ ] |
| Update event saves changes | Edit and save | [ ] |
| Add comment | Comment input | [ ] |
| Comments display in order | Visual check | [ ] |
| Delete event | Delete button | [ ] |
| Rate event (heart rating) | Click hearts | [ ] |
| Tags display correctly | Visual check | [ ] |
| Place info displays if present | Visual check | [ ] |
| "Do this again" creates repeat | Repeat button | [ ] |

### Memories Page
| Test Case | Route | Status |
|-----------|-------|--------|
| Shows past events only | `/spaces/[id]/memories` | [ ] |
| Timeline grouped by month | Visual check | [ ] |
| Filter by tag | Tag filter | [ ] |
| Search by title | Search input | [ ] |
| Event cards link to detail | Click event | [ ] |
| Empty state when no memories | Visual check | [ ] |

### Notes Page
| Test Case | Route | Status |
|-----------|-------|--------|
| Create manual note | Note input | [ ] |
| Note appears in list | After creation | [ ] |
| Delete note | Delete button | [ ] |
| Filter by type (all/free/event) | Filter dropdown | [ ] |
| Search notes | Search input | [ ] |
| Pagination works | If >20 notes | [ ] |
| Event/idea comments show here | Visual check | [ ] |
| Link to parent event/idea | Click link | [ ] |

### Activity Page
| Test Case | Route | Status |
|-----------|-------|--------|
| Shows recent changes | `/spaces/[id]/activity` | [ ] |
| Create/update/delete logged | Visual check | [ ] |
| Grouped by date | Visual check | [ ] |
| Links to related entities | Click links | [ ] |

### Settings Page
| Test Case | Route | Status |
|-----------|-------|--------|
| Space name displays | `/spaces/[id]/settings` | [ ] |
| Members list shows | Visual check | [ ] |
| Invite link generation | Generate button | [ ] |
| Copy invite link | Copy button | [ ] |
| Restart onboarding tour | Restart button | [ ] |

### Navigation
| Test Case | Route | Status |
|-----------|-------|--------|
| All nav links work | Click each | [ ] |
| Active state highlights current | Visual check | [ ] |
| Mobile responsive | Resize window | [ ] |
| "+ Event" and "+ Idea" in nav | Visual check | [ ] |
| Logout works | Logout button | [ ] |

### Responsive Design
| Test Case | Viewport | Status |
|-----------|----------|--------|
| Desktop (1920px) | Full width | [ ] |
| Laptop (1366px) | Medium | [ ] |
| Tablet (768px) | iPad | [ ] |
| Mobile (375px) | iPhone | [ ] |
| Calendar readable on mobile | 375px | [ ] |
| Modals usable on mobile | 375px | [ ] |
| Navigation collapses/wraps | 375px | [ ] |

### Edge Cases
| Test Case | Status |
|-----------|--------|
| Very long event title (100+ chars) | [ ] |
| Very long description | [ ] |
| Many events on same day (5+) | [ ] |
| Many ideas (20+) | [ ] |
| Empty space (no events, ideas, notes) | [ ] |
| Special characters in inputs | [ ] |
| Emoji in titles/descriptions | [ ] |
| Rapid form submissions | [ ] |
| Browser back/forward navigation | [ ] |
| Refresh page with modal open | [ ] |

---

## 2. UX Enhancement Opportunities {#ux-enhancements}

### High Priority
| Enhancement | Current State | Proposed | Effort |
|-------------|---------------|----------|--------|
| Loading states on forms | No feedback during submit | Add spinner/disabled state | Low |
| Optimistic updates | Wait for server response | Update UI immediately | Medium |
| Form validation feedback | Basic HTML5 validation | Inline error messages | Low |
| Keyboard navigation | Limited | Full keyboard support | Medium |
| Toast positioning | Bottom | Configurable position | Low |

### Medium Priority
| Enhancement | Current State | Proposed | Effort |
|-------------|---------------|----------|--------|
| Drag-and-drop events | Not supported | Reschedule by dragging | High |
| Calendar week view | Month only | Add week view option | Medium |
| Dark mode | Not supported | Theme toggle | Medium |
| Event time duration | Start time only | Start + end time | Low |
| Recurring events | Manual "repeat" | Recurrence rules | High |

### Low Priority (Nice to Have)
| Enhancement | Effort |
|-------------|--------|
| Animations on page transitions | Low |
| Skeleton screens while loading | Low |
| Undo delete (soft delete) | Medium |
| Keyboard shortcuts (n=new, etc.) | Low |
| Search across all content | Medium |
| Event templates | Medium |

### Accessibility Improvements
| Item | Status |
|------|--------|
| ARIA labels on interactive elements | [ ] Audit needed |
| Focus management in modals | [ ] Partial |
| Color contrast ratios | [ ] Audit needed |
| Screen reader testing | [ ] Not done |
| Reduced motion support | [ ] Not implemented |

---

## 3. Known Bugs & Issues {#known-bugs}

### Fixed (This Session)
| Bug | Fix |
|-----|-----|
| Modal trapped by backdrop-filter stacking context | Use React Portal |
| "New event" button href missing base path | Use buildCalendarHref() |
| Idea deletion shows false "action failed" | Use revalidatePath() not redirect() |
| Availability block update shows false error | Use revalidatePath() not redirect() |

### To Investigate
| Bug | Severity | Notes |
|-----|----------|-------|
| Sessions lost on server restart | High | Need Redis/DB sessions for production |
| No CSRF protection | Medium | Add token validation |
| No rate limiting | Medium | Add before production |
| Large file in git history | Low | Repo cleanup if needed |

### Technical Debt
| Item | Priority |
|------|----------|
| Move sessions to database/Redis | High |
| Add error boundaries | High |
| Add request logging | Medium |
| Add performance monitoring | Medium |
| Add automated tests | Medium |
| Type-safe environment variables | Low |

---

## 4. Photo Upload Implementation {#photo-upload}

### Current State
- `Photo` model exists in Prisma schema
- `PhotoUploader` component exists (UI shell)
- No actual upload functionality

### Implementation Plan

#### Option A: Cloudinary (Recommended for MVP)
```
Pros: Simple, CDN included, image transformations
Cons: Vendor lock-in, costs at scale
```

**Steps:**
1. Create Cloudinary account, get credentials
2. Configure unsigned upload preset
3. Update `PhotoUploader` to upload directly to Cloudinary
4. Store returned URL in database
5. Display photos in event detail

**Files to modify:**
- `src/components/photos/PhotoUploader.tsx` - Upload logic
- `src/lib/photos.ts` - Create CRUD functions
- `src/app/events/[eventId]/page.tsx` - Display photos
- `.env` - Add Cloudinary credentials

#### Option B: S3 + Presigned URLs
```
Pros: Full control, cheaper at scale
Cons: More setup, need separate CDN
```

#### Option C: Supabase Storage
```
Pros: Good DX, integrated with Postgres
Cons: Another service to manage
```

### Photo Feature Checklist
| Task | Status |
|------|--------|
| Choose storage provider | [ ] |
| Set up account/bucket | [ ] |
| Add environment variables | [ ] |
| Implement upload in PhotoUploader | [ ] |
| Create photos lib functions | [ ] |
| Add photo to event creation | [ ] |
| Display photos on event detail | [ ] |
| Photo gallery modal | [ ] |
| Delete photo functionality | [ ] |
| Image optimization/resizing | [ ] |
| Upload progress indicator | [ ] |
| Error handling for failed uploads | [ ] |

---

## 5. Deployment Checklist {#deployment}

### Pre-Deployment

#### Environment & Secrets
| Item | Status |
|------|--------|
| Production DATABASE_URL configured | [ ] |
| SESSION_SECRET generated (32+ chars) | [ ] |
| GOOGLE_MAPS_API_KEY (if using places) | [ ] |
| Photo storage credentials (if implemented) | [ ] |
| All secrets in hosting platform, not code | [ ] |

#### Database
| Item | Status |
|------|--------|
| Production PostgreSQL provisioned | [ ] |
| Connection pooling configured | [ ] |
| Migrations run on production DB | [ ] |
| Backup strategy in place | [ ] |
| SSL connection enforced | [ ] |

#### Security
| Item | Status |
|------|--------|
| HTTPS enforced | [ ] |
| Secure cookie settings (SameSite, Secure) | [ ] |
| Environment variables not exposed | [ ] |
| No secrets in git history | [ ] |
| Rate limiting configured | [ ] |
| CORS configured if needed | [ ] |

#### Performance
| Item | Status |
|------|--------|
| Production build tested locally | [ ] |
| Static assets cached | [ ] |
| Database indexes verified | [ ] |
| Image optimization | [ ] |

### Hosting Options

#### Vercel (Recommended)
```
Pros: Zero config for Next.js, preview deployments, edge functions
Cons: Costs at scale, vendor lock-in
Setup: Connect GitHub repo, add env vars, deploy
```

#### Railway
```
Pros: Simple, good PostgreSQL integration
Cons: Less Next.js optimization
Setup: Connect repo, add PostgreSQL, configure
```

#### AWS Amplify
```
Pros: AWS ecosystem, scalable
Cons: More complex setup
```

#### Self-hosted (Docker)
```
Pros: Full control, no vendor lock-in
Cons: DevOps overhead, need to manage infra
```

### Deployment Steps (Vercel)
1. Push code to GitHub
2. Import project in Vercel dashboard
3. Add environment variables
4. Configure production branch (main/master)
5. Deploy
6. Set up custom domain (optional)
7. Configure preview deployments for PRs

### Post-Deployment
| Item | Status |
|------|--------|
| Verify all pages load | [ ] |
| Test authentication flow | [ ] |
| Test critical user paths | [ ] |
| Check error logging works | [ ] |
| Set up uptime monitoring | [ ] |
| Document rollback procedure | [ ] |

---

## 6. Future Roadmap {#roadmap}

### Phase 1: Stability (Current)
- [x] Core CRUD functionality
- [x] Authentication
- [x] Calendar view
- [x] Ideas/planning
- [ ] Photo uploads
- [ ] Bug fixes from testing
- [ ] Production deployment

### Phase 2: Polish (Post-Launch)
| Feature | Priority | Effort |
|---------|----------|--------|
| Email notifications/reminders | High | Medium |
| Partner invite flow improvements | High | Low |
| Mobile-optimized experience | High | Medium |
| Dark mode | Medium | Medium |
| Event time ranges (start + end) | Medium | Low |
| Better place search integration | Medium | Medium |

### Phase 3: Engagement
| Feature | Priority | Effort |
|---------|----------|--------|
| Recurring events | High | High |
| Shared wishlists | Medium | Medium |
| Anniversary/milestone tracking | Medium | Low |
| Export memories as PDF | Low | Medium |
| Integration with external calendars (Google, Apple) | Medium | High |

### Phase 4: Growth
| Feature | Priority | Effort |
|---------|----------|--------|
| Mobile app (React Native) | High | Very High |
| Push notifications | High | Medium |
| AI-powered date suggestions | Medium | High |
| Social features (share memories) | Low | Medium |
| Premium tier with advanced features | Medium | Medium |

### Technical Improvements
| Item | Priority |
|------|----------|
| Move to Redis for sessions | High |
| Add comprehensive test suite | High |
| Set up CI/CD pipeline | High |
| Performance monitoring (Vercel Analytics, etc.) | Medium |
| Error tracking (Sentry) | Medium |
| Database query optimization | Medium |
| CDN for static assets | Low |

---

## Testing Commands

```bash
# Run development server
npm run dev

# Production build test
npm run build && npm start

# Database commands
npx prisma studio          # Visual DB browser
npx prisma migrate dev     # Run migrations
npx prisma db push         # Push schema changes

# If adding Playwright later
npx playwright test        # Run e2e tests
npx playwright test --ui   # Visual test runner
```

---

## Notes

- Priority should be: Test → Fix bugs → Deploy MVP → Iterate
- Don't over-engineer before validating with real users
- Photo upload can be post-launch if blocking deployment
- Start with Vercel for simplest deployment path
