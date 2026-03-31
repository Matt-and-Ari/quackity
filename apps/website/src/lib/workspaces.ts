import {
  createWorkspaceInviteKey,
  createWorkspaceMemberTx,
  deleteWorkspaceInviteByKeyTx,
  normalizeEmail,
  type WorkspaceRole,
} from "@quack/data";

import { instantDB } from "./instant";
import type { AuthenticatedUser, WorkspaceInviteRecord } from "../types/quack";

export { createWorkspaceInviteKey, normalizeEmail };

export function buildInviteUrl(workspaceId: string, workspaceName: string, inviterName: string) {
  const params = new URLSearchParams({
    workspace: workspaceName,
    inviter: inviterName,
  });
  return `${window.location.origin}/join/${workspaceId}?${params.toString()}`;
}

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

export function coerceWorkspaceRole(value: string): WorkspaceRole {
  if (value === "admin" || value === "guest") {
    return value;
  }

  return "member";
}

export async function acceptWorkspaceInvite(
  invite: WorkspaceInviteRecord,
  user: AuthenticatedUser,
): Promise<string> {
  if (!user.email || !invite.workspace) {
    throw new Error("This account needs an email before it can accept workspace invites.");
  }

  const role = coerceWorkspaceRole(invite.role);
  const membership = createWorkspaceMemberTx({
    acceptedInviteKey: createWorkspaceInviteKey(invite.workspace.id, invite.email, role),
    displayName: user.email.split("@")[0],
    role,
    userId: user.id,
    workspaceId: invite.workspace.id,
  });

  try {
    await instantDB.transact(membership.tx);
  } catch (error) {
    const isDuplicate = error instanceof Error && error.message.includes("record-not-unique");
    if (!isDuplicate) throw error;
  }

  await instantDB.transact(
    deleteWorkspaceInviteByKeyTx({
      email: invite.email,
      role,
      workspaceId: invite.workspace.id,
    }),
  );

  return `/workspaces/${invite.workspace.slug}`;
}
