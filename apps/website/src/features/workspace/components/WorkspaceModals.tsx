import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation } from "wouter";

import {
  createChannelTx,
  createWorkspaceFilePath,
  createWorkspaceInviteTx,
  createWorkspaceTx,
  type ChannelVisibility,
  type WorkspaceRole,
} from "@quack/data";
import clsx from "clsx";

import { InputField, Notice, TextareaField } from "../../../components/ui/FormFields";
import { SettingsPage } from "../../settings/SettingsPage";
import { instantDB } from "../../../lib/instant";
import {
  coerceWorkspaceRole,
  normalizeEmail,
  parseInviteEmails,
  slugifyWorkspaceName,
} from "../../../lib/workspaces";
import { toErrorMessage } from "../../../lib/ui";
import type {
  AuthenticatedUser,
  ChannelRecord,
  WorkspaceInviteRecord,
  WorkspaceMemberRecord,
  WorkspaceSummary,
} from "../../../types/quack";

interface CreateChannelModalProps {
  onClose: () => void;
  onCreateChannel: (input: {
    name: string;
    topic?: string;
    visibility: ChannelVisibility;
  }) => Promise<void>;
}

interface EditChannelModalProps {
  channel: ChannelRecord | null;
  onClose: () => void;
  onSave: (input: { name: string; topic?: string; visibility: ChannelVisibility }) => Promise<void>;
}

interface InviteModalProps {
  isOwner: boolean;
  memberEmails: Set<string>;
  onClose: () => void;
  pendingEmails: Set<string>;
  userId: string;
  workspaceId: string;
}

interface CreateWorkspaceModalProps {
  onClose: () => void;
  user: AuthenticatedUser;
}

interface ActionModalProps {
  children: ReactNode;
  onClose: () => void;
  title: string;
}

interface DeleteConfirmModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

interface SettingsModalProps {
  currentUserMember?: WorkspaceMemberRecord;
  invites: WorkspaceInviteRecord[];
  onClose: () => void;
  user: AuthenticatedUser;
  workspace: WorkspaceSummary;
}

export function CreateChannelModal(props: CreateChannelModalProps) {
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [visibility, setVisibility] = useState<ChannelVisibility>("public");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await props.onCreateChannel({ name, topic, visibility });
      props.onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ActionModal onClose={props.onClose} title="New channel">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <InputField label="Name" onChange={setName} placeholder="design-crit" value={name} />
        <InputField
          label="Description"
          onChange={setTopic}
          placeholder="Optional description"
          value={topic}
        />
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-600">Visibility</span>
          <select
            className="w-full rounded-xl border border-amber-200/80 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-amber-400"
            onChange={(event) => setVisibility(event.target.value as ChannelVisibility)}
            value={visibility}
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </label>
        <div className="flex gap-2 pt-1">
          <button
            className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-medium text-white transition-colors duration-100 hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting || !name.trim()}
            type="submit"
          >
            {isSubmitting ? "Creating..." : "Create"}
          </button>
          <button
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors duration-100 hover:bg-slate-100"
            onClick={props.onClose}
            type="button"
          >
            Cancel
          </button>
        </div>
      </form>
    </ActionModal>
  );
}

export function EditChannelModal(props: EditChannelModalProps) {
  const [name, setName] = useState(props.channel?.name ?? "");
  const [topic, setTopic] = useState(props.channel?.topic ?? "");
  const [visibility, setVisibility] = useState<ChannelVisibility>(
    (props.channel?.visibility as ChannelVisibility) ?? "public",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!props.channel) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await props.onSave({ name, topic, visibility });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ActionModal onClose={props.onClose} title="Edit channel">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <InputField label="Name" onChange={setName} placeholder="general" value={name} />
        <InputField
          label="Description"
          onChange={setTopic}
          placeholder="What's this channel about?"
          value={topic}
        />
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-600">Visibility</span>
          <select
            className="w-full rounded-xl border border-amber-200/80 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors duration-100 focus:border-amber-400"
            onChange={(event) => setVisibility(event.target.value as ChannelVisibility)}
            value={visibility}
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </label>
        <div className="flex gap-2 pt-1">
          <button
            className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-medium text-white transition-colors duration-100 hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting || !name.trim()}
            type="submit"
          >
            {isSubmitting ? "Saving..." : "Save"}
          </button>
          <button
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors duration-100 hover:bg-slate-100"
            onClick={props.onClose}
            type="button"
          >
            Cancel
          </button>
        </div>
      </form>
    </ActionModal>
  );
}

export function InviteModal(props: InviteModalProps) {
  const [emails, setEmails] = useState("");
  const [role, setRole] = useState<WorkspaceRole>("member");
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedEmails = parseInviteEmails(emails).filter(
      (email) => !props.memberEmails.has(email) && !props.pendingEmails.has(email),
    );

    if (!parsedEmails.length) {
      setNotice("Add at least one new email not already a member or pending invite.");
      return;
    }

    setNotice(null);
    setIsSubmitting(true);

    try {
      const txs = parsedEmails.map(
        (email) =>
          createWorkspaceInviteTx({
            email,
            invitedById: props.userId,
            role,
            workspaceId: props.workspaceId,
          }).tx,
      );

      await instantDB.transact(txs);
      props.onClose();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not send invites.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ActionModal onClose={props.onClose} title="Invite teammates">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <TextareaField
          label="Emails"
          onChange={setEmails}
          placeholder={"sam@quackity.chat\npat@quackity.chat"}
          value={emails}
        />
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-600">Role</span>
          <select
            className="w-full rounded-xl border border-amber-200/80 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-amber-400"
            onChange={(event) => setRole(coerceWorkspaceRole(event.target.value))}
            value={role}
          >
            {props.isOwner ? <option value="admin">Admin</option> : null}
            <option value="member">Member</option>
            <option value="guest">Guest</option>
          </select>
        </label>
        {notice ? <Notice message={notice} tone="error" /> : null}
        <div className="flex gap-2 pt-1">
          <button
            className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-medium text-white transition-colors duration-100 hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting || !emails.trim()}
            type="submit"
          >
            {isSubmitting ? "Sending..." : "Send invites"}
          </button>
          <button
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors duration-100 hover:bg-slate-100"
            onClick={props.onClose}
            type="button"
          >
            Cancel
          </button>
        </div>
      </form>
    </ActionModal>
  );
}

export function DeleteConfirmModal(props: DeleteConfirmModalProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        props.onClose();
      } else if (event.key === "Enter") {
        event.preventDefault();
        props.onConfirm();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [props]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 px-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          props.onClose();
        }
      }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-amber-200/80 bg-white p-5 shadow-[0_30px_80px_rgba(15,23,42,0.14)]">
        <h3 className="text-base font-semibold text-slate-900">Delete message?</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          This action cannot be undone. The message content will be permanently removed.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition-colors duration-100 hover:bg-slate-100"
            onClick={props.onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            autoFocus
            className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-medium text-white transition-colors duration-100 hover:bg-rose-600"
            onClick={props.onConfirm}
            type="button"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

type CreateWorkspaceStep = "details" | "image" | "invite";

export function CreateWorkspaceModal(props: CreateWorkspaceModalProps) {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<CreateWorkspaceStep>("details");
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceSlug, setWorkspaceSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [inviteEmails, setInviteEmails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
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

  function handleNext() {
    setNotice(null);

    if (step === "details") {
      const slug = slugifyWorkspaceName(workspaceSlug || workspaceName);
      if (!workspaceName.trim() || !slug) {
        setNotice("Workspace name is required.");
        return;
      }
      if (!slugEdited) {
        setWorkspaceSlug(slug);
      }
      setStep("image");
      return;
    }

    if (step === "image") {
      setStep("invite");
      return;
    }
  }

  function handleBack() {
    setNotice(null);
    if (step === "image") {
      setStep("details");
    } else if (step === "invite") {
      setStep("image");
    }
  }

  async function handleCreate() {
    const slug = slugifyWorkspaceName(workspaceSlug || workspaceName);
    if (!workspaceName.trim() || !slug) {
      setNotice("Workspace name and slug are required.");
      return;
    }

    setIsSubmitting(true);
    setNotice(null);

    try {
      const workspace = createWorkspaceTx({
        displayName: displayName.trim() || undefined,
        name: workspaceName.trim(),
        ownerId: props.user.id,
        slug,
      });

      let imageUrl: string | undefined;
      if (imageFile) {
        const fileId = crypto.randomUUID();
        const path = createWorkspaceFilePath(workspace.workspaceId, fileId, imageFile.name);
        await instantDB.storage.uploadFile(path, imageFile, {
          contentType: imageFile.type,
        });
        const result = await instantDB.queryOnce({ $files: { $: { where: { path } } } });
        imageUrl = result.data.$files[0]?.url;
      }

      const workspaceTx = imageUrl
        ? createWorkspaceTx({
            displayName: displayName.trim() || undefined,
            imageUrl,
            name: workspaceName.trim(),
            ownerId: props.user.id,
            slug,
            workspaceId: workspace.workspaceId,
            ownerMembershipId: workspace.ownerMembershipId,
          })
        : workspace;

      const generalChannel = createChannelTx({
        creatorId: props.user.id,
        name: "General",
        slug: "general",
        visibility: "public",
        workspaceId: workspaceTx.workspaceId,
      });

      const emails = parseInviteEmails(inviteEmails).filter(
        (email) => email !== normalizeEmail(props.user.email ?? ""),
      );
      const inviteTransactions = emails.map(
        (email) =>
          createWorkspaceInviteTx({
            email,
            invitedById: props.user.id,
            role: "member",
            workspaceId: workspaceTx.workspaceId,
          }).tx,
      );

      await instantDB.transact([...workspaceTx.tx, ...generalChannel.tx, ...inviteTransactions]);

      navigate(`/workspaces/${workspaceTx.workspaceId}/channels/general`);
      props.onClose();
    } catch (error) {
      setNotice(toErrorMessage(error, "Could not create the workspace."));
    } finally {
      setIsSubmitting(false);
    }
  }

  const stepIndex = step === "details" ? 0 : step === "image" ? 1 : 2;
  const initial = (workspaceName || "W").trim().charAt(0).toUpperCase();

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-slate-950/20 px-0 backdrop-blur-sm sm:items-center sm:px-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          props.onClose();
        }
      }}
    >
      <div className="w-full max-w-md rounded-t-2xl border border-amber-200/80 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.14)] sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-amber-100/70 px-5 pt-5 pb-4">
          <h3 className="text-base font-semibold text-slate-900">Create a workspace</h3>
          <button
            className="flex size-7 items-center justify-center rounded-lg text-slate-400 transition-colors duration-100 hover:bg-slate-100 hover:text-slate-600"
            onClick={props.onClose}
            type="button"
          >
            <svg fill="none" height="16" viewBox="0 0 16 16" width="16">
              <path
                d="M4 4l8 8M12 4l-8 8"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.5"
              />
            </svg>
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex gap-1.5 px-5 pt-4">
          {["Details", "Image", "Invite"].map((label, i) => (
            <div className="flex-1" key={label}>
              <div
                className={clsx(
                  "h-1 rounded-full transition-colors duration-200",
                  i <= stepIndex ? "bg-amber-400" : "bg-amber-100",
                )}
              />
              <p
                className={clsx(
                  "mt-1.5 text-[0.65rem] font-medium transition-colors duration-200",
                  i === stepIndex ? "text-amber-700" : "text-slate-400",
                )}
              >
                {label}
              </p>
            </div>
          ))}
        </div>

        <div className="px-5 pb-5 pt-4">
          {step === "details" ? (
            <div className="space-y-4">
              <InputField
                label="Workspace name"
                onChange={(value) => {
                  setWorkspaceName(value);
                  if (!slugEdited) {
                    setWorkspaceSlug(slugifyWorkspaceName(value));
                  }
                }}
                placeholder="Quackity HQ"
                value={workspaceName}
              />
              <InputField
                label="Workspace slug"
                onChange={(value) => {
                  setSlugEdited(true);
                  setWorkspaceSlug(value);
                }}
                placeholder="quackity-hq"
                value={workspaceSlug}
              />
              <InputField
                label="Your display name"
                onChange={setDisplayName}
                placeholder="Ari"
                value={displayName}
              />
            </div>
          ) : null}

          {step === "image" ? (
            <div className="flex flex-col items-center gap-4 py-2">
              <p className="text-sm text-slate-500">
                Give your workspace a profile picture. You can always change this later.
              </p>
              <button
                className="group relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-400 to-amber-500 shadow-sm transition-opacity duration-100 hover:opacity-90"
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                {imagePreview ? (
                  <img alt="Workspace" className="size-full object-cover" src={imagePreview} />
                ) : (
                  <span className="text-2xl font-bold text-white">{initial}</span>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/0 transition-colors duration-100 group-hover:bg-slate-900/30">
                  <svg
                    className="text-white opacity-0 transition-opacity duration-100 group-hover:opacity-100"
                    fill="none"
                    height="20"
                    viewBox="0 0 18 18"
                    width="20"
                  >
                    <path
                      d="M3 5.5a1 1 0 0 1 1-1h1.5l1-1.5h5l1 1.5H14a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-7Z"
                      stroke="currentColor"
                      strokeLinejoin="round"
                      strokeWidth="1.3"
                    />
                    <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.3" />
                  </svg>
                </div>
              </button>
              <p className="text-xs text-slate-400">Click to upload (max 5 MB)</p>
              <input
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
                ref={fileInputRef}
                type="file"
              />
            </div>
          ) : null}

          {step === "invite" ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">
                Invite teammates by email. You can also do this later from workspace settings.
              </p>
              <TextareaField
                label="Emails"
                onChange={setInviteEmails}
                placeholder={"sam@quackity.chat\npat@quackity.chat"}
                value={inviteEmails}
              />
            </div>
          ) : null}

          {notice ? (
            <div className="mt-4">
              <Notice message={notice} tone="error" />
            </div>
          ) : null}

          <div className="mt-5 flex items-center justify-between">
            {step !== "details" ? (
              <button
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors duration-100 hover:bg-slate-100"
                onClick={handleBack}
                type="button"
              >
                Back
              </button>
            ) : (
              <div />
            )}

            <div className="flex gap-2">
              {step === "image" ? (
                <button
                  className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-500 transition-colors duration-100 hover:bg-slate-50 hover:text-slate-700"
                  onClick={() => setStep("invite")}
                  type="button"
                >
                  Skip
                </button>
              ) : null}
              {step === "invite" ? (
                <button
                  className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-medium text-white transition-colors duration-100 hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSubmitting}
                  onClick={() => {
                    void handleCreate();
                  }}
                  type="button"
                >
                  {isSubmitting ? "Creating..." : "Create workspace"}
                </button>
              ) : (
                <button
                  className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-medium text-white transition-colors duration-100 hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!workspaceName.trim()}
                  onClick={handleNext}
                  type="button"
                >
                  Continue
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SettingsModal(props: SettingsModalProps) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-slate-950/20 backdrop-blur-sm sm:items-center sm:px-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          props.onClose();
        }
      }}
    >
      <div className="flex h-[min(92dvh,780px)] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl border border-amber-200/80 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.14)] sm:rounded-2xl">
        <SettingsPage
          currentUserMember={props.currentUserMember}
          invites={props.invites}
          onClose={props.onClose}
          user={props.user}
          workspace={props.workspace}
        />
      </div>
    </div>
  );
}

function ActionModal(props: ActionModalProps) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-slate-950/20 px-0 backdrop-blur-sm sm:items-center sm:px-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          props.onClose();
        }
      }}
    >
      <div className="w-full max-w-md rounded-t-2xl border border-amber-200/80 bg-white p-5 shadow-[0_30px_80px_rgba(15,23,42,0.14)] sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">{props.title}</h3>
          <button
            className="rounded-md px-2 py-1 text-xs text-slate-500 transition-colors duration-100 hover:bg-slate-100"
            onClick={props.onClose}
            type="button"
          >
            Close
          </button>
        </div>
        {props.children}
      </div>
    </div>
  );
}
