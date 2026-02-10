import { prisma } from "@/lib/prisma";

type ActivityEntry = {
  id: string;
  createdAt: Date;
  action: string;
  entityType: "EVENT" | "IDEA" | "COMMENT" | "NOTE";
  entityId?: string | null;
  entityTitle?: string | null;
  entityHref?: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
};

function summarizeNote(note: { body: string; kind: string }) {
  const preview = note.body.length > 80 ? `${note.body.slice(0, 80)}...` : note.body;
  return preview;
}

export async function listActivityForSpace(spaceId: string): Promise<ActivityEntry[]> {
  const [events, ideas, notes, changeLogs] = await Promise.all([
    prisma.event.findMany({
      where: { coupleSpaceId: spaceId },
      select: { id: true, title: true },
    }),
    prisma.idea.findMany({
      where: { coupleSpaceId: spaceId },
      select: { id: true, title: true },
    }),
    prisma.note.findMany({
      where: { coupleSpaceId: spaceId },
      include: { author: true },
    }),
    prisma.changeLogEntry.findMany({
      where: { coupleSpaceId: spaceId },
      include: { user: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const eventTitleById = new Map(events.map((event) => [event.id, event.title]));
  const ideaTitleById = new Map(ideas.map((idea) => [idea.id, idea.title]));

  // Notes (including comment notes) are rendered from the Note table entries below.
  // Exclude overlapping changelog entries so one user action maps to one feed card.
  const filteredLogs = changeLogs.filter((entry) => {
    if (entry.entityType === "NOTE") {
      return false;
    }
    return !(
      entry.changeType === "UPDATE" &&
      (entry.summary === "Comment added to event." ||
        entry.summary === "Comment added to idea.")
    );
  });

  const logEntries: ActivityEntry[] = filteredLogs.map((entry) => {
    const entityTitle =
      entry.entityType === "EVENT"
        ? eventTitleById.get(entry.entityId)
        : ideaTitleById.get(entry.entityId);
    const entityHref =
      entry.entityType === "EVENT"
        ? `/events/${entry.entityId}`
        : `/spaces/${spaceId}/calendar#idea-${entry.entityId}`;
    const actionBase =
      entry.entityType === "EVENT" ? "Event" : "Idea";
    const actionSuffix =
      entry.changeType === "CREATE"
        ? "created"
        : entry.changeType === "UPDATE"
          ? "updated"
          : "deleted";
    return {
      id: `log-${entry.id}`,
      createdAt: entry.createdAt,
      action: `${actionBase} ${actionSuffix}`,
      entityType: entry.entityType,
      entityId: entry.entityId,
      entityTitle: entityTitle ?? null,
      entityHref: entityTitle ? entityHref : null,
      user: entry.user,
    };
  });

  const noteEntries: ActivityEntry[] = notes.map((note) => {
    const isComment =
      note.kind === "EVENT_COMMENT" || note.kind === "IDEA_COMMENT";
    const parentTitle =
      note.parentType === "EVENT"
        ? eventTitleById.get(note.parentId ?? "")
        : note.parentType === "IDEA"
          ? ideaTitleById.get(note.parentId ?? "")
          : null;
    const parentHref =
      note.parentType === "EVENT" && note.parentId
        ? `/events/${note.parentId}`
        : note.parentType === "IDEA" && note.parentId
          ? `/spaces/${spaceId}/calendar#idea-${note.parentId}`
          : null;
    return {
      id: `note-${note.id}`,
      createdAt: note.createdAt,
      action: isComment ? "Comment added" : `Note added: ${summarizeNote(note)}`,
      entityType: isComment ? "COMMENT" : "NOTE",
      entityId: note.parentId ?? null,
      entityTitle: isComment ? parentTitle ?? null : null,
      entityHref: isComment && parentTitle ? parentHref : null,
      user: note.author,
    };
  });

  const combined = [...logEntries, ...noteEntries];
  combined.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return combined;
}
