/**
 * Shared formatting utilities for consistent display across the app.
 */

/**
 * Get initials from a user's name or email.
 * Returns up to 2 uppercase letters.
 */
export function getInitials(name: string | null | undefined, email: string): string {
  const source = (name || email).trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "U";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

/**
 * Format a date/string as a human-readable timestamp.
 * Example: "Jan 15, 3:30 PM"
 */
export function formatTimestamp(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Format a date/string as relative time ago.
 * Examples: "5m ago", "3h ago", "2d ago", "Jan 15"
 */
export function formatTimeAgo(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) {
    return "just now";
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/**
 * Format event date/time for planning and list surfaces.
 */
export function formatEventDateTime(date: Date, timeIsSet = true): string {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    ...(timeIsSet ? { hour: "numeric", minute: "2-digit" } : {}),
  });
}
