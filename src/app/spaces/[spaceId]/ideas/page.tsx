import { redirect } from "next/navigation";

import { requireUserId } from "@/lib/current-user";
type PageProps = {
  params: Promise<{ spaceId: string }>;
};

export default async function IdeasPage({ params }: PageProps) {
  await requireUserId();
  const { spaceId } = await params;
  redirect(`/spaces/${spaceId}/calendar`);
}
