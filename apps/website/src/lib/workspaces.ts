import { createWorkspaceInviteKey, normalizeEmail } from "@quack/data";

export { createWorkspaceInviteKey, normalizeEmail };

export function slugifyWorkspaceName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function parseInviteEmails(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[\n,]/)
        .map((email) => normalizeEmail(email))
        .filter(Boolean),
    ),
  );
}
