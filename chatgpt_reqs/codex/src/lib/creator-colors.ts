const CREATOR_PALETTE = [
  {
    accent: "var(--accent-primary)",
    accentSoft: "#fde9ec",
    accentText: "var(--accent-primary-dark)",
  },
  {
    accent: "var(--accent-secondary)",
    accentSoft: "#e8f0f6",
    accentText: "#335d78",
  },
];

type CreatorIdentity = {
  id: string;
  name: string | null;
  email: string;
};

export type CreatorAccent = {
  accent: string;
  accentSoft: string;
  accentText: string;
};

export function getCreatorInitials(identity: CreatorIdentity) {
  const source = identity.name?.trim() || identity.email.split("@")[0];
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function buildCreatorPalette(members: CreatorIdentity[]) {
  const mapping = new Map<string, CreatorAccent>();
  members.forEach((member, index) => {
    mapping.set(member.id, CREATOR_PALETTE[index % CREATOR_PALETTE.length]);
  });
  return mapping;
}
