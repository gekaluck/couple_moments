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
