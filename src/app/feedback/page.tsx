import { redirect } from "next/navigation";

import FeedbackForm from "@/components/feedback/FeedbackForm";
import { requireUserId } from "@/lib/current-user";

type FeedbackPageProps = {
  searchParams?: Promise<{
    from?: string;
    spaceId?: string;
  }>;
};

function normalizeRelativePath(path: string | undefined) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return "/spaces";
  }
  return path;
}

function normalizeSpaceId(spaceId: string | undefined) {
  if (!spaceId) {
    return null;
  }
  const trimmed = spaceId.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export default async function FeedbackPage({ searchParams }: FeedbackPageProps) {
  const userId = await requireUserId();
  const query = (await searchParams) ?? {};
  const fromPath = normalizeRelativePath(query.from);
  const spaceId = normalizeSpaceId(query.spaceId);
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "";

  if (!fromPath.startsWith("/")) {
    redirect("/spaces");
  }

  return (
    <div className="mx-auto w-full max-w-[1220px] px-4 pb-12 pt-8 md:px-6 md:pt-10">
      <FeedbackForm
        fromPath={fromPath}
        supportEmail={supportEmail}
        userId={userId}
        spaceId={spaceId}
      />
    </div>
  );
}

