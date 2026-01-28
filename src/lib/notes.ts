import { prisma } from "@/lib/prisma";
import { createChangeLogEntry } from "@/lib/change-log";

type NoteKind = "MANUAL" | "EVENT_COMMENT" | "IDEA_COMMENT";
type NoteParentType = "EVENT" | "IDEA";

export async function listNotesForSpace(params: {
  spaceId: string;
  query?: string | null;
  kind?: NoteKind | null;
  take?: number;
  skip?: number;
}) {
  const { spaceId, query, kind, take, skip } = params;
  return prisma.note.findMany({
    where: {
      coupleSpaceId: spaceId,
      ...(kind ? { kind } : {}),
      ...(query
        ? {
            body: {
              contains: query,
            },
          }
        : {}),
    },
    ...(take !== undefined ? { take } : {}),
    ...(skip !== undefined ? { skip } : {}),
    include: {
      author: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function countNotesForSpace(params: {
  spaceId: string;
  query?: string | null;
  kind?: NoteKind | null;
}) {
  const { spaceId, query, kind } = params;
  return prisma.note.count({
    where: {
      coupleSpaceId: spaceId,
      ...(kind ? { kind } : {}),
      ...(query
        ? {
            body: {
              contains: query,
            },
          }
        : {}),
    },
  });
}

export async function createNoteForSpace(params: {
  spaceId: string;
  userId: string;
  body: string;
  kind: NoteKind;
  parentType?: NoteParentType | null;
  parentId?: string | null;
  replyToNoteId?: string | null;
}) {
  const note = await prisma.note.create({
    data: {
      coupleSpaceId: params.spaceId,
      authorUserId: params.userId,
      body: params.body.trim(),
      kind: params.kind,
      parentType: params.parentType ?? null,
      parentId: params.parentId ?? null,
      replyToNoteId: params.replyToNoteId ?? null,
    },
  });

  await createChangeLogEntry({
    coupleSpaceId: params.spaceId,
    entityType: "NOTE",
    entityId: note.id,
    userId: params.userId,
    changeType: "CREATE",
    summary: "Note added.",
  });

  return note;
}

export async function deleteNote(noteId: string, userId: string) {
  const note = await prisma.note.delete({
    where: { id: noteId },
  });

  await createChangeLogEntry({
    coupleSpaceId: note.coupleSpaceId,
    entityType: "NOTE",
    entityId: note.id,
    userId,
    changeType: "DELETE",
    summary: "Note deleted.",
  });

  return note;
}

export async function toggleNoteReaction(
  noteId: string,
  userId: string,
  emoji: string,
) {
  const existing = await prisma.reaction.findFirst({
    where: {
      targetType: "NOTE",
      targetId: noteId,
      userId,
      emoji,
    },
  });

  if (existing) {
    await prisma.reaction.delete({
      where: { id: existing.id },
    });
    return { removed: true };
  }

  await prisma.reaction.create({
    data: {
      targetType: "NOTE",
      targetId: noteId,
      userId,
      emoji,
    },
  });

  return { removed: false };
}

export async function listNoteReactions(noteIds: string[]) {
  if (noteIds.length === 0) {
    return [];
  }

  return prisma.reaction.findMany({
    where: {
      targetType: "NOTE",
      targetId: { in: noteIds },
    },
  });
}
