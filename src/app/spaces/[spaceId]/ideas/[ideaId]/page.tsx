import { redirect } from "next/navigation";

import { getCoupleSpaceForUser } from "@/lib/couple-spaces";
import { requireUserId } from "@/lib/current-user";

type PageProps = {
  params: Promise<{ spaceId: string; ideaId: string }>;
};

export default async function IdeaDetailPage({ params }: PageProps) {
  const userId = await requireUserId();
  const { spaceId, ideaId } = await params;
  const space = await getCoupleSpaceForUser(spaceId, userId);

  if (!space) {
    redirect("/spaces/onboarding");
  }

  redirect(`/spaces/${space.id}/calendar#idea-${ideaId}`);
}
