# Photo Upload Spec - Duet

**Created:** 2026-02-05
**Status:** Draft
**Owner:** Product + Engineering

---

## Summary
Finalize photo uploads for events so couples can add images reliably, see them in event detail, and use them as memories thumbnails. The app already has:

- `Photo` model (`eventId`, `uploadedByUserId`, `storageUrl`).
- `PhotoUploader` client component (Cloudinary direct upload or URL paste).
- Server action `createEventPhoto` to persist the URL.

This spec defines the remaining behavior, validation, UX, and edge cases.

---

## Goals
- Allow users in a space to attach photos to events.
- Support upload via Cloudinary and URL paste.
- Ensure only authorized users can attach photos to events they can access.
- Make uploaded photos visible in event detail and memories thumbnail pipeline.

## Non-goals (for this pass)
- Video uploads.
- Full media library / reuse across events.
- Automatic face detection or advanced image processing.

---

## User Flows

### 1) Upload from Event Detail (Primary)
1. User opens event detail page.
2. In "Memory photos" section, user selects **Upload** or **Paste URL**.
3. On success, the photo appears in the event gallery.
4. The first photo becomes the default memory thumbnail (existing behavior in memories list).

### 2) Paste URL (Fallback)
1. User selects **Paste URL**.
2. Enters an HTTPS image URL.
3. On success, URL is stored and photo appears in the event gallery.

### 3) Failure states
- Upload failure shows inline error and toast.
- If Cloudinary is not configured, the UI explains the fallback option.

---

## Permissions & Security
- Only authenticated members of the event’s `CoupleSpace` can upload.
- Server action must validate:
  - Membership (`getEventForUser` or equivalent).
  - URL format and allowed schemes (HTTPS only).

**Security baseline for URLs:**
- Accept only `https://` URLs.
- Prefer allowlist validation for Cloudinary URLs:
  - `https://res.cloudinary.com/<cloudName>/...`
- If URL paste is allowed for arbitrary hosts, add:
  - Image extension validation (`.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`) and
  - Optional HEAD request to confirm content-type starts with `image/`.

---

## Technical Design

### Upload Strategy
**Primary:** Client uploads directly to Cloudinary (unsigned preset).
- Uses `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` and `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`.
- Stores returned `secure_url` as `Photo.storageUrl` via server action.

**Fallback:** Paste URL
- Validates URL on server.
- Stores `storageUrl` directly.

### Server Action (existing)
- `createEventPhoto(eventId, userId, storageUrl)`

**Required validation additions:**
- Reject missing/empty URL.
- Reject non-HTTPS.
- Optional allowlist enforcement for Cloudinary.

### Data Model
Current model (no change required for MVP):
```
Photo {
  id
  createdAt
  eventId
  uploadedByUserId
  storageUrl
}
```

Optional future fields (not required now):
- `width`, `height`, `contentType`
- `source` (CLOUDINARY | URL)
- `sortOrder`

---

## UX Requirements

### Event Detail
- Section title: "Memory photos" (existing).
- Show grid of thumbnails (2 columns on small, 3 on large).
- Show empty state copy when no photos:
  - "Add a photo to make this memory pop."
- Show inline upload progress and errors.

### Upload Controls
- Toggle between Upload and Paste URL.
- Upload button disabled until file is selected.
- If Cloudinary is not configured, hide upload button and show helper text.

### Memories List
- If event has photos, first photo is the thumbnail.
- If none, fall back to place photo if present.

---

## Edge Cases
- Event deleted while upload in progress: show error and discard.
- Invalid URL or non-image URL: reject and show error.
- Cloudinary failure: show error and allow retry.
- Multiple uploads in a row: ensure each photo persists and UI updates.
- Very large image uploads: show error if size exceeds configured limit.

---

## Limits & Constraints
- Max file size (recommend 10 MB; confirm).
- Max photos per event (recommend 20; confirm).

Open questions:
- Do we want to allow arbitrary external image URLs, or restrict to Cloudinary only?
- Should photos be deletable? If yes, add author-only delete in event detail.

---

## Rollout Plan

### Milestone A (Finalize MVP)
- Enforce server-side URL validation.
- Ensure upload UX states are clear.
- Update event detail gallery and empty state copy.

### Milestone B (Quality improvements)
- Add delete action for event photos (author-only or member-only).
- Add basic ordering controls (optional).

### Milestone C (Performance)
- Add image optimization (Cloudinary transformations or Next image proxy).

---

## Acceptance Criteria
- Member can upload a photo and see it in event detail.
- URL paste rejects invalid URLs and non-HTTPS.
- Non-member cannot attach photos to another space’s event.
- Memory thumbnails prefer uploaded photos over place photos.
- Upload errors are visible and non-destructive.

