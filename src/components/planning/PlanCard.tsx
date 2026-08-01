"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  ChevronRight,
  MapPin,
  MessageSquare,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import ConfirmDialog from "@/components/ConfirmDialog";
import PlanningCover from "@/components/planning/PlanningCover";
import useResolvedPlaceCover from "@/components/planning/useResolvedPlaceCover";
import LocalTime from "@/components/time/LocalTime";
import Card from "@/components/ui/Card";
import { CalendarTimeFormat } from "@/lib/calendar";
import { CREATOR_ACCENTS, getAvatarGradient } from "@/lib/creator-colors";
import { getInitials } from "@/lib/formatters";
import type { GoogleSyncStatus } from "@/lib/google-sync";

type PlanActionResult = {
  googleSync?: GoogleSyncStatus;
};

type PlanCardProps = {
  id: string;
  title: string;
  description: string | null;
  dateTimeStart: Date;
  timeIsSet?: boolean;
  commentCount?: number;
  createdBy?: { name: string | null; email: string };
  placeName?: string | null;
  placeId?: string | null;
  coverUrl?: string | null;
  placePhotoUrl?: string | null;
  mapsApiKey?: string;
  timeFormat?: CalendarTimeFormat;
  onDelete?: (formData: FormData) => Promise<void | PlanActionResult>;
};

function getDayDiff(date: Date) {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((startOfDate.getTime() - startOfToday.getTime()) / 86_400_000);
}

export default function PlanCard({
  id,
  title,
  description,
  dateTimeStart,
  timeIsSet = true,
  commentCount = 0,
  createdBy,
  placeName,
  placeId,
  coverUrl,
  placePhotoUrl,
  mapsApiKey,
  timeFormat = "24h",
  onDelete,
}: PlanCardProps) {
  const router = useRouter();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const dayDiff = getDayDiff(dateTimeStart);
  const proximityLabel =
    dayDiff === 0 ? "Today" : dayDiff === 1 ? "Tomorrow" : null;
  const eventHref = `/events/${id}`;
  const {
    coverUrl: resolvedCoverUrl,
    isLoading: isCoverLoading,
  } = useResolvedPlaceCover({
    preferredUrl: coverUrl,
    storedPlacePhotoUrl: placePhotoUrl,
    placeId,
    mapsApiKey,
  });

  async function handleDelete() {
    if (!onDelete) return;
    const formData = new FormData();
    formData.append("eventId", id);
    const result = await onDelete(formData);
    toast.success("Event deleted");
    if (result?.googleSync?.attempted && !result.googleSync.success) {
      toast.warning(
        result.googleSync.message ??
          "Deleted in Duet, but failed to cancel Google Calendar event.",
      );
    } else if (result?.googleSync?.info) {
      toast.info(result.googleSync.info);
    }
    router.refresh();
  }

  return (
    <>
      <Card
        variant="rose"
        hover
        padding="none"
        className="group/plan card-hover animate-fade-in-up relative flex h-full w-full flex-col overflow-hidden border-rose-200/70 bg-white"
      >
        <Link
          href={eventHref}
          aria-label={`Open event: ${title}`}
          className="absolute inset-0 z-10 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-rose-400"
        />

        <PlanningCover
          src={resolvedCoverUrl}
          alt={`${title} cover`}
          className="aspect-[4/3] w-full md:aspect-auto md:h-64"
          isLoading={isCoverLoading}
        >
          <ChevronRight
            aria-hidden="true"
            className="absolute right-3 top-3 h-8 w-8 rounded-full border border-white/40 bg-black/25 p-2 text-white backdrop-blur-md md:hidden"
          />
          <div className="absolute left-3 top-3 flex items-center gap-2.5 text-white">
            <span className="flex h-14 w-14 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl border border-white/45 bg-white/20 shadow-[var(--shadow-sm)] backdrop-blur-md">
              <LocalTime
                className="text-[11px] font-bold uppercase leading-none tracking-[0.08em]"
                options={{ month: "short" }}
                value={dateTimeStart}
              />
              <LocalTime
                className="text-xl font-bold leading-none"
                options={{ day: "numeric" }}
                value={dateTimeStart}
              />
            </span>
            {proximityLabel ? (
              <span className="rounded-full border border-white/40 bg-black/25 px-2.5 py-1 text-xs font-semibold backdrop-blur-md">
                {proximityLabel}
              </span>
            ) : null}
          </div>

          {/* Title and meta sit on the scrim so the photo keeps the whole card. */}
          <div className="absolute inset-x-0 bottom-0 flex min-w-0 flex-col gap-1 p-4 text-white">
            <h4 className="break-words text-lg font-semibold leading-snug tracking-[-0.015em] line-clamp-2 [overflow-wrap:anywhere] drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)] md:text-xl">
              {title}
            </h4>
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/85">
              <span className="inline-flex shrink-0 items-center gap-1.5">
                <CalendarClock aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                {timeIsSet ? (
                  <LocalTime
                    options={{ hour: "numeric", minute: "2-digit" }}
                    timeFormat={timeFormat}
                    value={dateTimeStart}
                  />
                ) : (
                  <span>Anytime</span>
                )}
              </span>
              {placeName ? (
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  <span aria-hidden="true">·</span>
                  <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                  <span className="min-w-0 truncate">{placeName}</span>
                </span>
              ) : null}
            </div>
            {description ? (
              <p className="hidden text-xs leading-5 text-white/75 line-clamp-1 md:block">
                {description}
              </p>
            ) : null}
            <div className="flex items-center justify-between gap-2 pt-0.5">
              {createdBy ? (
                <span className="inline-flex min-w-0 items-center gap-1.5 text-[11px] text-white/80">
                  <span
                    aria-hidden="true"
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-white ring-1 ring-white/40"
                    style={{ backgroundImage: getAvatarGradient(CREATOR_ACCENTS.rose) }}
                  >
                    {getInitials(createdBy.name, createdBy.email)}
                  </span>
                  <span className="truncate font-medium">
                    {createdBy.name || createdBy.email}
                  </span>
                </span>
              ) : (
                <span />
              )}
              {commentCount > 0 ? (
                <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-white/80">
                  <MessageSquare aria-hidden="true" className="h-3.5 w-3.5" />
                  {commentCount}
                </span>
              ) : null}
            </div>
          </div>
        </PlanningCover>

        <div className="absolute right-3 top-3 z-20 hidden items-center gap-2 md:flex">
          <Link
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/50 bg-white/90 text-slate-700 shadow-sm transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:pointer-events-none md:opacity-0 md:group-hover/plan:pointer-events-auto md:group-hover/plan:opacity-100"
            href={`/events/${id}?edit=1`}
            title="Edit event"
            aria-label={`Edit event: ${title}`}
          >
            <Pencil className="h-4 w-4" />
          </Link>
          <Link
            className="relative inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-full border border-white/50 bg-white/90 px-2.5 text-xs font-semibold text-gray-600 shadow-sm transition hover:bg-white md:pointer-events-none md:opacity-0 md:group-hover/plan:pointer-events-auto md:group-hover/plan:opacity-100"
            title={`Comments (${commentCount})`}
            href={`/events/${id}#event-comments`}
          >
            <MessageSquare className="h-4 w-4" />
            {commentCount > 0 ? commentCount : null}
          </Link>
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/50 bg-white/90 text-red-600 shadow-sm transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:pointer-events-none md:opacity-0 md:group-hover/plan:pointer-events-auto md:group-hover/plan:opacity-100 disabled:opacity-50"
            title="Delete event"
            aria-label={`Delete event: ${title}`}
            type="button"
            onClick={() => setIsDeleteOpen(true)}
            disabled={!onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

      </Card>
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete event"
        message={`Are you sure you want to delete "${title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </>
  );
}
