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
    <section className="flex min-h-0 flex-1 items-center justify-center px-4 py-16 sm:py-20">
      <div className="relative w-full max-w-sm">
        {/* Decorative glow */}
        <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-b from-amber-200/30 to-amber-100/10 blur-2xl" />

        <div className="relative rounded-[1.45rem] border border-amber-200/60 bg-white/85 p-6 shadow-[0_24px_80px_rgba(217,119,6,0.1)] backdrop-blur-xl sm:p-8">
          {/* Logo + heading */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="size-10">
                <circle cx="32" cy="32" r="30" fill="#FCD34D" />
                <ellipse cx="32" cy="38" rx="18" ry="16" fill="#FBBF24" />
                <circle cx="32" cy="24" r="14" fill="#FCD34D" />
                <circle cx="26" cy="21" r="2.5" fill="#1E293B" />
                <circle cx="38" cy="21" r="2.5" fill="#1E293B" />
                <circle cx="27" cy="20" r="0.8" fill="#FFF" />
                <circle cx="39" cy="20" r="0.8" fill="#FFF" />
                <ellipse cx="32" cy="27" rx="6" ry="3.5" fill="#F97316" />
                <ellipse cx="32" cy="26.5" rx="4" ry="2" fill="#FB923C" />
                <ellipse
                  cx="20"
                  cy="40"
                  rx="8"
                  ry="5"
                  fill="#FBBF24"
                  transform="rotate(-15 20 40)"
                />
                <ellipse
                  cx="44"
                  cy="40"
                  rx="8"
                  ry="5"
                  fill="#FBBF24"
                  transform="rotate(15 44 40)"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              {step === "email" ? "Welcome back" : "Check your inbox"}
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
              {step === "email" ? (
                "Enter your email below and we'll send you a magic code to sign in."
              ) : (
                <>
                  We sent a 6-digit code to{" "}
                  <span className="font-medium text-slate-700">{email}</span>
                </>
              )}
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {step === "email" ? (
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-600">
                  Email address
                </span>
                <input
                  autoComplete="email"
                  className="w-full rounded-xl border border-amber-200/70 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-amber-400/40 transition-shadow duration-200 placeholder:text-slate-400 focus:border-amber-400 focus:ring-4"
                  disabled={isSubmitting}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@quackity.chat"
                  type="email"
                  value={email}
                />
              </label>
            ) : (
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-600">Magic code</span>
                <input
                  autoComplete="one-time-code"
                  className="w-full rounded-xl border border-amber-200/70 bg-white px-4 py-3 text-center font-mono text-lg tracking-[0.3em] text-slate-900 outline-none ring-amber-400/40 transition-shadow duration-200 placeholder:text-slate-400 placeholder:tracking-normal placeholder:font-sans placeholder:text-sm focus:border-amber-400 focus:ring-4"
                  disabled={isSubmitting}
                  maxLength={6}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="Enter 6-digit code"
                  value={code}
                />
              </label>
            )}

            {notice ? <Notice message={notice} /> : null}

            <button
              className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition-all duration-200 hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/15 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              disabled={isSubmitting || !email || (step === "code" && !code)}
              type="submit"
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="size-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      fill="currentColor"
                    />
                  </svg>
                  Working...
                </span>
              ) : step === "email" ? (
                "Continue with email"
              ) : (
                "Verify and sign in"
              )}
            </button>

            {step === "code" ? (
              <button
                className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-slate-500 transition-colors duration-200 hover:bg-slate-50 hover:text-slate-700"
                disabled={isSubmitting}
                onClick={() => {
                  setCode("");
                  setNotice(null);
                  setStep("email");
                }}
                type="button"
              >
                Use a different email
              </button>
            ) : null}
          </form>

          {/* Footer */}
          <div className="mt-6 border-t border-amber-100/60 pt-5 text-center">
            <p className="text-xs leading-relaxed text-slate-400">
              By continuing, you agree to Quackity&rsquo;s terms of service and privacy policy.
            </p>
          </div>
        </div>
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
    <section className="flex flex-1 flex-col items-start justify-center gap-6 px-4 py-8 sm:flex-row">
      {props.pendingInvites.length > 0 ? (
        <div className="w-full max-w-sm rounded-[1.45rem] border border-amber-200/60 bg-white/82 p-5 shadow-[0_18px_50px_rgba(217,119,6,0.08)] sm:p-6">
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

      <div className="w-full max-w-sm rounded-[1.45rem] border border-amber-200/60 bg-white/82 p-5 shadow-[0_18px_50px_rgba(217,119,6,0.08)] sm:p-6">
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

          <TextareaField
            label="Invite teammates"
            onChange={setInviteEmails}
            placeholder={"sam@quackity.chat\npat@quackity.chat"}
            value={inviteEmails}
          />

          {notice ? <Notice message={notice} tone="error" /> : null}

          <button
            className="w-full rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-medium text-white transition-colors duration-100 hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
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
