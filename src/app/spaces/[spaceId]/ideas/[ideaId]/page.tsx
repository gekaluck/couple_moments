import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { getCoupleSpaceForUser, listSpaceMembers } from "@/lib/couple-spaces";
import {
  buildCreatorVisuals,
  CREATOR_ACCENTS,
  getAvatarGradient,
} from "@/lib/creator-colors";
import { requireUserId } from "@/lib/current-user";
import { createEventForSpace } from "@/lib/events";
import { createIdeaComment, getIdeaForUser, listIdeaComments } from "@/lib/ideas";
import { deleteNote } from "@/lib/notes";
import { prisma } from "@/lib/prisma";
import { normalizeTags, parseTags } from "@/lib/tags";
import IdeaComments from "./idea-comments";

type PageProps = {
  params: Promise<{ spaceId: string; ideaId: string }>;
};

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function IdeaDetailPage({ params }: PageProps) {
  const userId = await requireUserId();
  const { spaceId, ideaId } = await params;
  const space = await getCoupleSpaceForUser(spaceId, userId);
  if (!space) {
    redirect("/spaces/onboarding");
  }

  const idea = await getIdeaForUser(ideaId, userId);
  if (!idea || idea.coupleSpaceId !== space.id) {
    notFound();
  }

  const comments = await listIdeaComments(idea.id);
  const members = await listSpaceMembers(space.id);
  const memberVisuals = buildCreatorVisuals(
    members.map((member) => ({
      id: member.userId,
      name: member.user.name,
      email: member.user.email,
      alias: member.alias,
      initials: member.initials,
      color: member.color,
    })),
  );
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });

  if (!currentUser) {
    redirect("/login");
  }

  // Store IDs for use in server actions (avoids TypeScript narrowing issues)
  const spaceIdForActions = space.id;
  const ideaIdForActions = idea.id;
  const ideaTitleForActions = idea.title;
  const ideaDescriptionForActions = idea.description;
  const ideaTagsForActions = idea.tags;

  async function handleSchedule(formData: FormData) {
    "use server";
    const currentUserId = await requireUserId();
    const date = formData.get("date")?.toString();
    const time = formData.get("time")?.toString() || "19:00";

    if (!date) {
      redirect(`/spaces/${spaceIdForActions}/ideas/${ideaIdForActions}`);
    }

    const dateTimeStart = new Date(`${date}T${time}`);
    if (Number.isNaN(dateTimeStart.getTime())) {
      redirect(`/spaces/${spaceIdForActions}/ideas/${ideaIdForActions}`);
    }

    await createEventForSpace(spaceIdForActions, currentUserId, {
      title: ideaTitleForActions,
      description: ideaDescriptionForActions,
      dateTimeStart,
      dateTimeEnd: null,
      tags: normalizeTags(parseTags(ideaTagsForActions)),
      linkedIdeaId: ideaIdForActions,
    });

    redirect(`/spaces/${spaceIdForActions}/ideas/${ideaIdForActions}`);
  }

  async function handleIdeaComment(formData: FormData) {
    "use server";
    const currentUserId = await requireUserId();
    const content = formData.get("content")?.toString().trim() ?? "";
    if (!content) {
      redirect(`/spaces/${spaceIdForActions}/ideas/${ideaIdForActions}`);
    }
    await createIdeaComment(ideaIdForActions, currentUserId, content);
    revalidatePath(`/spaces/${spaceIdForActions}/ideas/${ideaIdForActions}`);
  }

  async function handleDeleteComment(formData: FormData) {
    "use server";
    const currentUserId = await requireUserId();
    const commentId = formData.get("commentId")?.toString();
    if (!commentId) {
      return;
    }
    await deleteNote(commentId, currentUserId);
    revalidatePath(`/spaces/${spaceIdForActions}/ideas/${ideaIdForActions}`);
  }

  const tags = parseTags(idea.tags);
  const creatorVisual = memberVisuals[idea.createdByUserId];
  const creatorName =
    creatorVisual?.displayName || idea.createdBy?.name || idea.createdBy?.email || "Unknown";

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="rounded-2xl border border-amber-200/50 bg-[linear-gradient(175deg,rgba(255,255,255,0.92),rgba(255,248,240,0.75))] p-6 shadow-[var(--shadow-sm)]">
        <div className="flex items-center gap-2">
          <Link
            href={`/spaces/${space.id}/ideas`}
            className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)] transition hover:text-amber-600"
          >
            Ideas
          </Link>
          <span className="text-[var(--text-tertiary)]">/</span>
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-600">
            Details
          </span>
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.02em] text-[var(--text-primary)] font-[var(--font-display)]">
          {idea.title}
        </h1>
        <div className="mt-2 flex items-center gap-3 text-sm text-[var(--text-muted)]">
          <span
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold text-white"
            style={{
              backgroundImage: creatorVisual
                ? getAvatarGradient(creatorVisual.accent)
                : getAvatarGradient(CREATOR_ACCENTS.amber),
            }}
          >
            {creatorVisual?.initials ?? "ME"}
          </span>
          <span>
            Created {formatDate(idea.createdAt)} by {creatorName}
          </span>
        </div>
      </header>

      {/* Idea Details */}
      <section className="rounded-2xl border border-amber-200/60 bg-[linear-gradient(150deg,rgba(255,255,255,0.96),rgba(255,248,240,0.72))] p-6 shadow-[var(--shadow-sm)]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547Z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] font-[var(--font-display)]">
            Idea Details
          </h3>
        </div>

        <div className="mt-4 rounded-xl border border-amber-100/80 bg-white/70 p-4">
          {idea.description ? (
            <p className="text-sm leading-relaxed text-[var(--text-primary)]">{idea.description}</p>
          ) : (
            <p className="text-sm text-[var(--text-tertiary)]">
              No notes yet. Add more detail to shape the plan.
            </p>
          )}
        </div>

        {tags.length > 0 ? (
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-[var(--text-tertiary)]">Tags</p>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex rounded-full border border-amber-200/70 bg-white/85 px-3 py-1 text-xs font-medium text-amber-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {/* Schedule Section */}
      {!idea.convertedToEventId ? (
        <section className="rounded-2xl border border-amber-200/60 bg-[linear-gradient(150deg,rgba(255,255,255,0.96),rgba(255,248,240,0.72))] p-6 shadow-[var(--shadow-sm)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
                <path d="M12 14v4M10 16h4" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] font-[var(--font-display)]">
              Schedule as Event
            </h3>
          </div>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Turn this idea into a scheduled event on your calendar.
          </p>
          <form className="mt-4 flex flex-wrap items-end gap-3" action={handleSchedule}>
            <div className="flex-1 min-w-[140px]">
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-tertiary)]">Date</label>
              <input
                className="w-full rounded-xl border border-amber-200/80 bg-white/80 px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                name="date"
                type="date"
                required
              />
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-tertiary)]">Time (optional)</label>
              <input
                className="w-full rounded-xl border border-amber-200/80 bg-white/80 px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                name="time"
                type="time"
              />
            </div>
            <button
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-md)] transition hover:shadow-[var(--shadow-lg)]"
              type="submit"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Schedule
            </button>
          </form>
        </section>
      ) : (
        <section className="rounded-2xl border border-emerald-200/60 bg-[linear-gradient(150deg,rgba(255,255,255,0.96),rgba(240,253,244,0.72))] p-6 shadow-[var(--shadow-sm)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] font-[var(--font-display)]">
                Scheduled!
              </h3>
              <p className="text-sm text-[var(--text-muted)]">This idea has been converted to an event.</p>
            </div>
          </div>
          <Link
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
            href={`/events/${idea.convertedToEventId}`}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
            </svg>
            View event
          </Link>
        </section>
      )}

      <IdeaComments
        ideaId={idea.id}
        initialComments={comments.map((comment) => ({
          id: comment.id,
          body: comment.body,
          createdAt: comment.createdAt.toISOString(),
          author: {
            id: comment.author.id,
            name: comment.author.name,
            email: comment.author.email,
          },
        }))}
        currentUserId={userId}
        currentUser={{
          name: currentUser.name,
          email: currentUser.email,
        }}
        memberVisuals={memberVisuals}
        onSubmit={handleIdeaComment}
        onDelete={handleDeleteComment}
      />
    </div>
  );
}
