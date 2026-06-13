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
import LocalTime from "@/components/time/LocalTime";
import Card, { CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { CalendarTimeFormat } from "@/lib/calendar";
import { CREATOR_ACCENTS, getAvatarGradient } from "@/lib/creator-colors";
import { getInitials } from "@/lib/formatters";

type GoogleSyncFeedback = {
  attempted: boolean;
  success: boolean;
  message?: string;
  info?: string;
};

type PlanActionResult = {
  googleSync?: GoogleSyncFeedback;
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
  timeFormat?: CalendarTimeFormat;
  onDelete?: (formData: FormData) => Promise<void | PlanActionResult>;
};

function getDayDiff(date: Date) {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffMs = startOfDate.getTime() - startOfToday.getTime();
  return Math.round(diffMs / (24 * 60 * 60 * 1000));
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
  timeFormat = "24h",
  onDelete,
}: PlanCardProps) {
  const router = useRouter();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const dayDiff = getDayDiff(dateTimeStart);
  const proximityLabel =
    dayDiff === 0 ? "Today" : dayDiff === 1 ? "Tomorrow" : null;
  const eventHref = `/events/${id}`;

  async function handleDelete() {
    if (!onDelete) {
      return;
    }
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
        padding="sm"
        className="group/plan card-hover animate-fade-in-up relative flex h-full w-full flex-col border-rose-200/70 bg-[linear-gradient(150deg,rgba(255,255,255,0.95),rgba(255,238,244,0.74))]"
      >
        <Link
          href={eventHref}
          aria-label={`Open event: ${title}`}
          className="absolute inset-0 z-0 rounded-xl"
        />

        {/* Mobile: compact tile with date block */}
        <div className="relative z-0 flex flex-1 gap-3 md:hidden">
          <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-[var(--shadow-sm)]">
            <LocalTime
              className="text-[10px] font-bold uppercase leading-none tracking-[0.08em]"
              options={{ month: "short" }}
              value={dateTimeStart}
            />
            <LocalTime
              className="text-xl font-bold leading-none"
              options={{ day: "numeric" }}
              value={dateTimeStart}
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 flex-1 break-words text-base font-semibold leading-snug text-[var(--text-primary)] line-clamp-2 [overflow-wrap:anywhere]">
                {title}
              </p>
              <ChevronRight
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 shrink-0 text-rose-300"
              />
            </div>
            <p className="flex min-w-0 items-center gap-1.5 text-xs text-[var(--text-muted)]">
              {proximityLabel ? (
                <span className="shrink-0 font-semibold text-rose-600">
                  {proximityLabel} ·
                </span>
              ) : null}
              {timeIsSet ? (
                <LocalTime
                  className="shrink-0"
                  options={{ hour: "numeric", minute: "2-digit" }}
                  timeFormat={timeFormat}
                  value={dateTimeStart}
                />
              ) : (
                <span className="shrink-0">Anytime</span>
              )}
              {placeName ? (
                <span className="flex min-w-0 items-center gap-1">
                  <span className="shrink-0">·</span>
                  <MapPin className="h-3 w-3 shrink-0 text-rose-400" />
                  <span className="min-w-0 truncate">{placeName}</span>
                </span>
              ) : null}
            </p>
            {description ? (
              <p className="text-xs text-[var(--text-muted)] line-clamp-1">
                {description}
              </p>
            ) : null}
            <div className="mt-auto flex items-center justify-between gap-2 pt-1.5">
              {createdBy ? (
                <span className="inline-flex min-w-0 items-center gap-1.5 text-[11px] text-[var(--text-tertiary)]">
                  <span
                    aria-hidden="true"
                    className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[8px] font-semibold text-white"
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
                <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-[var(--text-tertiary)]">
                  <MessageSquare className="h-3.5 w-3.5" />
                  {commentCount}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Desktop layout */}
        <div className="hidden md:flex md:flex-1 md:flex-col">
        <CardHeader className="relative z-10">
          <div className="min-w-0 flex-1 space-y-1">
            {proximityLabel ? (
              <span className="inline-flex rounded-full border border-rose-200/70 bg-white/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-rose-700">
                {proximityLabel}
              </span>
            ) : null}
            <CardTitle className="text-lg text-[var(--text-primary)]">
              <Link
                href={eventHref}
                className="transition hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/60"
              >
                {title}
              </Link>
            </CardTitle>
          </div>
          <div className="hidden flex-wrap items-center gap-2 md:flex md:justify-end">
            <Link
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 md:pointer-events-none md:opacity-0 md:group-hover/plan:pointer-events-auto md:group-hover/plan:opacity-100"
              href={`/events/${id}?edit=1`}
              title="Edit event"
              aria-label={`Edit event: ${title}`}
            >
              <Pencil className="h-4 w-4" />
            </Link>
            <Link
              className="relative inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 transition hover:shadow-[var(--shadow-sm)] md:pointer-events-none md:opacity-0 md:group-hover/plan:pointer-events-auto md:group-hover/plan:opacity-100"
              title={`Comments (${commentCount})`}
              href={`/events/${id}#event-comments`}
            >
              <MessageSquare className="h-4 w-4" />
              {commentCount > 0 ? (
                <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                  {commentCount}
                </span>
              ) : null}
            </Link>
            <button
              className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50/80 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 md:pointer-events-none md:opacity-0 md:group-hover/plan:pointer-events-auto md:group-hover/plan:opacity-100 disabled:opacity-50"
              title="Delete event"
              aria-label={`Delete event: ${title}`}
              type="button"
              onClick={() => setIsDeleteOpen(true)}
              disabled={!onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </CardHeader>
        {description ? (
          <CardDescription className="relative z-10 text-[var(--text-muted)]">
            {description}
          </CardDescription>
        ) : null}
        <CardFooter className="relative z-10 mt-auto flex-col items-start gap-2 pt-3">
          <div className="flex w-full flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
            <div className="inline-flex min-w-0 items-center gap-2 text-xs text-[var(--text-tertiary)]">
              <CalendarClock className="h-4 w-4 shrink-0 text-rose-500" />
              <LocalTime
                options={
                  timeIsSet
                    ? {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      }
                    : {
                        month: "short",
                        day: "numeric",
                      }
                }
                timeFormat={timeFormat}
                value={dateTimeStart}
              />
              {!timeIsSet ? (
                <span className="rounded-full border border-rose-200 bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
                  Anytime
                </span>
              ) : null}
            </div>
            {createdBy ? (
              <span className="inline-flex min-w-0 items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
                <span
                  aria-hidden="true"
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-white"
                  style={{ backgroundImage: getAvatarGradient(CREATOR_ACCENTS.rose) }}
                >
                  {getInitials(createdBy.name, createdBy.email)}
                </span>
                <span className="truncate font-semibold text-[var(--text-primary)]">
                  {createdBy.name || createdBy.email}
                </span>
              </span>
            ) : null}
          </div>
          {placeName ? (
            <div className="inline-flex max-w-full min-w-0 items-center gap-2 rounded-xl border border-rose-200/70 bg-white/75 px-3 py-1 text-xs text-[var(--text-tertiary)]">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-rose-500" />
              <span className="min-w-0 truncate text-[var(--text-muted)]">{placeName}</span>
            </div>
          ) : null}
        </CardFooter>
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
