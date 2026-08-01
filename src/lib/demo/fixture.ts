import { demoImageUrl, demoImageUrls } from "@/lib/demo/assets";
import { DEMO_SPACE_NAME } from "@/lib/demo/config";
import { serializeTags } from "@/lib/tags";

/**
 * Demo content fixture.
 *
 * Pure data — no Prisma, no I/O — so it is unit-testable and usable by both the
 * runtime provisioner and `scripts/seed-demo.ts`.
 *
 * Every date is an offset from `now`. A demo whose "today" is empty and whose
 * upcoming plans are in the past is worse than no demo at all, so nothing here
 * is ever a fixed calendar date.
 */

export type DemoMemberKey = "alex" | "sam";

export type DemoMemberProfile = {
  key: DemoMemberKey;
  name: string;
  alias: string;
  initials: string;
  color: string;
};

export type DemoPlace = {
  /**
   * Real Google Place ID where one is configured. Google's terms allow storing
   * place IDs indefinitely, unlike place photos — the photos themselves are
   * downloaded once into `public/demo/` by `scripts/fetch-demo-photos.ts`.
   */
  placeId: string | null;
  placeName: string;
  placeAddress: string;
  placeWebsite: string | null;
  /** Absolute URLs, resolved from `public/demo/` filenames. */
  placePhotoUrls: string[] | null;
};

export type DemoComment = {
  by: DemoMemberKey;
  body: string;
  createdAt: Date;
};

export type DemoPhoto = {
  storageUrl: string;
  isCover: boolean;
  by: DemoMemberKey;
};

export type DemoEvent = {
  slug: string;
  title: string;
  description: string;
  by: DemoMemberKey;
  type: "PLANNED" | "MEMORY";
  dateTimeStart: Date;
  dateTimeEnd: Date | null;
  timeIsSet: boolean;
  tags: string;
  place: DemoPlace | null;
  photos: DemoPhoto[];
  rating: { by: DemoMemberKey; value: number; note: string | null } | null;
  comments: DemoComment[];
  /** Slug of the idea this event was scheduled from, if any. */
  fromIdeaSlug: string | null;
  /**
   * When the row claims to have been written. Drives the activity feed, so it
   * must always be in the past — including for events that are in the future.
   */
  createdAt: Date;
};

type DemoEventSeed = Omit<DemoEvent, "createdAt">;

export type DemoIdea = {
  slug: string;
  title: string;
  description: string;
  by: DemoMemberKey;
  status: "NEW" | "PLANNED";
  createdAt: Date;
  tags: string;
  place: DemoPlace | null;
  comments: DemoComment[];
};

export type DemoBlock = {
  title: string;
  note: string | null;
  by: DemoMemberKey;
  startAt: Date;
  endAt: Date;
};

export type DemoNote = {
  by: DemoMemberKey;
  body: string;
  createdAt: Date;
};

export type DemoContent = {
  spaceName: string;
  members: DemoMemberProfile[];
  events: DemoEvent[];
  ideas: DemoIdea[];
  blocks: DemoBlock[];
  notes: DemoNote[];
};

export const DEMO_MEMBERS: DemoMemberProfile[] = [
  // The visitor is signed in as the first member.
  { key: "alex", name: "Alex Rivera", alias: "Alex", initials: "AR", color: "rose" },
  { key: "sam", name: "Sam Okafor", alias: "Sam", initials: "SO", color: "teal" },
];

function shiftDays(base: Date, days: number) {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
}

/** A point in time `dayOffset` days from `now`, at a fixed local wall-clock time. */
function at(now: Date, dayOffset: number, hour: number, minute = 0) {
  const next = shiftDays(now, dayOffset);
  next.setHours(hour, minute, 0, 0);
  return next;
}

function place(input: {
  id?: string | null;
  name: string;
  address: string;
  website?: string | null;
  photos?: string[];
}): DemoPlace {
  return {
    placeId: input.id ?? null,
    placeName: input.name,
    placeAddress: input.address,
    placeWebsite: input.website ?? null,
    placePhotoUrls: input.photos?.length ? demoImageUrls(input.photos) : null,
  };
}

function photos(files: string[], by: DemoMemberKey): DemoPhoto[] {
  return files.map((file, index) => ({
    storageUrl: demoImageUrl(file),
    isCover: index === 0,
    by,
  }));
}

export function buildDemoContent(now: Date): DemoContent {
  const eventSeeds: DemoEventSeed[] = [
    // ── Today ────────────────────────────────────────────────────────────────
    // At least one event today keeps the top-bar "today" summary and the mobile
    // agenda populated, which is the first thing a visitor sees.
    {
      slug: "coffee-walk",
      title: "Morning coffee walk",
      description: "Long way round to the good espresso place, before the day starts.",
      by: "sam",
      type: "PLANNED",
      dateTimeStart: at(now, 0, 9, 0),
      dateTimeEnd: at(now, 0, 10, 0),
      timeIsSet: true,
      tags: serializeTags(["morning", "easy"]),
      place: place({
        name: "Fern & Filter",
        address: "12 Alder Lane",
        photos: ["coffee-walk.jpg"],
      }),
      photos: [],
      rating: null,
      comments: [],
      fromIdeaSlug: null,
    },
    {
      slug: "bistro-tonight",
      title: "Dinner at Maison Lune",
      description: "Booked the corner table. They do the lemon tart on Thursdays.",
      by: "alex",
      type: "PLANNED",
      dateTimeStart: at(now, 0, 19, 30),
      dateTimeEnd: at(now, 0, 21, 30),
      timeIsSet: true,
      tags: serializeTags(["dinner", "date night"]),
      place: place({
        name: "Maison Lune",
        address: "48 Rue Saint-Clair",
        website: "https://example.com/maison-lune",
        photos: ["bistro-tonight.jpg"],
      }),
      photos: [],
      rating: null,
      comments: [
        {
          by: "sam",
          body: "Perfect. I'll head straight there from work.",
          createdAt: at(now, -1, 18, 12),
        },
      ],
      fromIdeaSlug: null,
    },

    // ── Upcoming ─────────────────────────────────────────────────────────────
    {
      slug: "jazz-night",
      title: "Jazz night at The Blue Room",
      description: "Doors at eight. Small room, so worth getting there early.",
      by: "sam",
      type: "PLANNED",
      dateTimeStart: at(now, 3, 20, 0),
      dateTimeEnd: at(now, 3, 23, 0),
      timeIsSet: true,
      tags: serializeTags(["music", "night out"]),
      place: place({
        name: "The Blue Room",
        address: "7 Marley Street",
        photos: ["jazz-night.jpg"],
      }),
      photos: [],
      rating: null,
      comments: [
        {
          by: "alex",
          body: "Tickets are in my email — I'll forward them.",
          createdAt: at(now, -2, 21, 5),
        },
      ],
      fromIdeaSlug: null,
    },
    {
      slug: "farmers-brunch",
      title: "Market, then brunch",
      description: "Vegetables first, pancakes second. Non-negotiable order.",
      by: "alex",
      type: "PLANNED",
      dateTimeStart: at(now, 6, 10, 30),
      dateTimeEnd: at(now, 6, 13, 0),
      timeIsSet: true,
      tags: serializeTags(["weekend", "food"]),
      place: place({
        name: "Riverside Market",
        address: "Quay Road",
        photos: ["farmers-brunch.jpg"],
      }),
      photos: [],
      rating: null,
      comments: [],
      fromIdeaSlug: null,
    },
    {
      slug: "pottery-class",
      title: "Beginners' pottery class",
      description: "Two hours, one wheel each. Aprons provided, apparently.",
      by: "sam",
      type: "PLANNED",
      dateTimeStart: at(now, 12, 18, 30),
      dateTimeEnd: at(now, 12, 20, 30),
      timeIsSet: true,
      tags: serializeTags(["making", "learn"]),
      place: place({
        name: "Kiln Studio",
        address: "3 Foundry Yard",
        photos: ["pottery-class.jpg"],
      }),
      photos: [],
      rating: null,
      comments: [],
      // Shows the ideas → plans lifecycle on the calendar.
      fromIdeaSlug: "pottery",
    },
    {
      slug: "hills-weekend",
      title: "Weekend in the hills",
      description: "Cabin with a wood stove and no signal. That's the whole plan.",
      by: "alex",
      type: "PLANNED",
      dateTimeStart: at(now, 19, 9, 0),
      dateTimeEnd: at(now, 21, 17, 0),
      // A day-scoped plan — exercises the "no time set" rendering path.
      timeIsSet: false,
      tags: serializeTags(["trip", "nature"]),
      place: place({
        name: "Larkspur Cabin",
        address: "Upper Fell Road",
        photos: ["hills-weekend.jpg"],
      }),
      photos: [],
      rating: null,
      comments: [
        {
          by: "sam",
          body: "Adding the board games to the bag now so we don't forget again.",
          createdAt: at(now, -3, 20, 40),
        },
      ],
      fromIdeaSlug: null,
    },
    {
      slug: "outdoor-cinema",
      title: "Cinema under the stars",
      description: "They're showing the one you quote at me constantly.",
      by: "sam",
      type: "PLANNED",
      dateTimeStart: at(now, 33, 21, 0),
      dateTimeEnd: at(now, 33, 23, 30),
      timeIsSet: true,
      tags: serializeTags(["film", "outdoors"]),
      place: place({
        name: "Meadow Park Screen",
        address: "Meadow Park, East Gate",
        photos: ["outdoor-cinema.jpg"],
      }),
      photos: [],
      rating: null,
      comments: [],
      fromIdeaSlug: null,
    },

    // ── Memories ─────────────────────────────────────────────────────────────
    // Spread across several months so the memories timeline shows real grouping
    // rather than one dense cluster.
    {
      slug: "market-morning",
      title: "Saturday market run",
      description: "Came home with far too much bread and zero regrets.",
      by: "alex",
      type: "MEMORY",
      dateTimeStart: at(now, -4, 10, 0),
      dateTimeEnd: at(now, -4, 12, 30),
      timeIsSet: true,
      tags: serializeTags(["weekend", "food"]),
      place: place({
        name: "Riverside Market",
        address: "Quay Road",
        photos: ["market-morning-1.jpg"],
      }),
      photos: photos(["market-morning-1.jpg", "market-morning-2.jpg"], "alex"),
      rating: { by: "alex", value: 4, note: null },
      comments: [
        {
          by: "sam",
          body: "The tomato guy remembered us. We're regulars now.",
          createdAt: at(now, -4, 14, 20),
        },
      ],
      fromIdeaSlug: null,
    },
    {
      slug: "rooftop-dinner",
      title: "Rooftop dinner",
      description: "Three years. Same order as the first time, somehow.",
      by: "sam",
      type: "MEMORY",
      dateTimeStart: at(now, -11, 19, 30),
      dateTimeEnd: at(now, -11, 22, 30),
      timeIsSet: true,
      tags: serializeTags(["anniversary", "dinner"]),
      place: place({
        name: "Vista Rooftop",
        address: "Top floor, 21 Harbour Street",
        photos: ["rooftop-dinner-1.jpg"],
      }),
      photos: photos(
        ["rooftop-dinner-1.jpg", "rooftop-dinner-2.jpg", "rooftop-dinner-3.jpg"],
        "sam",
      ),
      rating: {
        by: "sam",
        value: 5,
        note: "The light at eight o'clock up there is unreasonable.",
      },
      comments: [
        {
          by: "alex",
          body: "Best night in a long time.",
          createdAt: at(now, -10, 9, 15),
        },
        {
          by: "sam",
          body: "Booking the same table for next year already.",
          createdAt: at(now, -10, 9, 44),
        },
      ],
      fromIdeaSlug: null,
    },
    {
      slug: "gallery-afternoon",
      title: "The modern wing",
      description: "Spent forty minutes in front of one painting arguing about it.",
      by: "alex",
      type: "MEMORY",
      dateTimeStart: at(now, -24, 14, 0),
      dateTimeEnd: at(now, -24, 17, 0),
      timeIsSet: true,
      tags: serializeTags(["culture", "indoor"]),
      place: place({
        name: "City Gallery",
        address: "1 Museum Square",
        photos: ["gallery-afternoon-1.jpg"],
      }),
      photos: photos(["gallery-afternoon-1.jpg", "gallery-afternoon-2.jpg"], "alex"),
      rating: { by: "alex", value: 4, note: null },
      comments: [],
      fromIdeaSlug: null,
    },
    {
      slug: "ridge-hike",
      title: "Ridge trail hike",
      description: "Six hours up, one flask of coffee, one very smug summit photo.",
      by: "sam",
      type: "MEMORY",
      dateTimeStart: at(now, -38, 8, 0),
      dateTimeEnd: at(now, -38, 16, 0),
      timeIsSet: true,
      tags: serializeTags(["outdoors", "hike"]),
      place: place({
        name: "Kestrel Ridge",
        address: "Northern Fells",
        photos: ["ridge-hike-1.jpg"],
      }),
      photos: photos(["ridge-hike-1.jpg", "ridge-hike-2.jpg"], "sam"),
      rating: { by: "sam", value: 5, note: "Worth every one of those steps." },
      comments: [
        {
          by: "alex",
          body: "I'm still finding trail dust in that backpack.",
          createdAt: at(now, -36, 19, 2),
        },
      ],
      fromIdeaSlug: null,
    },
    {
      slug: "pasta-night",
      title: "Pasta from scratch",
      description: "Flour on every surface. Genuinely good result though.",
      by: "alex",
      type: "MEMORY",
      dateTimeStart: at(now, -52, 19, 0),
      dateTimeEnd: at(now, -52, 22, 0),
      timeIsSet: true,
      tags: serializeTags(["cooking", "home"]),
      place: null,
      photos: photos(["pasta-night-1.jpg", "pasta-night-2.jpg"], "alex"),
      rating: { by: "alex", value: 4, note: "Next time: less flour, more sauce." },
      comments: [],
      fromIdeaSlug: null,
    },
    {
      slug: "beach-escape",
      title: "Two days by the sea",
      description: "Cold water, warm chips, absolutely no plans.",
      by: "sam",
      type: "MEMORY",
      dateTimeStart: at(now, -74, 11, 0),
      dateTimeEnd: at(now, -73, 18, 0),
      timeIsSet: false,
      tags: serializeTags(["trip", "sea"]),
      place: place({
        name: "Camber Cove",
        address: "South Coast",
        photos: ["beach-escape-1.jpg"],
      }),
      photos: photos(["beach-escape-1.jpg", "beach-escape-2.jpg"], "sam"),
      rating: { by: "sam", value: 5, note: null },
      comments: [
        {
          by: "alex",
          body: "Let's do this again before it gets cold.",
          createdAt: at(now, -70, 12, 30),
        },
      ],
      fromIdeaSlug: null,
    },
    {
      slug: "record-shop",
      title: "Record shop crawl",
      description: "Four shops, two records, one very long debate about pressings.",
      by: "alex",
      type: "MEMORY",
      dateTimeStart: at(now, -96, 13, 0),
      dateTimeEnd: at(now, -96, 17, 30),
      timeIsSet: true,
      tags: serializeTags(["music", "city"]),
      place: place({
        name: "Groove Lane Records",
        address: "22 Groove Lane",
        photos: ["record-shop-1.jpg"],
      }),
      photos: photos(["record-shop-1.jpg"], "alex"),
      rating: { by: "alex", value: 3, note: null },
      comments: [],
      fromIdeaSlug: null,
    },
    {
      slug: "winter-lights",
      title: "Winter lights walk",
      description: "Freezing. Beautiful. Two hot chocolates each.",
      by: "sam",
      type: "MEMORY",
      dateTimeStart: at(now, -140, 18, 0),
      dateTimeEnd: at(now, -140, 21, 0),
      timeIsSet: true,
      tags: serializeTags(["winter", "walk"]),
      place: place({
        name: "Old Town Gardens",
        address: "Cathedral Close",
        photos: ["winter-lights-1.jpg"],
      }),
      photos: photos(["winter-lights-1.jpg", "winter-lights-2.jpg"], "sam"),
      rating: { by: "sam", value: 5, note: null },
      comments: [],
      fromIdeaSlug: null,
    },
  ];

  // A memory was "created" when it happened; a future plan was created some time
  // before now. Staggering keeps the activity feed from looking machine-made.
  const events: DemoEvent[] = eventSeeds.map((event, index) => ({
    ...event,
    createdAt:
      event.dateTimeStart <= now
        ? event.dateTimeStart
        : shiftDays(now, -((index % 9) + 1)),
  }));

  const ideas: DemoIdea[] = [
    {
      slug: "balloon",
      title: "Hot air balloon at sunrise",
      description: "Ridiculous, expensive, and we should absolutely do it once.",
      by: "alex",
      status: "NEW",
      createdAt: at(now, -6, 22, 10),
      tags: serializeTags(["bucket list", "sunrise"]),
      place: place({
        name: "Vale Balloon Field",
        address: "Vale Road",
        photos: ["idea-balloon.jpg"],
      }),
      comments: [],
    },
    {
      slug: "ramen",
      title: "Learn to make ramen properly",
      description: "The broth takes a whole day. That's sort of the point.",
      by: "sam",
      status: "NEW",
      createdAt: at(now, -9, 20, 45),
      tags: serializeTags(["cooking", "project"]),
      place: place({
        name: "Home",
        address: "Our kitchen",
        photos: ["idea-ramen.jpg"],
      }),
      comments: [
        {
          by: "alex",
          body: "I'm in, as long as I'm on chopping duty and not timing duty.",
          createdAt: at(now, -8, 8, 30),
        },
      ],
    },
    {
      slug: "botanical",
      title: "Botanical garden in spring",
      description: "Apparently the glasshouse is the best bit. Go on a weekday.",
      by: "alex",
      status: "NEW",
      createdAt: at(now, -14, 12, 20),
      tags: serializeTags(["nature", "calm"]),
      place: place({
        name: "Cordell Botanical Garden",
        address: "West Park Drive",
        photos: ["idea-botanical.jpg"],
      }),
      comments: [],
    },
    {
      slug: "vinyl-wine",
      title: "Vinyl and wine evening",
      description: "One record each, no phones, no skipping tracks.",
      by: "sam",
      status: "NEW",
      createdAt: at(now, -17, 21, 55),
      tags: serializeTags(["home", "music"]),
      place: null,
      comments: [],
    },
    {
      slug: "kayak",
      title: "Kayak the estuary",
      description: "Hire is cheaper before ten. Bring the dry bag this time.",
      by: "alex",
      status: "NEW",
      createdAt: at(now, -21, 9, 5),
      tags: serializeTags(["water", "active"]),
      place: place({
        name: "Estuary Boat Hire",
        address: "Lower Slipway",
        photos: ["idea-kayak.jpg"],
      }),
      comments: [],
    },
    {
      slug: "bookshop",
      title: "Bookshop crawl, then dessert",
      description: "Rule: you buy whatever the other person picks out for you.",
      by: "sam",
      status: "NEW",
      createdAt: at(now, -27, 19, 15),
      tags: serializeTags(["books", "city"]),
      place: place({
        name: "Ravensworth Books",
        address: "9 Cobble Street",
        photos: ["idea-bookshop.jpg"],
      }),
      comments: [
        {
          by: "alex",
          body: "Dangerous rule. Agreed.",
          createdAt: at(now, -27, 20, 2),
        },
        {
          by: "sam",
          body: "Dessert place next door does a pistachio thing. Just saying.",
          createdAt: at(now, -26, 13, 40),
        },
      ],
    },
    {
      slug: "stargazing",
      title: "Stargazing outside the city",
      description: "Need a clear night and a flask. Forty minutes' drive gets us dark sky.",
      by: "alex",
      status: "NEW",
      createdAt: at(now, -33, 23, 30),
      tags: serializeTags(["night", "quiet"]),
      place: place({
        name: "Bramley Down",
        address: "Off the B412",
        photos: ["idea-stargazing.jpg"],
      }),
      comments: [],
    },
    {
      // Scheduled into `pottery-class` above — demonstrates the idea → plan step.
      slug: "pottery",
      title: "Beginners' pottery class",
      description: "Two hours, one wheel each. Aprons provided, apparently.",
      by: "sam",
      status: "PLANNED",
      createdAt: at(now, -30, 18, 0),
      tags: serializeTags(["making", "learn"]),
      place: place({
        name: "Kiln Studio",
        address: "3 Foundry Yard",
        photos: ["pottery-class.jpg"],
      }),
      comments: [],
    },
  ];

  const blocks: DemoBlock[] = [
    {
      title: "Work trip — Berlin",
      note: "Back late Thursday.",
      by: "sam",
      startAt: at(now, 24, 6, 0),
      endAt: at(now, 27, 22, 0),
    },
    {
      title: "Family visiting",
      note: null,
      by: "alex",
      startAt: at(now, -2, 9, 0),
      endAt: at(now, 1, 20, 0),
    },
  ];

  const notes: DemoNote[] = [
    {
      by: "alex",
      body: "Sam's parents' anniversary is coming up — we said we'd cook for them.",
      createdAt: at(now, -5, 17, 20),
    },
    {
      by: "sam",
      body: "That corner table at Maison Lune is the one to ask for.",
      createdAt: at(now, -12, 11, 0),
    },
    {
      by: "alex",
      body: "Cabin needs booking six weeks ahead in summer.",
      createdAt: at(now, -20, 15, 45),
    },
  ];

  return {
    spaceName: DEMO_SPACE_NAME,
    members: DEMO_MEMBERS,
    events,
    ideas,
    blocks,
    notes,
  };
}
