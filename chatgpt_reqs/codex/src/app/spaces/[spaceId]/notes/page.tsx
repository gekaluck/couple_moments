import Link from "next/link";
import { redirect } from "next/navigation";

import { getCoupleSpaceForUser } from "@/lib/couple-spaces";
import { requireUserId } from "@/lib/current-user";

import ConfirmForm from "@/components/ConfirmForm";
import IconButton from "@/components/ui/IconButton";
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

const AVATAR_GRADIENTS = [
  "from-rose-500 to-pink-600",
  "from-sky-500 to-indigo-600",
];

function getInitials(name: string | null | undefined, email: string) {
  const source = (name || email).trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "U";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function getAvatarGradient(userId: string) {
  let hash = 0;
  for (let index = 0; index < userId.length; index += 1) {
    hash = (hash * 31 + userId.charCodeAt(index)) % 997;
  }
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
}

function getNoteAccent(kind: string) {
  if (kind === "EVENT_COMMENT") {
    return "border-l-rose-400";
  }
  if (kind === "IDEA_COMMENT") {
    return "border-l-amber-400";
  }
  return "border-l-violet-400";
}

type PageProps = {
  params: Promise<{ spaceId: string }>;
  searchParams?: Promise<{ q?: string; type?: string; page?: string }>;
};

function formatTimestamp(date: Date) {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

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

  async function handleCreate(formData: FormData) {
    "use server";
    const currentUserId = await requireUserId();
    const content = formData.get("content")?.toString().trim() ?? "";

    if (!content) {
      redirect(
        `/spaces/${spaceIdForActions}/notes?type=${encodeURIComponent(filter)}&q=${encodeURIComponent(query)}`,
      );
    }

    await createNoteForSpace({
      spaceId: spaceIdForActions,
      userId: currentUserId,
      body: content,
      kind: "MANUAL",
    });
    redirect(
      `/spaces/${spaceIdForActions}/notes?type=${encodeURIComponent(filter)}&q=${encodeURIComponent(query)}`,
    );
  }

  async function handleDelete(formData: FormData) {
    "use server";
    const currentUserId = await requireUserId();
    const noteId = formData.get("noteId")?.toString();
    if (!noteId) {
      redirect(
        `/spaces/${spaceIdForActions}/notes?type=${encodeURIComponent(filter)}&q=${encodeURIComponent(query)}`,
      );
    }
    await deleteNote(noteId, currentUserId);
    redirect(
      `/spaces/${spaceIdForActions}/notes?type=${encodeURIComponent(filter)}&q=${encodeURIComponent(query)}`,
    );
  }

  return (
    <>
      <section className="surface p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] font-[var(--font-display)]">
              Notes center
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Capture quick thoughts, links, and reminders.
            </p>
          </div>
          <form
            className="flex w-full max-w-xl flex-wrap items-center gap-2 md:flex-nowrap"
            method="get"
          >
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
            <button
              className="h-10 shrink-0 rounded-full bg-violet-500 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-600 hover:shadow-md"
              type="submit"
            >
              Search
            </button>
          </form>
        </div>
        <form className="mt-6 flex flex-col gap-3" action={handleCreate}>
          <div className="rounded-2xl bg-[var(--panel-border)] p-px transition focus-within:bg-violet-500">
            <textarea
              className="min-h-[160px] w-full rounded-[15px] bg-white/90 px-4 py-3 text-sm text-[var(--text-primary)] outline-none"
              name="content"
              placeholder="Write a note..."
              required
            />
          </div>
          <div className="flex justify-end">
            <button
              className="rounded-full bg-violet-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-600 hover:shadow-md"
              type="submit"
            >
              Add note
            </button>
          </div>
        </form>
      </section>
      <section className="flex flex-col gap-4">
        {pageNotes.length === 0 ? (
          <div className="surface p-6">
            <p className="text-sm text-[var(--text-muted)]">No notes found.</p>
          </div>
        ) : null}
        {pageNotes.map((note) => {
          const metadataLabel =
            note.kind === "EVENT_COMMENT"
              ? "Event comment"
              : note.kind === "IDEA_COMMENT"
                ? "Idea comment"
                : "Note";

          return (
            <article
              key={note.id}
              className={`surface border-l-4 p-4 ${getNoteAccent(note.kind)}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-1 gap-3">
                  <div
                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-semibold text-white ${getAvatarGradient(note.authorUserId)}`}
                  >
                    {getInitials(note.author.name, note.author.email)}
                  </div>
                  <div>
                    <p className="text-sm text-[var(--text-primary)]">
                      {note.body}
                    </p>
                    <p className="mt-2 text-xs text-[var(--text-tertiary)]">
                      <span className="font-semibold text-[var(--text-primary)]">
                        {note.author.name || note.author.email}
                      </span>
                      <span className="mx-2">-</span>
                      <span>{formatTimestamp(note.createdAt)}</span>
                      <span className="mx-2">-</span>
                      <span>{metadataLabel}</span>
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
                        href={`/spaces/${space.id}/ideas/${note.parentId}#idea-comments`}
                      >
                        Linked idea comment
                      </Link>
                    ) : null}
                  </div>
                </div>
                <ConfirmForm action={handleDelete} message="Delete this note?">
                  <input type="hidden" name="noteId" value={note.id} />
                  <IconButton
                    icon={<TrashIcon />}
                    label="Delete note"
                    variant="danger"
                    type="submit"
                  />
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

