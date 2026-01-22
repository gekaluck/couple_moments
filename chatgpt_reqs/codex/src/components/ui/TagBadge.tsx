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

const CATEGORY_CLASS: Record<TagCategory, string> = {
  romantic: "from-rose-500 to-pink-600",
  food: "from-amber-500 to-orange-500",
  outdoor: "from-emerald-500 to-teal-600",
  entertainment: "from-violet-500 to-purple-600",
  travel: "from-sky-500 to-blue-600",
  cozy: "from-orange-400 to-amber-500",
  default: "from-slate-500 to-slate-600",
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
