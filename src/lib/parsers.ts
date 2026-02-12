/**
 * Parse a JSON-encoded array and return a normalized string array.
 */
export function parseJsonStringArray(value?: string | null): string[] | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return null;
    }
    return parsed.map((item) => `${item}`);
  } catch {
    return null;
  }
}

export function parseStringArrayInput(
  value?: string | string[] | null,
): string[] | null {
  if (Array.isArray(value)) {
    return value.map((item) => `${item}`);
  }

  return parseJsonStringArray(value);
}

const ALLOWED_URL_PROTOCOLS = new Set(["http:", "https:"]);

/**
 * Normalize and validate user-provided links used in href attributes.
 * Returns null for empty, invalid, or non-http(s) URLs.
 */
export function sanitizeHttpUrl(value?: string | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    if (!ALLOWED_URL_PROTOCOLS.has(parsed.protocol)) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}
