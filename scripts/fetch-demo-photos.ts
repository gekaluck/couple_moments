import "dotenv/config";
import fs from "fs/promises";
import path from "path";

/**
 * Populates `public/demo/` with the images the demo fixture references.
 *
 * Run once (or whenever you want to refresh the look):
 *
 *   npx tsx scripts/fetch-demo-photos.ts               # Google Places photos
 *   npx tsx scripts/fetch-demo-photos.ts --source=stock  # pasted stock URLs
 *   npx tsx scripts/fetch-demo-photos.ts --force         # re-download existing
 *   npx tsx scripts/fetch-demo-photos.ts --only=jazz-night.jpg
 *
 * Nothing here runs at request time. `/demo` only ever serves the files this
 * script leaves behind, so the demo has no runtime dependency on Google.
 *
 * ── Before using the Places source, read this ──────────────────────────────
 * Google Maps Platform lets you store place *IDs* indefinitely, but its terms
 * restrict caching other Places content — photos included — beyond a short
 * window. Committing Places photos to a public repo is very likely outside
 * those terms. Two ways to stay clean:
 *   1. Use `--source=stock` with Unsplash/Pexels URLs (their licences permit
 *      this outright). Paste the URLs into the manifest below.
 *   2. Use Places, keep `public/demo/` out of git, and re-run this script as
 *      part of deployment.
 * Places photos also carry author attributions that Google requires you to
 * display; this script records them in `public/demo/CREDITS.md`.
 */

type DemoAsset = {
  file: string;
  /** Google Places text search. Deliberately generic — the demo's venue names are fictional. */
  query: string;
  /** Which photo of the matched place to take, so one venue can yield several shots. */
  photoIndex?: number;
  /** Optional direct URL (Unsplash/Pexels). Used by `--source=stock`. */
  stock?: string;
};

/** Must stay in step with `src/lib/demo/fixture.ts`. Verified by `--check`. */
const ASSETS: DemoAsset[] = [
  // Today + upcoming plans (idea and plan card covers)
  { file: "coffee-walk.jpg", query: "specialty coffee shop interior" },
  { file: "bistro-tonight.jpg", query: "candlelit bistro dining room" },
  { file: "jazz-night.jpg", query: "live jazz club stage" },
  { file: "farmers-brunch.jpg", query: "farmers market produce stall" },
  { file: "pottery-class.jpg", query: "pottery studio wheel" },
  { file: "hills-weekend.jpg", query: "wooden cabin in the hills" },
  { file: "outdoor-cinema.jpg", query: "outdoor cinema screening park" },

  // Memories (event photo galleries)
  { file: "market-morning-1.jpg", query: "farmers market morning" },
  { file: "market-morning-2.jpg", query: "farmers market morning", photoIndex: 1 },
  { file: "rooftop-dinner-1.jpg", query: "rooftop restaurant at sunset" },
  { file: "rooftop-dinner-2.jpg", query: "rooftop restaurant at sunset", photoIndex: 1 },
  { file: "rooftop-dinner-3.jpg", query: "rooftop restaurant at sunset", photoIndex: 2 },
  { file: "gallery-afternoon-1.jpg", query: "modern art gallery interior" },
  { file: "gallery-afternoon-2.jpg", query: "modern art gallery interior", photoIndex: 1 },
  { file: "ridge-hike-1.jpg", query: "mountain ridge hiking trail" },
  { file: "ridge-hike-2.jpg", query: "mountain ridge hiking trail", photoIndex: 1 },
  { file: "pasta-night-1.jpg", query: "fresh pasta making kitchen" },
  { file: "pasta-night-2.jpg", query: "fresh pasta making kitchen", photoIndex: 1 },
  { file: "beach-escape-1.jpg", query: "quiet coastal beach cove" },
  { file: "beach-escape-2.jpg", query: "quiet coastal beach cove", photoIndex: 1 },
  { file: "record-shop-1.jpg", query: "vinyl record shop interior" },
  { file: "winter-lights-1.jpg", query: "winter lights garden trail" },
  { file: "winter-lights-2.jpg", query: "winter lights garden trail", photoIndex: 1 },

  // Idea covers
  { file: "idea-balloon.jpg", query: "hot air balloon sunrise" },
  { file: "idea-ramen.jpg", query: "ramen bowl restaurant" },
  { file: "idea-botanical.jpg", query: "botanical garden glasshouse" },
  { file: "idea-kayak.jpg", query: "kayaking on an estuary" },
  { file: "idea-bookshop.jpg", query: "independent bookshop interior" },
  { file: "idea-stargazing.jpg", query: "night sky stars countryside" },
];

const OUTPUT_DIR = path.join(process.cwd(), "public", "demo");
const MAX_WIDTH_PX = 1200;

type Credit = { file: string; source: string; attribution: string };

function parseArgs() {
  const args = process.argv.slice(2);
  const only = args.find((arg) => arg.startsWith("--only="))?.split("=")[1];
  const sourceArg = args.find((arg) => arg.startsWith("--source="))?.split("=")[1];
  return {
    source: sourceArg === "stock" ? ("stock" as const) : ("places" as const),
    force: args.includes("--force"),
    check: args.includes("--check"),
    only: only ?? null,
  };
}

function apiKey() {
  const key =
    process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) {
    throw new Error(
      "Set GOOGLE_MAPS_API_KEY (a server key — a browser key restricted by HTTP referrer will be rejected from Node).",
    );
  }
  return key;
}

type PlacesPhoto = {
  name: string;
  authorAttributions?: { displayName?: string; uri?: string }[];
};

type PlacesSearchResponse = {
  places?: {
    id: string;
    displayName?: { text?: string };
    formattedAddress?: string;
    photos?: PlacesPhoto[];
  }[];
};

async function resolvePlacePhoto(asset: DemoAsset) {
  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey(),
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.photos",
    },
    body: JSON.stringify({ textQuery: asset.query, pageSize: 1 }),
  });

  if (!response.ok) {
    throw new Error(
      `Places search failed for "${asset.query}": ${response.status} ${await response.text()}`,
    );
  }

  const data = (await response.json()) as PlacesSearchResponse;
  const place = data.places?.[0];
  const photo = place?.photos?.[asset.photoIndex ?? 0];
  if (!place || !photo) {
    throw new Error(`No usable photo for "${asset.query}".`);
  }

  const mediaResponse = await fetch(
    `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=${MAX_WIDTH_PX}&skipHttpRedirect=true`,
    { headers: { "X-Goog-Api-Key": apiKey() } },
  );
  if (!mediaResponse.ok) {
    throw new Error(
      `Photo media lookup failed for "${asset.query}": ${mediaResponse.status}`,
    );
  }

  const { photoUri } = (await mediaResponse.json()) as { photoUri: string };
  const attribution =
    photo.authorAttributions
      ?.map((author) => author.displayName)
      .filter(Boolean)
      .join(", ") || "Google Places";

  return {
    url: photoUri,
    source: `Google Places — ${place.displayName?.text ?? asset.query}`,
    attribution,
  };
}

async function download(url: string, file: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed (${response.status}) for ${file}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(path.join(OUTPUT_DIR, file), buffer);
  return buffer.byteLength;
}

async function main() {
  const options = parseArgs();

  if (options.check) {
    await verifyAgainstFixture();
    return;
  }

  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const targets = options.only
    ? ASSETS.filter((asset) => asset.file === options.only)
    : ASSETS;
  if (targets.length === 0) {
    throw new Error(`No asset matches --only=${options.only}`);
  }

  const credits: Credit[] = [];
  let downloaded = 0;
  let skipped = 0;
  const failures: string[] = [];

  for (const asset of targets) {
    const destination = path.join(OUTPUT_DIR, asset.file);
    if (!options.force) {
      const exists = await fs
        .access(destination)
        .then(() => true)
        .catch(() => false);
      if (exists) {
        skipped += 1;
        continue;
      }
    }

    try {
      const resolved =
        options.source === "stock"
          ? asset.stock
            ? { url: asset.stock, source: asset.stock, attribution: "See manifest" }
            : null
          : await resolvePlacePhoto(asset);

      if (!resolved) {
        failures.push(`${asset.file}: no stock URL in the manifest`);
        continue;
      }

      const bytes = await download(resolved.url, asset.file);
      credits.push({
        file: asset.file,
        source: resolved.source,
        attribution: resolved.attribution,
      });
      downloaded += 1;
      console.log(`✔ ${asset.file} (${Math.round(bytes / 1024)} KB)`);
    } catch (error) {
      failures.push(`${asset.file}: ${error instanceof Error ? error.message : error}`);
    }
  }

  if (credits.length > 0) {
    await writeCredits(credits, options.force);
  }

  console.log(
    `\nDownloaded ${downloaded}, skipped ${skipped} (already present), failed ${failures.length}.`,
  );
  if (failures.length > 0) {
    console.log("\nFailures:");
    failures.forEach((failure) => console.log(`  ✗ ${failure}`));
    process.exitCode = 1;
  }
}

async function writeCredits(credits: Credit[], replace: boolean) {
  const creditsPath = path.join(OUTPUT_DIR, "CREDITS.md");
  const header = `# Demo image credits\n\nGenerated by \`scripts/fetch-demo-photos.ts\`. These images are used only in the\nDuet demo sandbox at \`/demo\`.\n\n| File | Source | Attribution |\n| --- | --- | --- |\n`;
  const rows = credits
    .map((credit) => `| ${credit.file} | ${credit.source} | ${credit.attribution} |`)
    .join("\n");

  const existing = replace
    ? null
    : await fs.readFile(creditsPath, "utf8").catch(() => null);

  if (existing) {
    await fs.writeFile(creditsPath, `${existing.trimEnd()}\n${rows}\n`);
  } else {
    await fs.writeFile(creditsPath, `${header}${rows}\n`);
  }
}

/** Fails loudly if the fixture references a file this manifest does not cover. */
async function verifyAgainstFixture() {
  const fixture = await fs.readFile(
    path.join(process.cwd(), "src", "lib", "demo", "fixture.ts"),
    "utf8",
  );
  const referenced = new Set(fixture.match(/[a-z0-9-]+\.jpg/g) ?? []);
  const covered = new Set(ASSETS.map((asset) => asset.file));

  const missing = [...referenced].filter((file) => !covered.has(file));
  const extra = [...covered].filter((file) => !referenced.has(file));

  if (missing.length === 0 && extra.length === 0) {
    console.log(`✔ Manifest and fixture agree on ${covered.size} images.`);
    return;
  }

  if (missing.length > 0) {
    console.log(`✗ Referenced by the fixture but missing here: ${missing.join(", ")}`);
  }
  if (extra.length > 0) {
    console.log(`✗ In the manifest but unused by the fixture: ${extra.join(", ")}`);
  }
  process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
