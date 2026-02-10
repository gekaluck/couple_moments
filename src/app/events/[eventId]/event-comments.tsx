"use client";

import { useOptimistic, useRef, useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { CreatorVisualMap, getAvatarGradient } from "@/lib/creator-colors";
import { formatTimestamp, getInitials } from "@/lib/formatters";

type Comment = {
  id: string;
  body: string;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    email: string;
  };
};

type EventCommentsProps = {
  eventId: string;
  initialComments: Comment[];
  currentUserId: string;
  currentUser: {
    name: string | null;
    email: string;
  };
  memberVisuals: CreatorVisualMap;
  onSubmit: (formData: FormData) => Promise<void>;
  onDelete: (formData: FormData) => Promise<void>;
};

export default function EventComments({
  eventId,
  initialComments,
  currentUserId,
  currentUser,
  memberVisuals,
  onSubmit,
  onDelete,
}: EventCommentsProps) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [optimisticComments, updateOptimisticComments] = useOptimistic(
    initialComments,
    (
      state,
      action:
        | { type: "add"; comment: Comment }
        | { type: "remove"; commentId: string },
    ) => {
      if (action.type === "add") {
        return [...state, action.comment];
      }
      return state.filter((comment) => comment.id !== action.commentId);
    },
  );

  function handleSubmit(formData: FormData) {
    const content = formData.get("content")?.toString().trim() ?? "";
    if (!content) {
      return;
    }
    formRef.current?.reset();
    startTransition(async () => {
      updateOptimisticComments({
        type: "add",
        comment: {
          id: `optimistic-${Date.now()}`,
          body: content,
          createdAt: new Date().toISOString(),
          author: {
            id: currentUserId,
            name: currentUser.name,
            email: currentUser.email,
          },
        },
      });
      try {
        await onSubmit(formData);
        setIsComposerOpen(false);
        toast.success("Comment posted");
      } catch {
        toast.error("Failed to post comment");
      }
    });
  }

  function handleDelete(comment: Comment) {
    if (!confirm("Delete this comment?")) {
      return;
    }
    const formData = new FormData();
    formData.set("commentId", comment.id);
    startTransition(async () => {
      updateOptimisticComments({ type: "remove", commentId: comment.id });
      try {
        await onDelete(formData);
        toast.success("Comment deleted");
      } catch {
        updateOptimisticComments({ type: "add", comment });
        toast.error("Failed to delete comment");
      }
    });
  }

  return (
    <section id="event-comments" className="surface p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] font-[var(--font-display)]">
          Comments
        </h3>
        <span className="text-xs text-[var(--text-tertiary)]">
          {optimisticComments.length} total
        </span>
      </div>

      {!isComposerOpen ? (
        <button
          type="button"
          className="mt-4 w-full rounded-2xl border border-dashed border-[var(--panel-border)] bg-white/65 px-4 py-3 text-left text-sm text-[var(--text-muted)] transition hover:border-rose-200 hover:bg-rose-50/40"
          onClick={() => setIsComposerOpen(true)}
        >
          Write a comment...
        </button>
      ) : null}

      {isComposerOpen ? (
        <form ref={formRef} className="mt-4 flex flex-col gap-3" action={handleSubmit}>
          <input type="hidden" name="eventId" value={eventId} />
          <textarea
            className="min-h-[96px] rounded-2xl border border-[var(--panel-border)] bg-white/70 px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            name="content"
            placeholder="Leave a comment..."
            required
          />
          <div className="flex justify-end">
            <button
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 px-4 py-2 text-xs font-semibold text-white shadow-[var(--shadow-md)] transition hover:shadow-[var(--shadow-lg)] disabled:opacity-50"
              type="submit"
              disabled={isPending}
            >
              {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
              {isPending ? "Posting..." : "Post comment"}
            </button>
          </div>
        </form>
      ) : null}

      <div className="mt-6 flex flex-col gap-4">
        {optimisticComments.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">
            No comments yet. Start the conversation.
          </p>
        ) : null}

        {optimisticComments.map((comment, index) => {
          const isOwnComment = comment.author.id === currentUserId;
          const isOptimistic = comment.id.startsWith("optimistic-");
          const authorVisual = memberVisuals[comment.author.id];
          const avatarGradient = authorVisual
            ? getAvatarGradient(authorVisual.accent)
            : index % 2 === 0
              ? "linear-gradient(135deg,#fb7185,#db2777)"
              : "linear-gradient(135deg,#0ea5e9,#4f46e5)";
          const authorName =
            authorVisual?.displayName || comment.author.name || comment.author.email;
          const authorInitials =
            authorVisual?.initials ||
            getInitials(comment.author.name, comment.author.email);
          return (
            <div
              key={comment.id}
              className="rounded-2xl border border-[var(--panel-border)] bg-white/70 p-3"
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white"
                  style={{ backgroundImage: avatarGradient }}
                >
                  {authorInitials}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-tertiary)]">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-[var(--text-primary)]">
                        {authorName}
                      </span>
                      <span>- {formatTimestamp(comment.createdAt)}</span>
                    </div>
                    {isOwnComment && !isOptimistic ? (
                      <button
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--panel-border)] text-[var(--text-muted)] opacity-70 transition hover:border-rose-200 hover:text-rose-600 hover:opacity-100"
                        type="button"
                        onClick={() => handleDelete(comment)}
                        aria-label="Delete comment"
                        title="Delete comment"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-[var(--text-primary)]">
                    {comment.body}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
