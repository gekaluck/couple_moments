import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import { getCoupleSpaceForUser } from "@/lib/couple-spaces";
import { requireUserId } from "@/lib/current-user";
import SpaceNav from "./space-nav";

type LayoutProps = {
  children: ReactNode;
  params: Promise<{ spaceId: string }>;
};

export default async function SpaceLayout({ children, params }: LayoutProps) {
  const userId = await requireUserId();
  const { spaceId } = await params;
  const space = await getCoupleSpaceForUser(spaceId, userId);

  if (!space) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      <SpaceNav spaceId={space.id} spaceName={space.name || "Your space"} />
      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10">
        {children}
      </main>
    </div>
  );
}
