type TagVariant = "date" | "together" | "cozy" | "weekend" | "test";

type TagBadgeProps = {
  label: string;
  variant?: TagVariant;
};

const VARIANT_CLASS: Record<TagVariant, string> = {
  date: "from-rose-500 to-pink-600",
  together: "from-rose-500 to-pink-600",
  cozy: "from-orange-400 to-amber-500",
  weekend: "from-purple-400 to-indigo-500",
  test: "from-gray-400 to-gray-500",
};

function normalizeVariant(label: string): TagVariant {
  switch (label.trim().toLowerCase()) {
    case "date":
      return "date";
    case "together":
      return "together";
    case "cozy":
      return "cozy";
    case "weekend":
      return "weekend";
    case "test":
      return "test";
    default:
      return "test";
  }
}

export default function TagBadge({ label, variant }: TagBadgeProps) {
  const resolved = variant ?? normalizeVariant(label);
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r px-3 py-1 text-xs font-medium text-white shadow-[var(--shadow-sm)] ${VARIANT_CLASS[resolved]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
      {label}
    </span>
  );
}
