import {
  createChannelTx,
  createWorkspaceInviteTx,
  createWorkspaceMemberTx,
  createWorkspaceTx,
  deleteWorkspaceInviteByKeyTx,
  type WorkspaceRole,
} from "@quack/data";
import { useState } from "react";
import { useLocation } from "wouter";

import { InputField, Notice, TextareaField } from "../../components/ui/FormFields";
import { api } from "../../lib/api";
import { instantDB } from "../../lib/instant";
import { toErrorMessage } from "../../lib/ui";
import {
  createWorkspaceInviteKey,
  normalizeEmail,
  parseInviteEmails,
  slugifyWorkspaceName,
} from "../../lib/workspaces";
import type { AuthenticatedUser, WorkspaceInviteRecord } from "../../types/quack";

export function LoggedOutPage() {
  const [, navigate] = useLocation();
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [step, setStep] = useState<"code" | "email">("email");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = normalizeEmail(email);
    setIsSubmitting(true);
    setNotice(null);

    try {
      if (step === "email") {
        const response = await api.sendMagicCode(normalizedEmail);

        if (response.error) {
          setNotice("Could not send a magic code. Double-check the email and try again.");
          return;
        }

        setEmail(normalizedEmail);
        setStep("code");
        setNotice(`Magic code sent to ${normalizedEmail}.`);
        return;
      }

      const response = await api.verifyMagicCode(normalizedEmail, code);

      if (response.error || !response.data || typeof response.data.token !== "string") {
        setNotice("Invalid code. Request a new one and try again.");
        return;
      }

      await instantDB.auth.signInWithToken(response.data.token);
      navigate("/");
    } catch (error) {
      setNotice(toErrorMessage(error, "Something went wrong during sign in."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="flex flex-1 items-center justify-center py-8">
      <div className="w-full max-w-sm rounded-[1.45rem] border border-amber-200/60 bg-white/82 p-6 shadow-[0_18px_50px_rgba(217,119,6,0.08)]">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <p className="text-lg font-semibold text-slate-900">Sign in to Quack</p>
            <p className="mt-1 text-sm text-slate-500">
              {step === "email"
                ? "Enter your email to receive a magic code."
                : "Enter the code we just sent."}
            </p>
          </div>

          <InputField
            disabled={isSubmitting || step === "code"}
            label="Email"
            onChange={setEmail}
            placeholder="you@quack.chat"
            type="email"
            value={email}
          />

          {step === "code" ? (
            <InputField
              disabled={isSubmitting}
              label="Magic code"
              onChange={setCode}
              placeholder="123456"
              value={code}
            />
          ) : null}

          {notice ? <Notice message={notice} /> : null}

          <div className="flex items-center gap-2">
            <button
              className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-medium text-white transition-colors duration-100 hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting || !email || (step === "code" && !code)}
              type="submit"
            >
              {isSubmitting
                ? "Working..."
                : step === "email"
                  ? "Send magic code"
                  : "Verify and sign in"}
            </button>

            {step === "code" ? (
              <button
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors duration-100 hover:bg-slate-100"
                disabled={isSubmitting}
                onClick={() => {
                  setCode("");
                  setNotice(null);
                  setStep("email");
                }}
                type="button"
              >
                Edit email
              </button>
            ) : null}
          </div>
        </form>
      </div>
    </section>
  );
}

interface OnboardingPageProps {
  pendingInvites: WorkspaceInviteRecord[];
  user: AuthenticatedUser;
}

export function OnboardingPage(props: OnboardingPageProps) {
  const [, navigate] = useLocation();
  const [displayName, setDisplayName] = useState("");
  const [inviteEmails, setInviteEmails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [slugEdited, setSlugEdited] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceSlug, setWorkspaceSlug] = useState("");

  async function handleCreateWorkspace(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

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
      const generalChannel = createChannelTx({
        creatorId: props.user.id,
        name: "General",
        slug: "general",
        visibility: "public",
        workspaceId: workspace.workspaceId,
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
            workspaceId: workspace.workspaceId,
          }).tx,
      );

      await instantDB.transact([...workspace.tx, ...generalChannel.tx, ...inviteTransactions]);
      navigate(`/workspaces/${workspace.workspaceId}/channels/general`);
    } catch (error) {
      setNotice(toErrorMessage(error, "Could not create the workspace."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="flex flex-1 items-start justify-center gap-6 py-8">
      {props.pendingInvites.length > 0 ? (
        <div className="w-full max-w-sm rounded-[1.45rem] border border-amber-200/60 bg-white/82 p-6 shadow-[0_18px_50px_rgba(217,119,6,0.08)]">
          <p className="text-base font-semibold text-slate-900">Pending invites</p>
          <p className="mt-1 text-sm text-slate-500">
            Accept an invite to join an existing workspace.
          </p>
          <div className="mt-4 flex flex-col gap-3">
            {props.pendingInvites.map((invite) => (
              <PendingInviteCard invite={invite} key={invite.id} user={props.user} />
            ))}
          </div>
        </div>
      ) : null}

      <div className="w-full max-w-sm rounded-[1.45rem] border border-amber-200/60 bg-white/82 p-6 shadow-[0_18px_50px_rgba(217,119,6,0.08)]">
        <form className="space-y-4" onSubmit={handleCreateWorkspace}>
          <div>
            <p className="text-lg font-semibold text-slate-900">Create a workspace</p>
            <p className="mt-1 text-sm text-slate-500">
              We&rsquo;ll create your workspace with a default #general channel.
            </p>
          </div>

          <InputField
            label="Workspace name"
            onChange={(value) => {
              setWorkspaceName(value);

              if (!slugEdited) {
                setWorkspaceSlug(slugifyWorkspaceName(value));
              }
            }}
            placeholder="Quack HQ"
            value={workspaceName}
          />

          <InputField
            label="Workspace slug"
            onChange={(value) => {
              setSlugEdited(true);
              setWorkspaceSlug(value);
            }}
            placeholder="quack-hq"
            value={workspaceSlug}
          />

          <InputField
            label="Your display name"
            onChange={setDisplayName}
            placeholder="Ari"
            value={displayName}
          />

          <TextareaField
            label="Invite teammates"
            onChange={setInviteEmails}
            placeholder={"sam@quack.chat\npat@quack.chat"}
            value={inviteEmails}
          />

          {notice ? <Notice message={notice} tone="error" /> : null}

          <button
            className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-medium text-white transition-colors duration-100 hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting || !workspaceName.trim() || !workspaceSlug.trim()}
            type="submit"
          >
            {isSubmitting ? "Creating workspace..." : "Create workspace"}
          </button>
        </form>
      </div>
    </section>
  );
}

interface PendingInviteCardProps {
  invite: WorkspaceInviteRecord;
  user: AuthenticatedUser;
}

function PendingInviteCard(props: PendingInviteCardProps) {
  const [, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function acceptInvite() {
    if (!props.user.email || !props.invite.workspace) {
      setNotice("This account needs an email before it can accept workspace invites.");
      return;
    }

    setIsSubmitting(true);
    setNotice(null);

    try {
      const role = coerceWorkspaceRole(props.invite.role);
      const membership = createWorkspaceMemberTx({
        acceptedInviteKey: createWorkspaceInviteKey(
          props.invite.workspace.id,
          props.invite.email,
          role,
        ),
        displayName: props.user.email.split("@")[0],
        role,
        userId: props.user.id,
        workspaceId: props.invite.workspace.id,
      });

      await instantDB.transact([
        membership.tx,
        deleteWorkspaceInviteByKeyTx({
          email: props.invite.email,
          role,
          workspaceId: props.invite.workspace.id,
        }),
      ]);

      navigate(`/workspaces/${props.invite.workspace.id}`);
    } catch (error) {
      setNotice(toErrorMessage(error, "Could not accept the invite."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border border-amber-200/40 bg-amber-50/50 px-4 py-3">
      <p className="text-sm font-semibold text-slate-900">
        {props.invite.workspace?.name ?? "Workspace invite"}
      </p>
      <p className="mt-0.5 text-xs text-slate-500">
        Join as <span className="font-medium text-slate-700">{props.invite.role}</span>
      </p>
      {notice ? (
        <div className="mt-2">
          <Notice message={notice} tone="error" />
        </div>
      ) : null}
      <button
        className="mt-2 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-white transition-colors duration-100 hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
        onClick={() => {
          void acceptInvite();
        }}
        type="button"
      >
        {isSubmitting ? "Joining..." : "Accept invite"}
      </button>
    </div>
  );
}

function coerceWorkspaceRole(value: string): WorkspaceRole {
  if (value === "admin" || value === "guest") {
    return value;
  }

  return "member";
}
