import { redirect } from "next/navigation";

import { getCoupleSpaceForUser } from "@/lib/couple-spaces";
import { requireUserId } from "@/lib/current-user";
import { listEventsForSpace } from "@/lib/events";
import { parseTags } from "@/lib/tags";
import MemoriesClient from "./memories-client";

type PageProps = {
  params: Promise<{ spaceId: string }>;
};

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
    // Use attached photo first, then fall back to Google Places photo
    const attachedPhoto = event.photos?.[0]?.storageUrl ?? null;
    let placePhotoUrl: string | null = null;
    if (event.placePhotoUrls) {
      try {
        const urls = typeof event.placePhotoUrls === "string"
          ? JSON.parse(event.placePhotoUrls)
          : event.placePhotoUrls;
        placePhotoUrl = Array.isArray(urls) && urls.length > 0 ? urls[0] : null;
      } catch {
        placePhotoUrl = null;
      }
    }
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      dateTimeStart: event.dateTimeStart.toISOString(),
      tags: parseTags(event.tags),
      coverUrl: attachedPhoto ?? placePhotoUrl,
    };
  });

  return (
    <MemoriesClient memories={memoriesForClient} spaceId={space.id} />
  );
}
