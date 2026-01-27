export function serializeTags(tags: string[] | null | undefined) {
  if (!tags || tags.length === 0) {
    return "[]";
  }
  return JSON.stringify(tags);
}

export function parseTags(tags: string | null | undefined) {
  if (!tags) {
    return [];
  }
  try {
    const parsed = JSON.parse(tags);
    if (Array.isArray(parsed)) {
      return parsed.filter((tag) => typeof tag === "string");
    }
  } catch {
    // fall through
  }
  return [];
}

export function normalizeTags(input: unknown) {
  if (!input) {
    return [];
  }
  if (Array.isArray(input)) {
    return input
      .map((value) => String(value).trim())
      .filter((value) => value.length > 0);
  }
  if (typeof input === "string") {
    return input
      .split(",")
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
  }
  return [];
}
