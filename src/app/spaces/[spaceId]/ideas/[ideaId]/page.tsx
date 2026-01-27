import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { getCoupleSpaceForUser } from "@/lib/couple-spaces";
import { requireUserId } from "@/lib/current-user";
import { createEventForSpace } from "@/lib/events";
import { createIdeaComment, getIdeaForUser, listIdeaComments } from "@/lib/ideas";
import { prisma } from "@/lib/prisma";
import { normalizeTags, parseTags } from "@/lib/tags";
import IdeaComments from "./idea-comments";
import TagBadge from "@/components/ui/TagBadge";

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

  const tags = parseTags(idea.tags);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <nav className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
          <Link
            className="transition hover:text-[var(--accent-strong)]"
            href={`/spaces/${space.id}/ideas`}
          >
            Ideas
          </Link>
          <span>/</span>
          <span>Details</span>
        </nav>
        <h1 className="text-3xl font-semibold text-[var(--text-primary)] font-[var(--font-display)]">
          {idea.title}
        </h1>
        <p className="text-sm text-[var(--text-tertiary)]">
          Created on {formatDate(idea.createdAt)}
        </p>
      </header>

      <section className="surface p-6">
        {idea.description ? (
          <p className="text-sm text-[var(--text-muted)]">{idea.description}</p>
        ) : (
          <p className="text-sm text-[var(--text-tertiary)]">
            No notes yet. Add more detail to shape the plan.
          </p>
        )}
        {tags.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <TagBadge key={tag} label={tag} />
            ))}
          </div>
        ) : null}
      </section>

      {!idea.convertedToEventId ? (
        <section className="surface p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] font-[var(--font-display)]">
            Schedule as event
          </h2>
          <form className="mt-4 grid gap-3 md:grid-cols-[1.2fr_1fr_auto]" action={handleSchedule}>
            <input
              className="rounded-xl border border-[var(--panel-border)] bg-white/70 px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              name="date"
              type="date"
              required
            />
            <input
              className="rounded-xl border border-[var(--panel-border)] bg-white/70 px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              name="time"
              type="time"
            />
            <button
              className="rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 px-4 py-2 text-xs font-semibold text-white shadow-[var(--shadow-md)] transition hover:shadow-[var(--shadow-lg)]"
              type="submit"
            >
              Schedule as event
            </button>
          </form>
        </section>
      ) : (
        <section className="surface p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] font-[var(--font-display)]">
            Scheduled event
          </h2>
          <Link
            className="mt-3 inline-flex text-sm text-[var(--accent-strong)]"
            href={`/events/${idea.convertedToEventId}`}
          >
            View linked event
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
            name: comment.author.name,
            email: comment.author.email,
          },
        }))}
        currentUser={{
          name: currentUser.name,
          email: currentUser.email,
        }}
        onSubmit={handleIdeaComment}
      />
    </div>
  );
}
