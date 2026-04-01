export const QUICK_REACTION_EMOJI = ["🦆", "👏", "✨"] as const;

export function asArray<T>(value: T[] | null | undefined) {
  return Array.isArray(value) ? value : [];
}

function isPermissionError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const hint = (error as { hint?: unknown }).hint;
  if (hint && typeof hint === "object" && "expected" in hint) return true;

  const msg = error.message.toLowerCase();
  return msg.includes("permission") || msg.includes("not allowed") || msg.includes("unauthorized");
}

export function toErrorMessage(error: unknown, fallback: string, permissionFallback?: string) {
  if (isPermissionError(error)) {
    return permissionFallback ?? "You don't have permission to perform this action.";
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function nameFromEmail(email?: string | null) {
  if (!email) {
    return "Teammate";
  }

  const [local] = email.split("@");

  return local
    .split(/[.\-_]/g)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment.charAt(0).toUpperCase())
    .join("");
}

export function formatBytes(bytes: number) {
  if (bytes < 1000) {
    return `${bytes} B`;
  }

  if (bytes < 1_000_000) {
    return `${(bytes / 1000).toFixed(1)} KB`;
  }

  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

export function slugifyChannelName(value: string) {
  const nextSlug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return nextSlug || "channel";
}
