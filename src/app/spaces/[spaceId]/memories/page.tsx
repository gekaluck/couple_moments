import { redirect } from "next/navigation";

import { getCoupleSpaceForUser } from "@/lib/couple-spaces";
import { requireUserId } from "@/lib/current-user";
import { listEventsForSpace } from "@/lib/events";
import { parseTags } from "@/lib/tags";
import MemoriesClient from "./memories-client";

type PageProps = {
  params: Promise<{ spaceId: string }>;
};

function getFirstPlacePhotoUrl(value: unknown): string | null {
  if (!value) {
    return null;
  }

  try {
    const raw = typeof value === "string" ? JSON.parse(value) : value;
    if (!Array.isArray(raw)) {
      return null;
    }

    const firstUrl = raw
      .map((item) => `${item}`.trim())
      .find((item) => /^https?:\/\//i.test(item));

    return firstUrl ?? null;
  } catch {
    return null;
  }
}

export default async function MemoriesPage({ params }: PageProps) {
  const userId = await requireUserId();
  const { spaceId } = await params;
  const space = await getCoupleSpaceForUser(spaceId, userId);
  if (!space) {
    redirect("/spaces/onboarding");
  }

  const memories = await listEventsForSpace({
    spaceId: space.id,
    timeframe: "past",
    includePhotos: true,
  });
  const memoriesForClient = memories.map((event) => {
    const attachedPhoto = event.photos?.[0]?.storageUrl ?? null;
    const placePhoto = getFirstPlacePhotoUrl(event.placePhotoUrls);
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      dateTimeStart: event.dateTimeStart.toISOString(),
      tags: parseTags(event.tags),
      coverUrl: attachedPhoto,
      fallbackCoverUrl: placePhoto,
    };
  });

  return (
    <MemoriesClient memories={memoriesForClient} spaceId={space.id} />
  );
}
