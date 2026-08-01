/**
 * Demo image assets.
 *
 * Files live in `public/demo/` and are populated once by
 * `scripts/fetch-demo-photos.ts` (Google Places photos for real venues, licensed
 * stock for everything else). Nothing fetches images at runtime.
 */

/**
 * URLs must be absolute: `IdeaCard` filters `placePhotoUrls` through
 * `/^https?:\/\//i`, so a bare `/demo/foo.webp` would be dropped and the idea
 * would silently fall back to the placeholder cover.
 */
export function demoImageUrl(file: string) {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
    /\/+$/,
    "",
  );
  return `${base}/demo/${file}`;
}

export function demoImageUrls(files: string[]) {
  return files.map(demoImageUrl);
}
