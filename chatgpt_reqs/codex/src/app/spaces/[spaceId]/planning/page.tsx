import { redirect } from "next/navigation";

import { requireUserId } from "@/lib/current-user";

type PageProps = {
  params: Promise<{ spaceId: string }>;
};

export default async function PlanningPage({ params }: PageProps) {
  await requireUserId();
  const { spaceId } = await params;
  redirect(`/spaces/${spaceId}/calendar`);
}
