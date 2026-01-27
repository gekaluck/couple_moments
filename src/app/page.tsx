import { redirect } from "next/navigation";

import { listCoupleSpacesForUser } from "@/lib/couple-spaces";
import { requireUserId } from "@/lib/current-user";

export default async function Home() {
  const userId = await requireUserId();
  const spaces = await listCoupleSpacesForUser(userId);

  if (spaces.length === 0) {
    redirect("/spaces/onboarding");
  }

  redirect(`/spaces/${spaces[0]?.id}/calendar`);
}
