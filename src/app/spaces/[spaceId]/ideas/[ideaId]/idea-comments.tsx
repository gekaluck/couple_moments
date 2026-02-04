"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";

import { formatTimestamp } from "@/lib/formatters";

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

type IdeaCommentsProps = {
  ideaId: string;
  initialComments: Comment[];
  currentUserId: string;
  currentUser: {
    name: string | null;
    email: string;
  };
  onSubmit: (formData: FormData) => Promise<void>;
  onDelete: (formData: FormData) => Promise<void>;
};

export default function IdeaComments({
  ideaId,
  initialComments,
  currentUserId,
  currentUser,
  onSubmit,
  onDelete,
}: IdeaCommentsProps) {
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
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    const content = formData.get("content")?.toString().trim() ?? "";
    if (!content) {
      return;
    }
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
    startTransition(async () => {
      try {
        await onSubmit(formData);
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
    <section id="idea-comments" className="surface p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] font-[var(--font-display)]">
          Comments
        </h3>
        <span className="text-xs text-[var(--text-tertiary)]">
          {optimisticComments.length} total
        </span>
      </div>
      <form className="mt-4 flex flex-col gap-3" action={handleSubmit}>
        <input type="hidden" name="ideaId" value={ideaId} />
        <textarea
          className="min-h-[110px] rounded-2xl border border-[var(--panel-border)] bg-white/70 px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
          name="content"
          placeholder="Leave a comment..."
          required
        />
        <div className="flex justify-end">
          <button
            className="rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 px-4 py-2 text-xs font-semibold text-white shadow-[var(--shadow-md)] transition hover:shadow-[var(--shadow-lg)] disabled:opacity-50"
            type="submit"
            disabled={isPending}
          >
            {isPending ? "Posting..." : "Post comment"}
          </button>
        </div>
      </form>
      <div className="mt-6 flex flex-col gap-4">
        {optimisticComments.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">
            No comments yet. Start the conversation.
          </p>
        ) : null}
        {optimisticComments.map((comment) => {
          const isOwnComment = comment.author.id === currentUserId;
          const isOptimistic = comment.id.startsWith("optimistic-");
          return (
            <div
              key={comment.id}
              className="rounded-2xl border border-[var(--panel-border)] bg-white/70 p-4"
            >
              <p className="text-sm text-[var(--text-primary)]">{comment.body}</p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-tertiary)]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-[var(--text-primary)]">
                    {comment.author.name || comment.author.email}
                  </span>
                  <span>- {formatTimestamp(comment.createdAt)}</span>
                </div>
                {isOwnComment && !isOptimistic ? (
                  <button
                    className="text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-500 transition hover:text-rose-600"
                    type="button"
                    onClick={() => handleDelete(comment)}
                  >
                    Delete
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
