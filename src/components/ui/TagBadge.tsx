type TagCategory =
  | "romantic"
  | "food"
  | "outdoor"
  | "entertainment"
  | "travel"
  | "cozy"
  | "default";

type TagBadgeProps = {
  label: string;
  category?: TagCategory;
};

// Brand-adjacent tones (dusty, warm) instead of raw Tailwind hues — the
// variety stays, the saturation matches the rose/peach palette (C-1).
const CATEGORY_CLASS: Record<TagCategory, string> = {
  romantic: "from-[#d94f5c] to-[#b83a48]",
  food: "from-[#d4944c] to-[#b87a35]",
  outdoor: "from-[#729b63] to-[#5c7f50]",
  entertainment: "from-[#b06a8f] to-[#96527a]",
  travel: "from-[#5f8fa3] to-[#4a7488]",
  cozy: "from-[#dd9f57] to-[#c98a3f]",
  default: "from-[#8b7f76] to-[#6f6259]",
};

const TAG_TO_CATEGORY: Record<string, TagCategory> = {
  // Romantic
  date: "romantic",
  together: "romantic",
  romantic: "romantic",
  anniversary: "romantic",
  love: "romantic",
  special: "romantic",

  // Food
  dinner: "food",
  lunch: "food",
  breakfast: "food",
  food: "food",
  restaurant: "food",
  cooking: "food",
  brunch: "food",

  // Outdoor
  outdoor: "outdoor",
  hiking: "outdoor",
  nature: "outdoor",
  beach: "outdoor",
  park: "outdoor",
  picnic: "outdoor",

  // Entertainment
  movie: "entertainment",
  concert: "entertainment",
  show: "entertainment",
  theater: "entertainment",
  music: "entertainment",
  game: "entertainment",
  weekend: "entertainment",

  // Travel
  travel: "travel",
  trip: "travel",
  vacation: "travel",
  adventure: "travel",
  explore: "travel",

  // Cozy
  cozy: "cozy",
  home: "cozy",
  chill: "cozy",
  relax: "cozy",
  lazy: "cozy",
};

function getCategory(label: string): TagCategory {
  const normalized = label.trim().toLowerCase();
  return TAG_TO_CATEGORY[normalized] ?? "default";
}

export default function TagBadge({ label, category }: TagBadgeProps) {
  const resolved = category ?? getCategory(label);
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r px-3 py-1 text-xs font-medium text-white shadow-[var(--shadow-sm)] ${CATEGORY_CLASS[resolved]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
      {label}
    </span>
  );
}
