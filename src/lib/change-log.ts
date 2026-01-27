import { prisma } from "@/lib/prisma";

export type ChangeLogInput = {
  entityType: "EVENT" | "IDEA" | "NOTE";
  entityId: string;
  userId: string;
  changeType: "CREATE" | "UPDATE" | "DELETE";
  summary: string;
};

export async function createChangeLogEntry(input: ChangeLogInput) {
  return prisma.changeLogEntry.create({
    data: input,
  });
}
