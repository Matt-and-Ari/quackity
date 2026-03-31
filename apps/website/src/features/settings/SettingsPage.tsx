import {
  createWorkspaceInviteTx,
  deleteWorkspaceInviteTx,
  deleteWorkspaceMemberTx,
  normalizeEmail,
  setWorkspaceMemberRoleTx,
  updateWorkspaceMemberTx,
  updateWorkspaceTx,
  createWorkspaceFilePath,
  type WorkspaceRole,
} from "@quack/data";
import { id as instantId, tx } from "@instantdb/react";
import clsx from "clsx";
import { useRef, useState } from "react";

import { InputField, Notice } from "../../components/ui/FormFields";
import { api } from "../../lib/api";
import { instantDB } from "../../lib/instant";
import { toErrorMessage } from "../../lib/ui";
import { buildInviteUrl, coerceWorkspaceRole, parseInviteEmails } from "../../lib/workspaces";
import type {
  AuthenticatedUser,
  WorkspaceInviteRecord,
  WorkspaceMemberRecord,
  WorkspaceSummary,
} from "../../types/quack";

type SettingsTab = "profile" | "workspace" | "members";

interface SettingsPageProps {
  currentUserMember: WorkspaceMemberRecord | undefined;
  invites: WorkspaceInviteRecord[];
  onClose: () => void;
  user: AuthenticatedUser;
  workspace: WorkspaceSummary;
}

export function SettingsPage(props: SettingsPageProps) {
  const isAdmin =
    props.currentUserMember?.role === "admin" || props.workspace.owner?.id === props.user.id;

  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  const tabs: { id: SettingsTab; label: string; adminOnly?: boolean }[] = [
    { id: "profile", label: "Profile" },
    { id: "workspace", label: "Workspace", adminOnly: true },
    { id: "members", label: "Members", adminOnly: true },
  ];

  const visibleTabs = tabs.filter((tab) => !tab.adminOnly || isAdmin);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="flex shrink-0 items-center justify-between border-b border-amber-100/70 px-5 py-4">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">Settings</h2>
        <button
          className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition-colors duration-100 hover:bg-slate-100 hover:text-slate-600"
          onClick={props.onClose}
          type="button"
        >
          <svg fill="none" height="18" viewBox="0 0 18 18" width="18">
            <path
              d="M4.5 4.5l9 9M13.5 4.5l-9 9"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="1.5"
            />
          </svg>
        </button>
      </header>

      <div className="flex min-h-0 flex-1">
        <nav className="flex w-48 shrink-0 flex-col gap-0.5 border-r border-amber-100/70 px-3 py-4">
          {visibleTabs.map((tab) => (
            <button
              className={clsx(
                "rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors duration-100",
                activeTab === tab.id
                  ? "bg-amber-100/60 text-amber-900"
                  : "text-slate-600 hover:bg-amber-50/60 hover:text-slate-800",
              )}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
          {activeTab === "profile" ? (
            <ProfileSettings
              currentUserMember={props.currentUserMember}
              user={props.user}
              workspaceId={props.workspace.id}
            />
          ) : null}
          {activeTab === "workspace" && isAdmin ? (
            <WorkspaceSettings workspace={props.workspace} />
          ) : null}
          {activeTab === "members" && isAdmin ? (
            <MembersSettings
              currentUserId={props.user.id}
              invites={props.invites}
              inviterName={props.currentUserMember?.displayName ?? props.user.email ?? "Someone"}
              isOwner={props.workspace.owner?.id === props.user.id}
              refreshToken={props.user.refresh_token}
              workspace={props.workspace}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ── Profile settings ── */

interface ProfileSettingsProps {
  currentUserMember: WorkspaceMemberRecord | undefined;
  user: AuthenticatedUser;
  workspaceId: string;
}

function ProfileSettings(props: ProfileSettingsProps) {
  const [displayName, setDisplayName] = useState(props.currentUserMember?.displayName ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const avatarQuery = instantDB.useQuery({
    $users: { $: { where: { id: props.user.id } }, avatar: {} },
  });
  const avatarUrl = avatarQuery.data?.$users[0]?.avatar?.url ?? props.user.imageURL ?? null;

  if (import.meta.env.DEV) {
    const u = avatarQuery.data?.$users[0];
    console.log("[ProfileSettings] avatar debug:", {
      userId: props.user.id,
      "props.user.imageURL": props.user.imageURL,
      "avatarQuery user keys": u ? Object.keys(u) : [],
      "avatar link": u?.avatar,
      avatarUrl,
    });
  }

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayedImage = imagePreview ?? avatarUrl;

  function handleImageSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setNotice("Image must be under 5 MB.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setNotice("Please select an image file.");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setNotice(null);
  }

  async function handleSave() {
    setIsSubmitting(true);
    setNotice(null);
    setSuccessMsg(null);

    try {
      const txs: Parameters<typeof instantDB.transact>[0] = [];

      if (
        props.currentUserMember &&
        displayName.trim() !== (props.currentUserMember.displayName ?? "")
      ) {
        txs.push(
          updateWorkspaceMemberTx(props.currentUserMember.id, {
            displayName: displayName.trim(),
          }),
        );
      }

      if (imageFile) {
        const fileId = instantId();
        const path = createWorkspaceFilePath(props.workspaceId, fileId, imageFile.name);
        const { data: uploadData } = await instantDB.storage.uploadFile(path, imageFile, {
          contentType: imageFile.type,
        });
        txs.push(tx.$users[props.user.id].link({ avatar: uploadData.id }));
        setImageFile(null);
      }

      if (txs.length > 0) {
        await instantDB.transact(txs);
      }

      setSuccessMsg("Profile updated.");
    } catch (error) {
      setNotice(toErrorMessage(error, "Could not update your profile."));
    } finally {
      setIsSubmitting(false);
    }
  }

  const initial = (displayName || props.user.email || "U").charAt(0).toUpperCase();

  return (
    <div className="max-w-2xl">
      <h3 className="text-base font-semibold text-slate-900">Your profile</h3>
      <p className="mt-1 text-sm text-slate-500">
        This is how you appear to others in this workspace.
      </p>

      <div className="mt-6 grid grid-cols-[auto_1fr] items-start gap-x-8 gap-y-5">
        <div className="flex flex-col items-center gap-2">
          <button
            className="group relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-100 to-amber-200/80 shadow-sm transition-opacity duration-100 hover:opacity-90"
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            {displayedImage ? (
              <img alt="Profile" className="size-full object-cover" src={displayedImage} />
            ) : (
              <span className="text-xl font-bold text-amber-600">{initial}</span>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/0 transition-colors duration-100 group-hover:bg-slate-900/30">
              <CameraGlyph className="text-white opacity-0 transition-opacity duration-100 group-hover:opacity-100" />
            </div>
          </button>
          <p className="text-xs text-slate-400">Max 5 MB</p>
          <input
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
            ref={fileInputRef}
            type="file"
          />
        </div>

        <div className="space-y-4">
          <InputField
            label="Display name"
            onChange={setDisplayName}
            placeholder="Your name"
            value={displayName}
          />
          <div>
            <span className="text-sm font-medium text-slate-600">Email</span>
            <p className="mt-1.5 text-sm text-slate-500">{props.user.email ?? "No email"}</p>
          </div>
        </div>
      </div>

      {notice ? (
        <div className="mt-4">
          <Notice message={notice} tone="error" />
        </div>
      ) : null}
      {successMsg ? (
        <div className="mt-4">
          <Notice message={successMsg} tone="info" />
        </div>
      ) : null}

      <div className="mt-6">
        <button
          className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-medium text-white transition-colors duration-100 hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          onClick={() => {
            void handleSave();
          }}
          type="button"
        >
          {isSubmitting ? "Saving..." : "Save changes"}
        </button>
      </div>
    </div>
  );
}

/* ── Workspace settings (admin only) ── */

interface WorkspaceSettingsProps {
  workspace: WorkspaceSummary;
}

function WorkspaceSettings(props: WorkspaceSettingsProps) {
  const [name, setName] = useState(props.workspace.name);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const currentImageUrl = props.workspace.imageUrl ?? null;
  const [imagePreview, setImagePreview] = useState<string | null>(currentImageUrl);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleImageSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setNotice("Image must be under 5 MB.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setNotice("Please select an image file.");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setNotice(null);
  }

  async function handleSave() {
    setIsSubmitting(true);
    setNotice(null);
    setSuccessMsg(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setNotice("Workspace name is required.");
      setIsSubmitting(false);
      return;
    }

    try {
      const patch: { imageUrl?: string; name?: string } = {};

      if (trimmedName !== props.workspace.name) {
        patch.name = trimmedName;
      }

      if (imageFile) {
        const fileId = instantId();
        const path = createWorkspaceFilePath(props.workspace.id, fileId, imageFile.name);
        await instantDB.storage.uploadFile(path, imageFile, {
          contentType: imageFile.type,
        });
        const result = await instantDB.queryOnce({ $files: { $: { where: { path } } } });
        const fileUrl = result.data.$files[0]?.url;
        if (fileUrl) {
          patch.imageUrl = fileUrl;
        }
        setImageFile(null);
      }

      if (Object.keys(patch).length > 0) {
        await instantDB.transact(updateWorkspaceTx(props.workspace.id, patch));
      }

      setSuccessMsg("Workspace updated.");
    } catch (error) {
      setNotice(toErrorMessage(error, "Could not update workspace settings."));
    } finally {
      setIsSubmitting(false);
    }
  }

  const initial = (name || "W").trim().charAt(0).toUpperCase();

  return (
    <div className="max-w-2xl">
      <h3 className="text-base font-semibold text-slate-900">Workspace</h3>
      <p className="mt-1 text-sm text-slate-500">General settings for this workspace.</p>

      <div className="mt-6 grid grid-cols-[auto_1fr] items-start gap-x-8 gap-y-5">
        <div className="flex flex-col items-center gap-2">
          <button
            className="group relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-400 to-amber-500 shadow-sm transition-opacity duration-100 hover:opacity-90"
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            {imagePreview ? (
              <img alt="Workspace" className="size-full object-cover" src={imagePreview} />
            ) : (
              <span className="text-xl font-bold text-white">{initial}</span>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/0 transition-colors duration-100 group-hover:bg-slate-900/30">
              <CameraGlyph className="text-white opacity-0 transition-opacity duration-100 group-hover:opacity-100" />
            </div>
          </button>
          <p className="text-xs text-slate-400">Max 5 MB</p>
          <input
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
            ref={fileInputRef}
            type="file"
          />
        </div>

        <div className="space-y-4">
          <InputField
            label="Workspace name"
            onChange={setName}
            placeholder="My workspace"
            value={name}
          />
        </div>
      </div>

      {notice ? (
        <div className="mt-4">
          <Notice message={notice} tone="error" />
        </div>
      ) : null}
      {successMsg ? (
        <div className="mt-4">
          <Notice message={successMsg} tone="info" />
        </div>
      ) : null}

      <div className="mt-6">
        <button
          className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-medium text-white transition-colors duration-100 hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          onClick={() => {
            void handleSave();
          }}
          type="button"
        >
          {isSubmitting ? "Saving..." : "Save changes"}
        </button>
      </div>
    </div>
  );
}

/* ── Members settings (admin only) ── */

interface MembersSettingsProps {
  currentUserId: string;
  invites: WorkspaceInviteRecord[];
  inviterName: string;
  isOwner: boolean;
  refreshToken: string;
  workspace: WorkspaceSummary;
}

function MembersSettings(props: MembersSettingsProps) {
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
        .catch((err: unknown) => {
          console.error("[MembersSettings] sendInviteEmails failed", err);
        });

      setInviteSuccess(`Invited ${parsed.length} ${parsed.length === 1 ? "person" : "people"}.`);
      setInviteEmails("");
    } catch (error) {
      setInviteNotice(toErrorMessage(error, "Could not send invites."));
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
      setNotice(toErrorMessage(error, "Could not update member role."));
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
      setNotice(toErrorMessage(error, "Could not remove the member."));
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
      setNotice(toErrorMessage(error, "Could not revoke the invite."));
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
        <div className="mt-4 rounded-xl border border-amber-200/80 bg-amber-50/40 p-4">
          <h4 className="text-sm font-semibold text-slate-800">Invite teammates</h4>
          <div className="mt-3 space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-600" htmlFor="invite-emails">
                Email addresses
              </label>
              <textarea
                autoFocus
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
            <div>
              <label className="block text-sm font-medium text-slate-600" htmlFor="invite-role">
                Role
              </label>
              <select
                className="mt-1.5 w-full rounded-xl border border-amber-200/80 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors duration-100 focus:border-amber-400"
                id="invite-role"
                onChange={(e) => setInviteRole(coerceWorkspaceRole(e.target.value))}
                value={inviteRole}
              >
                {isOwner ? <option value="admin">Admin</option> : null}
                <option value="member">Member</option>
                <option value="guest">Guest</option>
              </select>
            </div>
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
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-100 hover:bg-amber-50/50"
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
                <div className="flex shrink-0 items-center gap-2">
                  <select
                    className="rounded-lg border border-amber-200/60 bg-white px-2 py-1 text-xs text-slate-700 outline-none transition-colors duration-100 focus:border-amber-400"
                    disabled={pendingAction === member.id}
                    onChange={(event) => {
                      void handleRoleChange(member, event.target.value as WorkspaceRole);
                    }}
                    value={member.role}
                  >
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                    <option value="guest">Guest</option>
                  </select>
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

/* ── Shared components ── */

function MemberAvatar(props: { imageUrl?: string | null; name: string }) {
  const initial = props.name.trim().charAt(0).toUpperCase() || "?";

  if (props.imageUrl) {
    return (
      <img
        alt={props.name}
        className="size-9 shrink-0 rounded-xl object-cover"
        src={props.imageUrl}
      />
    );
  }

  return (
    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-amber-200/80 text-xs font-bold text-amber-600">
      {initial}
    </div>
  );
}

function CameraGlyph(props: { className?: string }) {
  return (
    <svg className={props.className} fill="none" height="18" viewBox="0 0 18 18" width="18">
      <path
        d="M3 5.5a1 1 0 0 1 1-1h1.5l1-1.5h5l1 1.5H14a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-7Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.3"
      />
      <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
