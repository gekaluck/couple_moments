const CREATOR_ACCENTS = {
  amber: {
    key: "amber",
    label: "Amber",
    accent: "#ea580c",
    accentSoft: "#fff7ed",
    accentText: "#9a3412",
    avatarFrom: "#f59e0b",
    avatarTo: "#ea580c",
  },
  teal: {
    key: "teal",
    label: "Teal",
    accent: "#0d9488",
    accentSoft: "#f0fdfa",
    accentText: "#0f766e",
    avatarFrom: "#14b8a6",
    avatarTo: "#0f766e",
  },
  rose: {
    key: "rose",
    label: "Rose",
    accent: "#e11d48",
    accentSoft: "#fff1f2",
    accentText: "#9f1239",
    avatarFrom: "#fb7185",
    avatarTo: "#db2777",
  },
  indigo: {
    key: "indigo",
    label: "Indigo",
    accent: "#4f46e5",
    accentSoft: "#eef2ff",
    accentText: "#3730a3",
    avatarFrom: "#6366f1",
    avatarTo: "#4f46e5",
  },
  violet: {
    key: "violet",
    label: "Violet",
    accent: "#7c3aed",
    accentSoft: "#f5f3ff",
    accentText: "#5b21b6",
    avatarFrom: "#a78bfa",
    avatarTo: "#7c3aed",
  },
  slate: {
    key: "slate",
    label: "Slate",
    accent: "#475569",
    accentSoft: "#f8fafc",
    accentText: "#334155",
    avatarFrom: "#64748b",
    avatarTo: "#475569",
  },
} as const;

const DEFAULT_COLOR_ORDER = ["amber", "teal", "rose", "indigo", "violet", "slate"] as const;
const ALIAS_MAX_LENGTH = 32;

export type CreatorColorKey = keyof typeof CREATOR_ACCENTS;

export type CreatorIdentity = {
  id: string;
  name: string | null;
  email: string;
  alias?: string | null;
  initials?: string | null;
  color?: string | null;
};

export type CreatorAccent = {
  key: CreatorColorKey;
  label: string;
  accent: string;
  accentSoft: string;
  accentText: string;
  avatarFrom: string;
  avatarTo: string;
};

export type CreatorVisual = {
  displayName: string;
  initials: string;
  accent: CreatorAccent;
};

export type CreatorVisualMap = Record<string, CreatorVisual>;

export const CREATOR_COLOR_OPTIONS = DEFAULT_COLOR_ORDER.map((key) => ({
  key,
  label: CREATOR_ACCENTS[key].label,
}));

function normalizeColorKey(value: string | null | undefined): CreatorColorKey | null {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  return normalized in CREATOR_ACCENTS ? (normalized as CreatorColorKey) : null;
}

function normalizeInitials(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const cleaned = value.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 2);
  return cleaned || null;
}

function deriveInitials(source: string): string {
  const trimmed = source.trim();
  if (!trimmed) {
    return "ME";
  }
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function sanitizeMemberAlias(value: string | null | undefined): string | null {
  const normalized = value?.trim().slice(0, ALIAS_MAX_LENGTH);
  return normalized || null;
}

export function sanitizeMemberInitials(value: string | null | undefined): string | null {
  return normalizeInitials(value);
}

export function sanitizeMemberColor(value: string | null | undefined): CreatorColorKey | null {
  return normalizeColorKey(value);
}

export function getCreatorAccentByKey(key: string | null | undefined): CreatorAccent | null {
  const normalized = normalizeColorKey(key);
  return normalized ? CREATOR_ACCENTS[normalized] : null;
}

export function getCreatorDisplayName(identity: CreatorIdentity): string {
  const alias = sanitizeMemberAlias(identity.alias ?? null);
  if (alias) {
    return alias;
  }
  return identity.name?.trim() || identity.email;
}

export function getCreatorInitials(identity: CreatorIdentity): string {
  const customInitials = normalizeInitials(identity.initials ?? null);
  if (customInitials) {
    return customInitials;
  }
  return deriveInitials(getCreatorDisplayName(identity));
}

export function getAvatarGradient(accent: CreatorAccent): string {
  return `linear-gradient(135deg, ${accent.avatarFrom}, ${accent.avatarTo})`;
}

export function buildCreatorPalette(members: CreatorIdentity[]) {
  const mapping = new Map<string, CreatorAccent>();
  members.forEach((member, index) => {
    const colorKey = normalizeColorKey(member.color);
    const fallbackKey = DEFAULT_COLOR_ORDER[index % DEFAULT_COLOR_ORDER.length];
    mapping.set(member.id, CREATOR_ACCENTS[colorKey ?? fallbackKey]);
  });
  return mapping;
}

export function buildCreatorVisuals(members: CreatorIdentity[]): CreatorVisualMap {
  const palette = buildCreatorPalette(members);
  return members.reduce<CreatorVisualMap>((acc, member) => {
    acc[member.id] = {
      displayName: getCreatorDisplayName(member),
      initials: getCreatorInitials(member),
      accent: palette.get(member.id) ?? CREATOR_ACCENTS.amber,
    };
    return acc;
  }, {});
}
