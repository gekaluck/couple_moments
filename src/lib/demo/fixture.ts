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
   * Stable Google Place ID. Photo metadata is requested fresh in the browser,
   * so Google photo URLs are never persisted in the fixture or database.
   */
  placeId: string | null;
  placeName: string;
  placeAddress: string;
  placeWebsite: string | null;
  /** Optional app-owned URLs. Real Places entries deliberately omit these. */
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
}): DemoPlace {
  return {
    placeId: input.id ?? null,
    placeName: input.name,
    placeAddress: input.address,
    placeWebsite: input.website ?? null,
    placePhotoUrls: null,
  };
}

/** Curated real places verified through Places Text Search on 2026-08-04. */
export const DEMO_REAL_PLACES = {
  darkMatter: place({
    id: "ChIJWRIIZ00tDogRiM95S7fMqPs",
    name: "Dark Matter Coffee — The Mothership",
    address: "738 N Western Ave, Chicago, IL 60612",
  }),
  cindysRooftop: place({
    id: "ChIJeYbaOKQsDogRfJrgIMgDNvE",
    name: "Cindy's Rooftop",
    address: "12 S Michigan Ave, Chicago, IL 60603",
  }),
  greenMill: place({
    id: "ChIJ5ywykizSD4gRX8IVtWSf3OI",
    name: "The Green Mill",
    address: "4802 N Broadway, Chicago, IL 60640",
  }),
  greenCityMarket: place({
    id: "ChIJNdAsc2rTD4gRNPHXq3qiQCY",
    name: "Green City Market Lincoln Park",
    address: "1817 N Clark St, Chicago, IL 60614",
  }),
  lillstreet: place({
    id: "ChIJpSdwFDzSD4gRKj5-lxFaBN0",
    name: "Lillstreet Art Center",
    address: "4401 N Ravenswood Ave, Chicago, IL 60640",
  }),
  millenniumPark: place({
    id: "ChIJA5xPiqYsDogRBBCptdwsGEQ",
    name: "Millennium Park",
    address: "Chicago, IL 60602",
  }),
  artInstitute: place({
    id: "ChIJlUbZ4qMsDogR3tCinMzzKUg",
    name: "The Art Institute of Chicago",
    address: "111 S Michigan Ave, Chicago, IL 60603",
  }),
  starvedRock: place({
    id: "ChIJI7ugX_5YCYgRxChEqWX4nU0",
    name: "Starved Rock State Park",
    address: "Oglesby, IL 61348",
  }),
  recklessRecords: place({
    id: "ChIJnSEVG8fSD4gRJ0ib4UtxuVM",
    name: "Reckless Records",
    address: "1379 N Milwaukee Ave, Chicago, IL 60622",
  }),
  garfieldConservatory: place({
    id: "ChIJaQUY87cyDogRqoNIaIN0IdI",
    name: "Garfield Park Conservatory",
    address: "300 N Central Park Ave, Chicago, IL 60624",
  }),
  urbanKayaks: place({
    id: "ChIJVea6NVYrDogRlxzUQCLizfw",
    name: "Urban Kayaks",
    address: "435 E Riverwalk, Chicago, IL 60601",
  }),
  myopicBooks: place({
    id: "ChIJMbKjacfSD4gRrBOFhDb_tqs",
    name: "Myopic Books",
    address: "1564 N Milwaukee Ave, Chicago, IL 60622",
  }),
  adlerPlanetarium: place({
    id: "ChIJtRSxt28rDogRpo4hEqqjIGk",
    name: "Adler Planetarium",
    address: "1300 S DuSable Lake Shore Dr, Chicago, IL 60605",
  }),
  goreme: place({
    id: "ChIJ7eS75-xnKhUR_syP0bAUyrs",
    name: "Göreme Open Air Museum",
    address: "Göreme, Nevşehir, Türkiye",
  }),
  banff: place({
    id: "ChIJlZGSjCtmd1MR5tfKrGjincA",
    name: "Banff National Park",
    address: "Alberta, Canada",
  }),
  marinhaBeach: place({
    id: "ChIJS-PpA6TWGg0RmCa3wG5Q9Fw",
    name: "Marinha Beach",
    address: "Algarve, Portugal",
  }),
  tivoliGardens: place({
    id: "ChIJ8-r2gBJTUkYRsCcLtQ0Ltdk",
    name: "Tivoli Gardens",
    address: "Vesterbrogade 3, Copenhagen, Denmark",
  }),
} satisfies Record<string, DemoPlace>;

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
      place: DEMO_REAL_PLACES.darkMatter,
      photos: [],
      rating: null,
      comments: [],
      fromIdeaSlug: null,
    },
    {
      slug: "bistro-tonight",
      title: "Dinner at Cindy's Rooftop",
      description: "Booked a window table for skyline views before sunset.",
      by: "alex",
      type: "PLANNED",
      dateTimeStart: at(now, 0, 19, 30),
      dateTimeEnd: at(now, 0, 21, 30),
      timeIsSet: true,
      tags: serializeTags(["dinner", "date night"]),
      place: DEMO_REAL_PLACES.cindysRooftop,
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
      title: "Jazz night at the Green Mill",
      description: "Doors at eight. Small room, so worth getting there early.",
      by: "sam",
      type: "PLANNED",
      dateTimeStart: at(now, 3, 20, 0),
      dateTimeEnd: at(now, 3, 23, 0),
      timeIsSet: true,
      tags: serializeTags(["music", "night out"]),
      place: DEMO_REAL_PLACES.greenMill,
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
      place: DEMO_REAL_PLACES.greenCityMarket,
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
      place: DEMO_REAL_PLACES.lillstreet,
      photos: [],
      rating: null,
      comments: [],
      // Shows the ideas → plans lifecycle on the calendar.
      fromIdeaSlug: "pottery",
    },
    {
      slug: "hills-weekend",
      title: "Long weekend in Banff",
      description: "Mountain trails, a quiet cabin, and no schedule after breakfast.",
      by: "alex",
      type: "PLANNED",
      dateTimeStart: at(now, 19, 9, 0),
      dateTimeEnd: at(now, 21, 17, 0),
      // A day-scoped plan — exercises the "no time set" rendering path.
      timeIsSet: false,
      tags: serializeTags(["trip", "nature"]),
      place: DEMO_REAL_PLACES.banff,
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
      title: "Movie night in Millennium Park",
      description: "Blanket, snacks, and a film under the skyline.",
      by: "sam",
      type: "PLANNED",
      dateTimeStart: at(now, 33, 21, 0),
      dateTimeEnd: at(now, 33, 23, 30),
      timeIsSet: true,
      tags: serializeTags(["film", "outdoors"]),
      place: DEMO_REAL_PLACES.millenniumPark,
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
      place: DEMO_REAL_PLACES.greenCityMarket,
      photos: [],
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
      place: DEMO_REAL_PLACES.cindysRooftop,
      photos: [],
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
      place: DEMO_REAL_PLACES.artInstitute,
      photos: [],
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
      place: DEMO_REAL_PLACES.starvedRock,
      photos: [],
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
      photos: [],
      rating: { by: "alex", value: 4, note: "Next time: less flour, more sauce." },
      comments: [],
      fromIdeaSlug: null,
    },
    {
      slug: "beach-escape",
      title: "Two days in the Algarve",
      description: "Sea caves, a quiet beach, and absolutely no schedule.",
      by: "sam",
      type: "MEMORY",
      dateTimeStart: at(now, -74, 11, 0),
      dateTimeEnd: at(now, -73, 18, 0),
      timeIsSet: false,
      tags: serializeTags(["trip", "sea"]),
      place: DEMO_REAL_PLACES.marinhaBeach,
      photos: [],
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
      place: DEMO_REAL_PLACES.recklessRecords,
      photos: [],
      rating: { by: "alex", value: 3, note: null },
      comments: [],
      fromIdeaSlug: null,
    },
    {
      slug: "winter-lights",
      title: "Winter lights at Tivoli",
      description: "Freezing, beautiful, and worth two hot chocolates each.",
      by: "sam",
      type: "MEMORY",
      dateTimeStart: at(now, -140, 18, 0),
      dateTimeEnd: at(now, -140, 21, 0),
      timeIsSet: true,
      tags: serializeTags(["winter", "walk"]),
      place: DEMO_REAL_PLACES.tivoliGardens,
      photos: [],
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
      title: "Cappadocia balloon at sunrise",
      description: "Ridiculous, beautiful, and something we should absolutely do once.",
      by: "alex",
      status: "NEW",
      createdAt: at(now, -6, 22, 10),
      tags: serializeTags(["bucket list", "sunrise"]),
      place: DEMO_REAL_PLACES.goreme,
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
      place: null,
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
      title: "Garfield Park Conservatory",
      description: "A warm glasshouse afternoon when Chicago decides to be cold again.",
      by: "alex",
      status: "NEW",
      createdAt: at(now, -14, 12, 20),
      tags: serializeTags(["nature", "calm"]),
      place: DEMO_REAL_PLACES.garfieldConservatory,
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
      title: "Kayak the Chicago River",
      description: "Go early for calmer water and bring the dry bag this time.",
      by: "alex",
      status: "NEW",
      createdAt: at(now, -21, 9, 5),
      tags: serializeTags(["water", "active"]),
      place: DEMO_REAL_PLACES.urbanKayaks,
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
      place: DEMO_REAL_PLACES.myopicBooks,
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
      title: "Adler After Dark",
      description: "Planetarium exhibits, skyline views, and a clear-night walk afterward.",
      by: "alex",
      status: "NEW",
      createdAt: at(now, -33, 23, 30),
      tags: serializeTags(["night", "quiet"]),
      place: DEMO_REAL_PLACES.adlerPlanetarium,
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
      place: DEMO_REAL_PLACES.lillstreet,
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
      body: "The west side of Cindy's terrace is the one to ask for.",
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
