import { useCallback, useState } from "react";

import {
  createWorkspaceInviteTx,
  deleteWorkspaceInviteTx,
  deleteWorkspaceMemberTx,
  normalizeEmail,
  setWorkspaceMemberRoleTx,
  type WorkspaceRole,
} from "@quack/data";
import { Notice } from "../../../components/ui/FormFields";
import { SelectField } from "../../../components/ui/SelectField";
import { api } from "../../../lib/api";
import { instantDB } from "../../../lib/instant";
import { toErrorMessage } from "../../../lib/ui";
import { buildInviteUrl, parseInviteEmails } from "../../../lib/workspaces";
import type {
  WorkspaceInviteRecord,
  WorkspaceMemberRecord,
  WorkspaceSummary,
} from "../../../types/quack";
import { MemberAvatar } from "./SettingsAtoms";

interface MembersSettingsProps {
  currentUserId: string;
  invites: WorkspaceInviteRecord[];
  inviterName: string;
  isOwner: boolean;
  refreshToken: string;
  workspace: WorkspaceSummary;
}

export function MembersSettings(props: MembersSettingsProps) {
  const members = props.workspace.members ?? [];
  const isOwner = props.isOwner;
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const [isInviting, setIsInviting] = useState(false);
  const [inviteEmails, setInviteEmails] = useState("");
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>("member");
  const [inviteNotice, setInviteNotice] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [isInviteSubmitting, setIsInviteSubmitting] = useState(false);

  const inviteEmailsRef = useCallback((el: HTMLTextAreaElement | null) => {
    el?.focus();
  }, []);

  const memberEmailSet = new Set(
    members
      .map((m) => m.$user?.email)
      .filter((e): e is string => Boolean(e))
      .map(normalizeEmail),
  );
  const pendingEmailSet = new Set(props.invites.map((invite) => normalizeEmail(invite.email)));

  async function handleSendInvites() {
    const parsed = parseInviteEmails(inviteEmails).filter(
      (email) => !memberEmailSet.has(email) && !pendingEmailSet.has(email),
    );

    if (!parsed.length) {
      setInviteNotice("Add at least one email not already a member or pending invite.");
      return;
    }

    setInviteNotice(null);
    setInviteSuccess(null);
    setIsInviteSubmitting(true);

    try {
      const txs = parsed.map(
        (email) =>
          createWorkspaceInviteTx({
            email,
            invitedById: props.currentUserId,
            role: inviteRole,
            workspaceId: props.workspace.id,
          }).tx,
      );

      await instantDB.transact(txs);

      api
        .sendInviteEmails(
          {
            emails: parsed,
            inviterName: props.inviterName,
            inviteUrl: buildInviteUrl(props.workspace.id, props.workspace.name, props.inviterName),
            workspaceName: props.workspace.name,
          },
          props.refreshToken,
        )
        .catch(() => {});

      setInviteSuccess(`Invited ${parsed.length} ${parsed.length === 1 ? "person" : "people"}.`);
      setInviteEmails("");
    } catch (error) {
      setInviteNotice(
        toErrorMessage(
          error,
          "Could not send invites.",
          "You don't have permission to invite members to this workspace. Only owners and admins can send invites.",
        ),
      );
    } finally {
      setIsInviteSubmitting(false);
    }
  }

  async function handleRoleChange(member: WorkspaceMemberRecord, newRole: WorkspaceRole) {
    if (member.role === newRole) return;

    setPendingAction(member.id);
    setNotice(null);

    try {
      await instantDB.transact(
        setWorkspaceMemberRoleTx({
          membershipId: member.id,
          role: newRole,
          workspaceId: props.workspace.id,
        }),
      );
    } catch (error) {
      setNotice(
        toErrorMessage(
          error,
          "Could not update member role.",
          "You don't have permission to change this member's role.",
        ),
      );
    } finally {
      setPendingAction(null);
    }
  }

  async function handleRemoveMember(member: WorkspaceMemberRecord) {
    setPendingAction(member.id);
    setNotice(null);

    try {
      await instantDB.transact(deleteWorkspaceMemberTx(member.id));
    } catch (error) {
      setNotice(
        toErrorMessage(
          error,
          "Could not remove the member.",
          "You don't have permission to remove this member.",
        ),
      );
    } finally {
      setPendingAction(null);
    }
  }

  async function handleRevokeInvite(invite: WorkspaceInviteRecord) {
    setPendingAction(invite.id);
    setNotice(null);

    try {
      await instantDB.transact(deleteWorkspaceInviteTx(invite.id));
    } catch (error) {
      setNotice(
        toErrorMessage(
          error,
          "Could not revoke the invite.",
          "You don't have permission to revoke this invite.",
        ),
      );
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Members</h3>
          <p className="mt-1 text-sm text-slate-500">Manage who has access to this workspace.</p>
        </div>
        {!isInviting ? (
          <button
            className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors duration-100 hover:bg-amber-600"
            onClick={() => {
              setIsInviting(true);
              setInviteSuccess(null);
            }}
            type="button"
          >
            <svg fill="none" height="16" viewBox="0 0 16 16" width="16">
              <path
                d="M8 3v10M3 8h10"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.5"
              />
            </svg>
            Invite people
          </button>
        ) : null}
      </div>

      {isInviting ? (
        <div
          className="mt-4 rounded-xl border border-amber-200/80 bg-amber-50/40 p-4"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              void handleSendInvites();
            }
          }}
        >
          <h4 className="text-sm font-semibold text-slate-800">Invite teammates</h4>
          <div className="mt-3 space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-600" htmlFor="invite-emails">
                Email addresses
              </label>
              <textarea
                ref={inviteEmailsRef}
                className="mt-1.5 w-full rounded-xl border border-amber-200/80 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors duration-100 focus:border-amber-400"
                id="invite-emails"
                onChange={(e) => {
                  setInviteEmails(e.target.value);
                  setInviteNotice(null);
                  setInviteSuccess(null);
                }}
                placeholder={"sam@example.com, pat@example.com"}
                rows={3}
                value={inviteEmails}
              />
              <p className="mt-1 text-xs text-slate-400">
                Separate multiple emails with commas or new lines.
              </p>
            </div>
            <SelectField
              label="Role"
              onChange={setInviteRole}
              options={[
                ...(isOwner ? [{ label: "Admin", value: "admin" as const }] : []),
                { label: "Member", value: "member" as const },
                { label: "Guest", value: "guest" as const },
              ]}
              value={inviteRole}
            />
            {inviteNotice ? <Notice message={inviteNotice} tone="error" /> : null}
            {inviteSuccess ? <Notice message={inviteSuccess} tone="info" /> : null}
            <div className="flex items-center justify-end gap-2">
              <button
                className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition-colors duration-100 hover:bg-slate-100"
                onClick={() => {
                  setIsInviting(false);
                  setInviteEmails("");
                  setInviteNotice(null);
                  setInviteSuccess(null);
                }}
                type="button"
              >
                Cancel
              </button>
              <button
                className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors duration-100 hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isInviteSubmitting || !inviteEmails.trim()}
                onClick={() => {
                  void handleSendInvites();
                }}
                type="button"
              >
                {isInviteSubmitting ? "Sending..." : "Send invites"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {inviteSuccess && !isInviting ? (
        <div className="mt-4">
          <Notice message={inviteSuccess} tone="info" />
        </div>
      ) : null}

      {notice ? (
        <div className="mt-4">
          <Notice message={notice} tone="error" />
        </div>
      ) : null}

      <div className="mt-5 space-y-1">
        {members.map((member) => {
          const user = member.$user;
          const isSelf = user?.id === props.currentUserId;
          const isMemberOwner = user?.id === props.workspace.owner?.id;
          const canModify = isOwner && !isSelf && !isMemberOwner;

          return (
            <div
              className="flex flex-wrap items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-100 hover:bg-amber-50/50"
              key={member.id}
            >
              <MemberAvatar
                name={member.displayName ?? user?.email ?? "?"}
                imageUrl={user?.avatar?.url ?? user?.imageURL}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800">
                  {member.displayName ?? user?.email ?? "Unknown"}
                  {isSelf ? (
                    <span className="ml-1.5 text-xs font-normal text-slate-400">(you)</span>
                  ) : null}
                </p>
                <p className="truncate text-xs text-slate-400">{user?.email ?? "No email"}</p>
              </div>

              {isMemberOwner ? (
                <span className="shrink-0 rounded-lg bg-amber-100/70 px-2.5 py-1 text-xs font-medium text-amber-700">
                  Owner
                </span>
              ) : canModify ? (
                <div className="flex w-full shrink-0 items-center gap-2 pl-12 sm:w-auto sm:pl-0">
                  <SelectField
                    disabled={pendingAction === member.id}
                    onChange={(value) => {
                      void handleRoleChange(member, value);
                    }}
                    options={[
                      { label: "Admin", value: "admin" },
                      { label: "Member", value: "member" },
                      { label: "Guest", value: "guest" },
                    ]}
                    size="compact"
                    value={(member.role as WorkspaceRole) ?? "member"}
                  />
                  <button
                    className="rounded-lg px-2 py-1 text-xs text-rose-500 transition-colors duration-100 hover:bg-rose-50 disabled:opacity-50"
                    disabled={pendingAction === member.id}
                    onClick={() => {
                      void handleRemoveMember(member);
                    }}
                    type="button"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <span className="shrink-0 text-xs text-slate-400 capitalize">{member.role}</span>
              )}
            </div>
          );
        })}
      </div>

      {props.invites.length > 0 ? (
        <>
          <h4 className="mt-8 text-sm font-semibold text-slate-700">Pending invites</h4>
          <div className="mt-2 space-y-1">
            {props.invites.map((invite) => (
              <div
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-100 hover:bg-amber-50/50"
                key={invite.id}
              >
                <MemberAvatar name={invite.email} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-600">{invite.email}</p>
                  <p className="text-xs text-slate-400 capitalize">Invited as {invite.role}</p>
                </div>
                <button
                  className="shrink-0 rounded-lg px-2 py-1 text-xs text-rose-500 transition-colors duration-100 hover:bg-rose-50 disabled:opacity-50"
                  disabled={pendingAction === invite.id}
                  onClick={() => {
                    void handleRevokeInvite(invite);
                  }}
                  type="button"
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
