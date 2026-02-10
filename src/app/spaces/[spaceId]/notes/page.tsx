import Link from "next/link";
import { redirect } from "next/navigation";

import { getCoupleSpaceForUser, listSpaceMembers } from "@/lib/couple-spaces";
import { buildCreatorVisuals, getAvatarGradient } from "@/lib/creator-colors";
import { requireUserId } from "@/lib/current-user";
import { formatTimestamp, getInitials } from "@/lib/formatters";

import ConfirmForm from "@/components/ConfirmForm";
import EmptyState from "@/components/ui/EmptyState";
import MutationToast from "@/components/ui/MutationToast";
import {
  countNotesForSpace,
  createNoteForSpace,
  deleteNote,
  listNotesForSpace,
} from "@/lib/notes";

const SearchIcon = () => (
  <svg
    aria-hidden="true"
    className="h-4 w-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <circle cx="11" cy="11" r="7" strokeWidth="1.5" />
    <path d="m20 20-3.5-3.5" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const TrashIcon = () => (
  <svg
    aria-hidden="true"
    className="h-4 w-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path d="M3 6h18" strokeWidth="1.5" strokeLinecap="round" />
    <path
      d="M8 6V4h8v2M6 6l1 14h10l1-14"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M10 11v6M14 11v6" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const NOTE_BADGE_CLASS =
  "rounded-full border border-[var(--panel-border)] bg-[var(--surface-50)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]";

type PageProps = {
  params: Promise<{ spaceId: string }>;
  searchParams?: Promise<{ q?: string; type?: string; page?: string }>;
};

export default async function NotesPage({ params, searchParams }: PageProps) {
  const userId = await requireUserId();
  const { spaceId } = await params;
  const search = (await searchParams) ?? {};
  const query = search.q?.trim() || "";
  const filter = search.type ?? "all";
  const page = Math.max(Number(search.page ?? "1") || 1, 1);
  const pageSize = 20;
  const space = await getCoupleSpaceForUser(spaceId, userId);

  if (!space) {
    redirect("/spaces/onboarding");
  }
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
  // Store space ID for use in server actions (avoids TypeScript narrowing issues)
  const spaceIdForActions = space.id;

  const kindFilter =
    filter === "free"
      ? "MANUAL"
      : filter === "event"
        ? "EVENT_COMMENT"
        : null;
  const notes = await listNotesForSpace({
    spaceId: space.id,
    query,
    kind: kindFilter,
    take: pageSize + 1,
    skip: (page - 1) * pageSize,
  });
  const totalCount = await countNotesForSpace({
    spaceId: space.id,
    query,
    kind: kindFilter,
  });
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const hasMore = notes.length > pageSize;
  const pageNotes = hasMore ? notes.slice(0, pageSize) : notes;
  const hasNextPage = page < totalPages;
  const notesBaseHref = `/spaces/${spaceIdForActions}/notes`;

  async function handleCreate(formData: FormData) {
    "use server";
    const currentUserId = await requireUserId();
    const content = formData.get("content")?.toString().trim() ?? "";

    if (!content) {
      redirect(notesBaseHref);
    }

    await createNoteForSpace({
      spaceId: spaceIdForActions,
      userId: currentUserId,
      body: content,
      kind: "MANUAL",
    });
    redirect(`${notesBaseHref}?toast=note-added`);
  }

  async function handleDelete(formData: FormData) {
    "use server";
    const currentUserId = await requireUserId();
    const noteId = formData.get("noteId")?.toString();
    if (!noteId) {
      redirect(notesBaseHref);
    }
    await deleteNote(noteId, currentUserId);
    redirect(`${notesBaseHref}?toast=note-deleted`);
  }

  return (
    <>
      <MutationToast
        messages={{
          "note-added": "Note saved!",
          "note-deleted": "Note removed.",
        }}
      />
      <section className="surface-muted p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="section-kicker">Notes</p>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] font-[var(--font-display)]">
              Notes center
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
              <span className="rounded-full border border-[var(--panel-border)] bg-[var(--surface-50)] px-2.5 py-1 text-[var(--text-secondary)]">
                {totalCount} notes
              </span>
              <span className="rounded-full border border-[var(--panel-border)] bg-white/85 px-2.5 py-1">
                Page {page} / {totalPages}
              </span>
            </div>
          </div>
          <form
            className="grid w-full max-w-xl gap-2 rounded-2xl border border-[var(--panel-border)] bg-white/70 p-2 md:grid-cols-[minmax(160px,auto),1fr]"
            method="get"
          >
            <input type="hidden" name="page" value="1" />
            <div className="relative flex h-10 min-w-[150px] items-center">
              <select
                className="h-10 w-full rounded-full border border-[var(--panel-border)] bg-white px-4 text-sm font-medium leading-none text-[var(--text-primary)] shadow-sm outline-none transition focus:border-[var(--accent)]"
                name="type"
                defaultValue={filter}
              >
                <option value="all">All</option>
                <option value="free">Free notes</option>
                <option value="event">Linked to events</option>
              </select>
            </div>
            <div className="relative flex h-10 flex-1 items-center">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">
                <SearchIcon />
              </span>
              <input
                className="h-10 w-full rounded-full border border-[var(--panel-border)] bg-white pl-9 pr-4 text-sm leading-none text-[var(--text-primary)] shadow-sm outline-none transition focus:border-[var(--accent)]"
                name="q"
                placeholder="Search notes..."
                defaultValue={query}
              />
            </div>
            <button type="submit" className="sr-only">
              Search
            </button>
          </form>
        </div>
        <form className="mt-4 flex flex-col gap-3 rounded-2xl border border-[var(--panel-border)] bg-white/70 p-3" action={handleCreate}>
          <div className="rounded-2xl bg-[var(--panel-border)] p-px transition focus-within:bg-[var(--action-primary)]">
            <textarea
              className="min-h-[44px] w-full rounded-[15px] bg-white/90 px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition-[min-height] duration-200 focus:min-h-[132px]"
              name="content"
              placeholder="Write a note..."
              required
            />
          </div>
          <div className="flex justify-end">
            <button
              className="rounded-full bg-[var(--action-primary)] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--action-primary-strong)] hover:shadow-md"
              type="submit"
            >
              Add note
            </button>
          </div>
        </form>
      </section>
      <section className="stagger-children flex flex-col gap-4">
        {pageNotes.length === 0 ? (
          <div className="surface p-6">
            <EmptyState
              variant="notes"
              title="No notes yet"
              description={
                query
                  ? "No notes match your search. Try a different query."
                  : "Capture quick thoughts, links, and reminders here."
              }
            />
          </div>
        ) : null}
        {pageNotes.map((note) => {
          const authorVisual = memberVisuals[note.authorUserId];
          const authorName =
            authorVisual?.displayName || note.author.name || note.author.email;
          const avatarGradient = authorVisual
            ? getAvatarGradient(authorVisual.accent)
            : "linear-gradient(135deg,#fb7185,#db2777)";
          const authorInitials =
            authorVisual?.initials || getInitials(note.author.name, note.author.email);
          const metadataLabel =
            note.kind === "EVENT_COMMENT"
              ? "Event comment"
              : note.kind === "IDEA_COMMENT"
                ? "Idea comment"
                : "Note";

          return (
            <article
              key={note.id}
              className="group surface border border-[var(--panel-border)] bg-white p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-1 gap-3">
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                    style={{ backgroundImage: avatarGradient }}
                  >
                    {authorInitials}
                  </div>
                  <div>
                    <p className="text-sm text-[var(--text-primary)]">
                      {note.body}
                    </p>
                    <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
                      <span className="font-semibold text-[var(--text-primary)]">
                        {authorName}
                      </span>
                      <span>/</span>
                      <span>{formatTimestamp(note.createdAt)}</span>
                      <span>/</span>
                      <span className={NOTE_BADGE_CLASS}>
                        {metadataLabel}
                      </span>
                    </p>
                    {note.parentType === "EVENT" && note.parentId ? (
                      <Link
                        className="mt-2 inline-flex text-xs text-[var(--accent-strong)] transition hover:text-[var(--accent)] hover:underline"
                        href={`/events/${note.parentId}#event-comments`}
                      >
                        Linked event comment
                      </Link>
                    ) : null}
                    {note.parentType === "IDEA" && note.parentId ? (
                      <Link
                        className="mt-2 inline-flex text-xs text-[var(--accent-strong)] transition hover:text-[var(--accent)] hover:underline"
                        href={`/spaces/${space.id}/calendar#idea-${note.parentId}`}
                      >
                        Linked idea comment
                      </Link>
                    ) : null}
                  </div>
                </div>
                <ConfirmForm action={handleDelete} message="Delete this note?">
                  <input type="hidden" name="noteId" value={note.id} />
                  <button
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--panel-border)] bg-white text-[var(--text-muted)] opacity-55 transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100"
                    type="submit"
                    aria-label="Delete note"
                    title="Delete note"
                  >
                    <TrashIcon />
                  </button>
                </ConfirmForm>
              </div>
            </article>
          );
        })}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-[var(--text-tertiary)]">
            Page {page} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            {page > 1 ? (
              <Link
                className="rounded-full border border-[var(--panel-border)] bg-white px-4 py-2 text-xs font-semibold text-[var(--text-primary)] shadow-sm transition hover:shadow-md"
                href={`/spaces/${space.id}/notes?type=${encodeURIComponent(filter)}&q=${encodeURIComponent(query)}&page=${page - 1}`}
              >
                Previous
              </Link>
            ) : (
              <span className="rounded-full border border-[var(--panel-border)] px-4 py-2 text-xs font-semibold text-[var(--text-tertiary)] opacity-60">
                Previous
              </span>
            )}
            {hasNextPage ? (
              <Link
                className="rounded-full border border-transparent bg-gradient-to-r from-rose-500 to-pink-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:shadow-md"
                href={`/spaces/${space.id}/notes?type=${encodeURIComponent(filter)}&q=${encodeURIComponent(query)}&page=${page + 1}`}
              >
                Next
              </Link>
            ) : (
              <span className="rounded-full border border-[var(--panel-border)] px-4 py-2 text-xs font-semibold text-[var(--text-tertiary)] opacity-60">
                Next
              </span>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
