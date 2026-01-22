// Availability block colors - distinct from event colors (rose/pink)
// Using orange/teal to indicate "busy time" rather than romantic events
const CREATOR_PALETTE = [
  {
    // Partner A - Orange (busy time)
    accent: "#ea580c",
    accentSoft: "#fff7ed",
    accentText: "#c2410c",
  },
  {
    // Partner B - Teal (busy time)
    accent: "#0d9488",
    accentSoft: "#f0fdfa",
    accentText: "#0f766e",
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
