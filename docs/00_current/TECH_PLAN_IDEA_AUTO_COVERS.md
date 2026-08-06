# Technical Plan: Automatic Covers for Ideas

Status: Proposed; no implementation started

## Goal

When a user creates a free-form idea such as `Going dancing`, automatically find a relevant photographic cover and show it on the idea card. Creating an idea must remain successful when image search is unavailable or returns no usable result.

The first version builds a direct search query from the idea text. AI-assisted text understanding is an optional later enhancement, not a requirement for launch. Images are searched, not AI-generated.

## Product decisions

- Keep Google Places as the preferred image source when the user selects a real venue.
- For an idea without a place photo, query an image-search provider using the title and tags.
- Start with direct query construction; do not add an AI dependency to the initial version.
- Never make idea creation depend on image-search success.
- Preserve the existing local fallback artwork when no remote image is available.
- Do not store generic images in `placePhotoUrls`; that field should remain specific to Google Places.
- Keep image search behind a provider interface so Google can be replaced without changing the idea workflow.

## Google API constraint

The relevant Google product is the Custom Search JSON API with `searchType=image`. As of February 2026, Google has closed it to new customers. Existing customers can use it only until January 1, 2027.

Before implementation, run a short access spike using the intended Google Cloud project. If it cannot enable and call the API, use a licensed stock-photo API such as Pexels behind the same provider interface.

References:

- https://developers.google.com/custom-search/v1/overview
- https://developers.google.com/custom-search/v1/reference/rest/v1/cse/list

## Scope

### Initial version

- Search for one cover when creating an idea without a Place photo.
- Build the query locally from the title and tags.
- Apply SafeSearch and photographic-image filters.
- Save the selected image URL and its source metadata.
- Copy the cover metadata when the idea is scheduled as an event.
- Render the searched cover before falling back to the existing artwork.
- Fail quietly to the fallback when search times out, fails, or finds no valid result.

### Later enhancements

- Optional AI query enrichment for vague, complex, or multilingual ideas.
- Let users refresh, replace, remove, or upload a cover.
- Background image lookup after the idea is created.
- Multiple candidate images with user selection.
- Provider fallback from Google to a stock-photo API.

### Not in scope

- AI image generation.
- Scraping the Google Images website.
- Automatically replacing a cover whenever the title is edited.
- Searching from private comments or other couple data.

## Existing integration points

- Idea creation server action: `src/app/spaces/[spaceId]/calendar/page.tsx`
- Idea persistence: `src/lib/ideas.ts`
- Idea schema: `prisma/schema.prisma`
- Cover rendering: `src/components/planning/IdeaCard.tsx` and `src/components/planning/PlanningCover.tsx`
- Idea-to-event conversion: `handleScheduleIdea` in the calendar page and `createEventForSpace` in `src/lib/events.ts`

The current UI already renders the first valid `placePhotoUrls` value and falls back through `PlanningCover`. The new generic cover should be resolved before the Place-photo fallback:

1. User-selected/uploaded cover, when added later.
2. Saved generic idea cover.
3. Google Place photo.
4. Local fallback artwork.

## Proposed data model

Add equivalent nullable fields to `Idea` and `Event`:

```prisma
coverImageUrl         String?
coverImageProvider    String?
coverImageSourceUrl   String?
coverImageAttribution String?
coverImageQuery       String?
```

Field purposes:

- `coverImageUrl`: URL rendered by the card.
- `coverImageProvider`: provider identifier such as `GOOGLE_CSE` or `PEXELS`.
- `coverImageSourceUrl`: page where the image was found, used for attribution and investigation.
- `coverImageAttribution`: source/creator label when supplied by the provider.
- `coverImageQuery`: final query used, useful for refresh behavior and debugging.

Do not place API keys, raw API responses, or user descriptions in these fields.

An enum can replace the provider string after a second provider is introduced. Keeping it as a string for the first provider makes the initial migration smaller.

## Provider boundary

Create `src/lib/idea-cover/types.ts`:

```ts
export type IdeaCoverSearchInput = {
  title: string;
  tags: string[];
};

export type IdeaCoverResult = {
  imageUrl: string;
  provider: "GOOGLE_CSE" | "PEXELS";
  sourceUrl: string | null;
  attribution: string | null;
  query: string;
};

export interface IdeaCoverProvider {
  search(input: IdeaCoverSearchInput): Promise<IdeaCoverResult | null>;
}
```

Create a server-only Google implementation in `src/lib/idea-cover/google-custom-search.ts`. Client components must never receive the API key.

## Query construction without AI

Create a deterministic `buildIdeaImageQuery` function:

1. Trim and normalize the title.
2. Remove URLs and control characters.
3. Include at most the first two short tags.
4. Add a small amount of product context, such as `couple date activity` and `photo`.
5. Cap the final query length.

Examples:

| Idea | Initial search query |
| --- | --- |
| Going dancing | `going dancing couple date activity photo` |
| Pottery class | `pottery class couple date activity photo` |
| Picnic by the lake, tag: outdoors | `picnic by the lake outdoors couple date activity photo` |

Do not send the full description in the first version. Descriptions may contain personal details, links, reservation information, or other text that is unnecessary for finding a representative image.

## Google request

If the project has existing Custom Search access, make a server-side request to:

```text
GET https://customsearch.googleapis.com/customsearch/v1
```

Use these parameters:

```text
key=<server-only API key>
cx=<programmable search engine ID>
q=<constructed query>
searchType=image
safe=active
imgType=photo
imgSize=large
num=5
```

Prefer configuring the Programmable Search Engine to search approved, licensable image sources. If open-web results are used, consider the API's `rights` filter and treat licensing/source review as a release requirement; appearing in Google results does not itself grant permission to reuse an image.

Selection rules:

1. Require an HTTPS image URL.
2. Require a source/context URL when one is returned.
3. Reject obviously tiny results using the returned dimensions.
4. Prefer landscape images closest to the card's aspect ratio.
5. Select deterministically from the highest-ranked usable results.
6. Return `null` if no candidate passes validation.

Use an abort timeout of approximately 1.5 to 2 seconds. Parse the response with a strict schema rather than trusting arbitrary JSON.

## Creation flow

```text
Submit idea
  -> Parse and validate title, tags, and optional Place data
  -> If a Place photo exists, skip generic image search
  -> Otherwise query the configured cover provider
  -> Catch timeout/provider/validation failures and continue with no cover
  -> Create the Idea once, including any cover metadata
  -> Revalidate/refresh the planning view
```

The provider call may add a small delay, but the initial implementation stays simple. If observed latency is poor, move lookup to background work in a later iteration and add a `PENDING` state.

When an idea becomes an event, copy all generic cover fields to the new event alongside the existing Place fields. Deleting or reverting the event should continue to follow the existing idea lifecycle.

Editing the idea title does not automatically run a new search. This avoids surprising image changes and unnecessary API usage. A future `Refresh cover` action can make that behavior explicit.

## Rendering and attribution

Resolve the cover URL as:

```ts
idea.coverImageUrl ?? firstValidPlacePhotoUrl ?? null
```

Continue letting `PlanningCover` handle load failures and the local fallback.

Where provider/source metadata is available, add a small `Image source` link on the idea detail view. Provider-specific licensing or attribution requirements must be verified before production rollout. The small card can remain visually clean if the detail view provides the required source access and the provider's rules allow that treatment.

## Configuration

Add server-only environment variables:

```dotenv
IDEA_AUTO_COVERS_ENABLED="false"
IDEA_COVER_PROVIDER="google-cse"
GOOGLE_CUSTOM_SEARCH_API_KEY=""
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=""
```

Do not prefix the API key with `NEXT_PUBLIC_`.

Behavior by configuration:

- Feature disabled: create ideas exactly as today.
- Feature enabled but credentials missing: log one sanitized configuration warning and use the fallback cover.
- Provider error or quota exhaustion: use the fallback cover and do not fail idea creation.

## Error handling and safety

- Never log API keys or the complete provider URL.
- Avoid logging raw titles because they may be private; log result status, duration, provider, and a one-way query fingerprint if correlation is needed.
- Validate all returned URLs and allow only `https:`.
- Do not proxy or server-fetch arbitrary image bytes in the initial version.
- Treat malformed provider responses as `null`, not as creation errors.
- Apply request timeouts and a small response-size limit.
- Do not retry synchronously during the create action.
- Monitor quota failures separately from general provider failures.

## Work breakdown

### Phase 0: Access and licensing spike

- Confirm the Google Cloud project already has Custom Search JSON API access.
- Confirm the Programmable Search Engine ID can return image results.
- Decide which source domains and licensing filters are acceptable.
- Make one development request using the planned parameters.
- If access is unavailable, select Pexels as the initial provider without changing the remaining plan.

Exit condition: a provider and permitted source policy are confirmed.

### Phase 1: Provider service

- Add provider types and deterministic query builder.
- Implement the Google provider with timeout, strict response parsing, selection rules, and sanitized errors.
- Add environment documentation and the disabled-by-default feature flag.
- Unit-test query construction and response selection.

Exit condition: the provider returns a normalized result or `null` without throwing into the caller.

### Phase 2: Persistence

- Add cover metadata to `Idea` and `Event`.
- Create and apply a Prisma migration.
- Extend idea/event input types and mutation functions.
- Copy cover metadata during idea-to-event conversion and memory-to-idea restoration where applicable.

Exit condition: cover metadata survives the Idea -> Event lifecycle.

### Phase 3: Creation integration

- Call the provider from the idea creation action only when no Place photo exists.
- Ensure provider failures still create the idea.
- Revalidate the calendar/planning path as usual.
- Add provider success/failure timing instrumentation without private text.

Exit condition: `Going dancing` creates an idea with a searched cover when the provider is healthy and creates one with the fallback when it is not.

### Phase 4: UI and attribution

- Update idea, upcoming-plan, and relevant detail-view serializers with the generic cover fields.
- Prefer the generic cover over Place photos in `IdeaCard` and copied event covers.
- Show source attribution/link where required.
- Verify remote-image failure still reaches the local fallback.

Exit condition: cards and detail views render the correct priority order and comply with the chosen provider's attribution rules.

### Phase 5: Optional AI query enrichment

Add only after direct queries have been evaluated with real ideas.

- Trigger AI only for low-quality/no-result queries or explicitly enable it for all ideas.
- Send the minimum necessary text: title and safe tags by default.
- Require structured output such as `{ searchQuery, confidence }`.
- Validate and cap the returned query before sending it to the image provider.
- Fall back to the deterministic query when AI fails or times out.
- Track whether AI materially improves cover relevance before keeping the extra dependency and cost.

AI remains a query-writing step. It does not generate the image.

## Tests

### Unit tests

- Query normalization removes URLs and control characters.
- Tags are capped and normalized.
- Empty or malformed provider responses return `null`.
- Non-HTTPS image URLs are rejected.
- Landscape, sufficiently large candidates are preferred.
- Provider timeouts do not escape as idea-creation errors.

### Integration tests

- Idea with a Place photo does not call generic image search.
- Idea without a Place photo saves returned cover metadata.
- Provider 401, 403, 429, 500, timeout, and invalid JSON all produce an idea with no generic cover.
- Scheduling an idea copies the generic cover to its event.
- Feature flag off produces no provider traffic.

### Manual QA

- `Going dancing`
- `Dinner`
- `Pottery class`
- A non-English title
- A title containing emoji
- A title containing a URL
- An idea with a selected Place
- Search quota exhausted
- Saved image URL later returns 404

Check desktop and mobile card crops and the idea/event detail source link.

## Acceptance criteria

- Free-form ideas can receive a relevant cover without requiring AI.
- Ideas with real Place photos do not make a generic image-search request.
- Image-search failure never prevents idea creation.
- API credentials remain server-only.
- Saved images include enough source metadata for attribution and troubleshooting.
- Generic cover data is not stored in `placePhotoUrls`.
- Scheduling an idea preserves its cover.
- Existing fallback artwork remains functional.
- The integration can switch providers without rewriting the server action or UI model.

## Open decisions before implementation

1. Does the intended Google Cloud project already have Custom Search JSON API access?
2. Will the search engine be restricted to approved stock-photo domains, or will open-web results be allowed?
3. What attribution treatment is required for the chosen image sources?
4. Should the searched image take priority over a Google Place photo, or only fill the no-place gap? This plan recommends only filling the gap.
5. Is synchronous lookup acceptable for the first release, or should background enrichment be implemented immediately?
