import { prisma } from "@/lib/prisma";

export type ChangeLogInput = {
  coupleSpaceId?: string;
  entityType: "EVENT" | "IDEA" | "NOTE";
  entityId: string;
  userId: string;
  changeType: "CREATE" | "UPDATE" | "DELETE";
  summary: string;
};

export async function createChangeLogEntry(input: ChangeLogInput) {
  return prisma.changeLogEntry.create({
    data: {
      coupleSpaceId: input.coupleSpaceId,
      entityType: input.entityType,
      entityId: input.entityId,
      userId: input.userId,
      changeType: input.changeType,
      summary: input.summary,
    },
  });
}
