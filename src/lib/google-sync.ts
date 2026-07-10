/**
 * UI-facing summary of a Google Calendar sync attempt, attached to
 * event/idea server-action results and surfaced as toasts.
 * (Distinct from the internal GoogleSyncResult in lib/integrations/google/events.ts.)
 */
export type GoogleSyncStatus = {
  attempted: boolean;
  success: boolean;
  message?: string;
  info?: string;
};
