"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Calendar, MapPin, MessageSquare, Pencil, Trash2 } from "lucide-react";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import PlaceSearch, { PlaceSelection } from "@/components/places/PlaceSearch";
import TagInput from "@/components/ui/TagInput";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import TagBadge from "@/components/ui/TagBadge";
import Button from "@/components/ui/Button";
import Card, { CardDescription, CardFooter, CardTitle } from "@/components/ui/Card";

import { formatTimeAgo, getInitials } from "@/lib/formatters";

function getTodayDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

type Idea = {
  id: string;
  title: string;
  description: string | null;
  tags: string[];
  createdAt: Date;
  createdBy: { name: string | null; email: string };
  placeId?: string | null;
  placeName?: string | null;
  placeAddress?: string | null;
  placeLat?: number | null;
  placeLng?: number | null;
  placeUrl?: string | null;
  placeWebsite?: string | null;
  placeOpeningHours?: string[] | null;
  placePhotoUrls?: string[] | null;
};

type IdeaComment = {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; name: string | null; email: string };
};

type IdeaCardProps = {
  idea: Idea;
  commentCount: number;
  comments: IdeaComment[];
  currentUserId: string;
  mapsApiKey?: string;
  hasGoogleCalendar?: boolean;
  onSchedule: (formData: FormData) => Promise<void>;
  onAddComment: (formData: FormData) => Promise<void>;
  onDelete: (formData: FormData) => Promise<void>;
  onEdit: (formData: FormData) => Promise<void>;
};

export default function IdeaCard({
  idea,
  commentCount,
  comments,
  currentUserId,
  mapsApiKey,
  hasGoogleCalendar = false,
  onSchedule,
  onAddComment,
  onDelete,
  onEdit,
}: IdeaCardProps) {
  const router = useRouter();
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const todayStr = getTodayDateString();
  const [editPlace, setEditPlace] = useState<PlaceSelection | null>(
    idea.placeId && idea.placeLat != null && idea.placeLng != null && idea.placeUrl
      ? {
          placeId: idea.placeId,
          name: idea.placeName ?? "",
          address: idea.placeAddress ?? "",
          lat: idea.placeLat,
          lng: idea.placeLng,
          url: idea.placeUrl,
          website: idea.placeWebsite ?? undefined,
          openingHours: idea.placeOpeningHours ?? undefined,
          photoUrls: idea.placePhotoUrls ?? undefined,
        }
      : null
  );
  const [localComments, setLocalComments] = useState<IdeaComment[]>(comments);
  const [localCount, setLocalCount] = useState(commentCount);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (isCommentsOpen) {
      inputRef.current?.focus();
    }
  }, [isCommentsOpen]);

  useEffect(() => {
    setLocalComments(comments);
    setLocalCount(commentCount);
  }, [comments, commentCount]);

  const hasOpenModal = isScheduleOpen || isEditOpen || isDeleteOpen;

  return (
    <Card
      id={`idea-${idea.id}`}
      variant="amber"
      padding="md"
      className={`card-hover animate-fade-in-up border-amber-200/70 bg-[linear-gradient(150deg,rgba(255,255,255,0.95),rgba(255,248,231,0.72))] ${hasOpenModal ? "relative z-50" : ""}`}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <CardTitle className="text-lg">{idea.title}</CardTitle>
          {idea.description ? (
            <CardDescription>{idea.description}</CardDescription>
          ) : null}
          {idea.placeName || idea.placeAddress ? (
            <div className="mt-2 inline-flex flex-wrap items-center gap-2 rounded-full border border-amber-200/70 bg-white/75 px-3 py-1 text-xs text-[var(--text-tertiary)]">
              <MapPin className="h-3.5 w-3.5 text-amber-600" />
              <span className="text-[var(--text-muted)]">
                {idea.placeName || idea.placeAddress}
              </span>
              {idea.placeUrl || idea.placeWebsite ? (
                <a
                  className="font-semibold text-amber-600 transition hover:text-amber-700 hover:underline"
                  href={idea.placeWebsite || idea.placeUrl || "#"}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open
                </a>
              ) : null}
            </div>
          ) : null}
          {idea.tags.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {idea.tags.map((tag) => (
                <TagBadge key={tag} label={tag} />
              ))}
            </div>
          ) : null}
          <CardFooter className="mt-3 justify-start text-xs text-[var(--text-tertiary)]">
            <span>
              Created {formatTimeAgo(idea.createdAt)} by{" "}
              <span className="font-semibold text-[var(--text-primary)]">
                {idea.createdBy.name || idea.createdBy.email}
              </span>
            </span>
          </CardFooter>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-full border border-amber-200/90 bg-white/90 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:border-amber-300 hover:bg-amber-50/80"
            title="Schedule as event"
            onClick={() => setIsScheduleOpen(true)}
            type="button"
          >
            <Calendar className="h-4 w-4" />
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            title="Edit idea"
            onClick={() => setIsEditOpen(true)}
            type="button"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            className="relative inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/90 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:border-gray-300 hover:bg-white"
            title={`Comments (${localCount})`}
            onClick={() => setIsCommentsOpen((prev) => !prev)}
            type="button"
          >
            <MessageSquare className="h-4 w-4" />
            {localCount > 0 ? (
              <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                {localCount}
              </span>
            ) : null}
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50/80 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100/80"
            title="Delete idea"
            type="button"
            onClick={() => setIsDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isCommentsOpen ? (
        <div className="mt-4 animate-slide-down rounded-2xl border border-white/70 bg-white/75 p-4 shadow-[var(--shadow-sm)] backdrop-blur-sm">
          <div className="flex flex-col">
            {localComments.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">
                No comments yet.
              </p>
            ) : null}
            {localComments.map((comment) => {
              const isCurrentUser = comment.author.id === currentUserId;
              const avatarGradient = isCurrentUser
                ? "from-sky-500 to-indigo-600"
                : "from-rose-500 to-pink-600";
              return (
                <div
                  key={comment.id}
                  className="flex items-start gap-3 border-b border-gray-200/70 py-2 last:border-b-0"
                >
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br text-xs font-semibold text-white ${avatarGradient}`}
                  >
                    {getInitials(comment.author.name, comment.author.email)}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-[var(--text-tertiary)]">
                      <span className="font-semibold text-[var(--text-primary)]">
                        {comment.author.name || comment.author.email}
                      </span>
                      <span className="mx-2">|</span>
                      {formatTimeAgo(comment.createdAt)}
                    </p>
                    <p className="mt-1 text-sm text-[var(--text-primary)]">
                      {comment.body}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <form
            ref={formRef}
            className="mt-3 flex flex-wrap gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              const content = formData.get("content")?.toString().trim() ?? "";
              if (!content) {
                return;
              }
              const optimistic: IdeaComment = {
                id: `temp-${Date.now()}`,
                body: content,
                createdAt: new Date().toISOString(),
                author: { id: currentUserId, name: "You", email: "you" },
              };
              setLocalComments((prev) => [...prev, optimistic]);
              setLocalCount((prev) => prev + 1);
              event.currentTarget.reset();
              startTransition(async () => {
                try {
                  await onAddComment(formData);
                  toast.success("Comment added");
                } catch {
                  toast.error("Failed to add comment");
                }
              });
            }}
          >
            <input type="hidden" name="ideaId" value={idea.id} />
            <input
              ref={inputRef}
              className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-200/70"
              name="content"
              placeholder="Add comment..."
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  formRef.current?.requestSubmit();
                }
              }}
            />
            <button
              className="rounded-xl bg-[var(--action-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--action-primary-strong)]"
              type="submit"
              disabled={isPending}
            >
              {isPending ? "Posting..." : "Post"}
            </button>
          </form>
        </div>
      ) : null}

      <Modal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        title="Schedule this idea"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {idea.title}
            </p>
            {idea.description ? (
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                {idea.description}
              </p>
            ) : null}
          </div>
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              startTransition(async () => {
                try {
                  await onSchedule(formData);
                  toast.success("Event created from idea!");
                  router.refresh();
                  setIsScheduleOpen(false);
                } catch {
                  toast.error("Failed to schedule idea");
                }
              });
            }}
          >
            <input type="hidden" name="ideaId" value={idea.id} />
            <input type="hidden" name="placeId" value={idea.placeId ?? ""} />
            <input type="hidden" name="placeName" value={idea.placeName ?? ""} />
            <input
              type="hidden"
              name="placeAddress"
              value={idea.placeAddress ?? ""}
            />
            <input
              type="hidden"
              name="placeWebsite"
              value={idea.placeWebsite ?? ""}
            />
            <input
              type="hidden"
              name="placeOpeningHours"
              value={
                idea.placeOpeningHours
                  ? JSON.stringify(idea.placeOpeningHours)
                  : ""
              }
            />
            <input
              type="hidden"
              name="placePhotoUrls"
              value={
                idea.placePhotoUrls
                  ? JSON.stringify(idea.placePhotoUrls)
                  : ""
              }
            />
            <input
              type="hidden"
              name="placeLat"
              value={idea.placeLat?.toString() ?? ""}
            />
            <input
              type="hidden"
              name="placeLng"
              value={idea.placeLng?.toString() ?? ""}
            />
            <input type="hidden" name="placeUrl" value={idea.placeUrl ?? ""} />
            <input
              className="rounded-xl border border-[var(--panel-border)] bg-white/85 px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--action-primary)]"
              name="date"
              type="date"
              min={todayStr}
              required
            />
            <input
              className="rounded-xl border border-[var(--panel-border)] bg-white/85 px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--action-primary)]"
              name="time"
              type="time"
            />
            {hasGoogleCalendar && (
              <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <input
                  type="checkbox"
                  name="addToGoogleCalendar"
                  value="true"
                  defaultChecked
                  className="h-4 w-4 rounded border-[var(--panel-border)] text-rose-500 focus:ring-rose-500"
                />
                <span className="flex items-center gap-1.5">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <path d="M19.5 3.75H4.5C3.67 3.75 3 4.42 3 5.25V18.75C3 19.58 3.67 20.25 4.5 20.25H19.5C20.33 20.25 21 19.58 21 18.75V5.25C21 4.42 20.33 3.75 19.5 3.75Z" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M3 9.75H21" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M8.25 6V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M15.75 6V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  Add to Google Calendar
                </span>
              </label>
            )}
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsScheduleOpen(false)}
                type="button"
              >
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" loading={isPending}>
                {isPending ? "Creating..." : "Create event"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit idea"
      >
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const title = formData.get("title")?.toString().trim() ?? "";
            if (!title) {
              return;
            }
            startTransition(async () => {
              try {
                await onEdit(formData);
                toast.success("Idea updated!");
                router.refresh();
                setIsEditOpen(false);
              } catch {
                toast.error("Failed to update idea");
              }
            });
          }}
        >
          <input type="hidden" name="ideaId" value={idea.id} />
          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">
              Title
            </label>
            <input
              className="w-full rounded-xl border border-[var(--panel-border)] bg-white/85 px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--action-primary)]"
              name="title"
              defaultValue={idea.title}
              placeholder="Idea title"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">
              Description
            </label>
            <textarea
              className="min-h-[100px] w-full rounded-xl border border-[var(--panel-border)] bg-white/85 px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--action-primary)]"
              name="description"
              defaultValue={idea.description ?? ""}
              placeholder="Notes, links, or vibe"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">
              Tags
            </label>
            <TagInput name="tags" defaultValue={idea.tags.join(", ")} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">
              Place
            </label>
            <PlaceSearch
              placeholder="Search a place"
              apiKey={mapsApiKey}
              initialValue={idea.placeName ?? undefined}
              onSelect={(selection) => setEditPlace(selection)}
            />
          </div>
          <input type="hidden" name="placeId" value={editPlace?.placeId ?? ""} />
          <input type="hidden" name="placeName" value={editPlace?.name ?? ""} />
          <input type="hidden" name="placeAddress" value={editPlace?.address ?? ""} />
          <input type="hidden" name="placeWebsite" value={editPlace?.website ?? ""} />
          <input
            type="hidden"
            name="placeOpeningHours"
            value={editPlace?.openingHours ? JSON.stringify(editPlace.openingHours) : ""}
          />
          <input
            type="hidden"
            name="placePhotoUrls"
            value={editPlace?.photoUrls ? JSON.stringify(editPlace.photoUrls) : ""}
          />
          <input type="hidden" name="placeLat" value={editPlace?.lat?.toString() ?? ""} />
          <input type="hidden" name="placeLng" value={editPlace?.lng?.toString() ?? ""} />
          <input type="hidden" name="placeUrl" value={editPlace?.url ?? ""} />
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditOpen(false)}
              type="button"
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={isPending}>
              {isPending ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={async () => {
          const formData = new FormData();
          formData.append("ideaId", idea.id);
          await onDelete(formData);
          toast.success("Idea deleted");
          router.refresh();
        }}
        title="Delete idea"
        message={`Are you sure you want to delete "${idea.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </Card>
  );
}



