import type { User } from "@instantdb/react";
import { ChannelCallMeeting, useChannelCall } from "@quack/calls";
import {
  createChannelTx,
  createWorkspaceInviteTx,
  createWorkspaceMemberTx,
  createWorkspaceTx,
  deleteWorkspaceInviteByKeyTx,
  type WorkspaceRole,
  workspaceByIdQuery,
  workspaceInvitesByEmailQuery,
  workspaceMembershipsByUserQuery,
} from "@quack/data";
import { useEffect, useMemo, useState } from "react";
import { Link, Route, Switch, useLocation } from "wouter";

import { api } from "./lib/api";
import { instantDB } from "./lib/instant";
import { getRuntimeEnv } from "./lib/runtimeEnv";
import {
  createWorkspaceInviteKey,
  normalizeEmail,
  parseInviteEmails,
  slugifyWorkspaceName,
} from "./lib/workspaces";

type AuthenticatedUser = User;

type WorkspaceInvite = {
  email: string;
  id: string;
  role: string;
  workspace?: WorkspaceSummary | null;
};

type WorkspaceMember = {
  $user?: {
    email?: string | null;
    id: string;
  } | null;
  displayName?: string | null;
  id: string;
  role: string;
  workspace?: WorkspaceSummary | null;
};

type WorkspaceChannel = {
  id: string;
  name: string;
  visibility: string;
};

type WorkspaceSummary = {
  channels?: WorkspaceChannel[] | null;
  id: string;
  invites?: WorkspaceInvite[] | null;
  members?: WorkspaceMember[] | null;
  name: string;
  owner?: {
    id: string;
  } | null;
  slug: string;
};

const serverUrl = getRuntimeEnv("VITE_SERVER_URL") ?? "http://localhost:3001";

export default function App() {
  const { error, isLoading, user } = instantDB.useAuth();
  const authErrorMessage = error ? error.message : undefined;

  if (isLoading) {
    return (
      <AppFrame statusLabel="Checking your Instant session">
        <LoadingCard
          description="Restoring your session, workspace memberships, and pending invites."
          title="Signing you in"
        />
      </AppFrame>
    );
  }

  if (!user) {
    return <LoggedOutApp authErrorMessage={authErrorMessage} />;
  }

  return <LoggedInApp authErrorMessage={authErrorMessage} user={user} />;
}

function LoggedOutApp({ authErrorMessage }: { authErrorMessage?: string }) {
  const [location, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

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
      navigate(location === "/login" ? "/" : location);
    } catch (error) {
      setNotice(toErrorMessage(error, "Something went wrong during sign in."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppFrame statusLabel="Sign in with a magic code">
      <Switch>
        <Route path="/join/:workspaceId">
          {(params) => (
            <section className="grid flex-1 items-center gap-10 py-14 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-7">
                <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-sm text-slate-200 shadow-2xl shadow-cyan-950/20 backdrop-blur">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_20px_rgba(74,222,128,0.75)]" />
                  Accept your workspace invite after signing in.
                </div>

                <div className="space-y-5">
                  <p className="font-display text-5xl leading-none tracking-[-0.04em] text-white sm:text-6xl">
                    Join a workspace from your invite link.
                  </p>
                  <p className="max-w-2xl text-lg leading-8 text-slate-300">
                    Sign in with the email address that received the invite. Quack will accept the
                    pending invite for workspace{" "}
                    <span className="text-white">{params.workspaceId}</span> once you are
                    authenticated.
                  </p>
                </div>

                <MetricGroup
                  metrics={[
                    { label: "Route", value: "/join/:workspaceId" },
                    { label: "Auth", value: "Magic code" },
                    { label: "Next step", value: "Auto-accept" },
                  ]}
                />
              </div>

              <AuthCard
                authErrorMessage={authErrorMessage}
                code={code}
                email={email}
                isSubmitting={isSubmitting}
                notice={notice}
                onCodeChange={setCode}
                onEditEmail={() => {
                  setStep("email");
                  setCode("");
                  setNotice(null);
                }}
                onEmailChange={setEmail}
                onSubmit={handleSubmit}
                step={step}
                subtitle="Use the invited email so Quack can match your pending workspace invite."
                title="Sign in to accept invite"
              />
            </section>
          )}
        </Route>

        <Route path="/login">
          <section className="grid flex-1 items-center gap-10 py-14 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-7">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-sm text-slate-200 shadow-2xl shadow-cyan-950/20 backdrop-blur">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_20px_rgba(74,222,128,0.75)]" />
                Wouter now routes auth, onboarding, and workspace setup.
              </div>

              <div className="space-y-5">
                <p className="font-display text-5xl leading-none tracking-[-0.04em] text-white sm:text-6xl">
                  Join Quack with a magic code and start your team workspace.
                </p>
                <p className="max-w-2xl text-lg leading-8 text-slate-300">
                  Sign in with Instant, then either accept a pending invite or create your first
                  workspace and invite teammates.
                </p>
              </div>

              <MetricGroup
                metrics={[
                  { label: "Routing", value: "wouter" },
                  { label: "Auth", value: "Instant" },
                  { label: "Onboarding", value: "Workspace-first" },
                ]}
              />
            </div>

            <AuthCard
              authErrorMessage={authErrorMessage}
              code={code}
              email={email}
              isSubmitting={isSubmitting}
              notice={notice}
              onCodeChange={setCode}
              onEditEmail={() => {
                setStep("email");
                setCode("");
                setNotice(null);
              }}
              onEmailChange={setEmail}
              onSubmit={handleSubmit}
              step={step}
            />
          </section>
        </Route>

        <Route>
          <Navigate to="/login" />
        </Route>
      </Switch>
    </AppFrame>
  );
}

function LoggedInApp({
  authErrorMessage,
  user,
}: {
  authErrorMessage?: string;
  user: AuthenticatedUser;
}) {
  const membershipsState = instantDB.useQuery(workspaceMembershipsByUserQuery(user.id));
  const invitesState = instantDB.useQuery(
    workspaceInvitesByEmailQuery(user.email ? normalizeEmail(user.email) : "__no_invites__"),
  );

  const memberships = useMemo(
    () => asArray<WorkspaceMember>(membershipsState.data?.workspaceMembers),
    [membershipsState.data],
  );
  const pendingInvites = useMemo(
    () => asArray<WorkspaceInvite>(invitesState.data?.workspaceInvites),
    [invitesState.data],
  );

  const primaryWorkspaceId = memberships[0]?.workspace?.id;
  const statusLabel = memberships.length
    ? `${memberships.length} workspace${memberships.length === 1 ? "" : "s"} connected`
    : pendingInvites.length
      ? `${pendingInvites.length} invite${pendingInvites.length === 1 ? "" : "s"} waiting`
      : "Create your first workspace";

  async function handleSignOut() {
    await instantDB.auth.signOut();
  }

  if (membershipsState.isLoading || invitesState.isLoading) {
    return (
      <AppFrame statusLabel="Loading your workspace graph">
        <LoadingCard
          description="Fetching your memberships and pending invites."
          title="Preparing Quack"
        />
      </AppFrame>
    );
  }

  return (
    <AppFrame statusLabel={statusLabel}>
      <Switch>
        <Route path="/login">
          <Navigate to={primaryWorkspaceId ? `/workspaces/${primaryWorkspaceId}` : "/onboarding"} />
        </Route>

        <Route path="/onboarding">
          {memberships.length ? (
            <Navigate to={`/workspaces/${primaryWorkspaceId}`} />
          ) : (
            <OnboardingPage pendingInvites={pendingInvites} user={user} />
          )}
        </Route>

        <Route path="/join/:workspaceId">
          {(params) =>
            memberships.some((member) => member.workspace?.id === params.workspaceId) ? (
              <Navigate to={`/workspaces/${params.workspaceId}`} />
            ) : (
              <WorkspaceInviteAcceptPage
                pendingInvites={pendingInvites}
                user={user}
                workspaceId={params.workspaceId}
              />
            )
          }
        </Route>

        <Route path="/workspaces/:workspaceId/setup">
          {(params) =>
            memberships.length ? (
              <WorkspacePage
                authErrorMessage={authErrorMessage}
                mode="setup"
                onSignOut={handleSignOut}
                user={user}
                workspaceId={params.workspaceId}
              />
            ) : (
              <Navigate to="/onboarding" />
            )
          }
        </Route>

        <Route path="/workspaces/:workspaceId">
          {(params) =>
            memberships.length ? (
              <WorkspacePage
                authErrorMessage={authErrorMessage}
                mode="home"
                onSignOut={handleSignOut}
                user={user}
                workspaceId={params.workspaceId}
              />
            ) : (
              <Navigate to="/onboarding" />
            )
          }
        </Route>

        <Route path="/">
          <Navigate to={primaryWorkspaceId ? `/workspaces/${primaryWorkspaceId}` : "/onboarding"} />
        </Route>

        <Route>
          <Navigate to="/" />
        </Route>
      </Switch>
    </AppFrame>
  );
}

function OnboardingPage({
  pendingInvites,
  user,
}: {
  pendingInvites: WorkspaceInvite[];
  user: AuthenticatedUser;
}) {
  const [, navigate] = useLocation();
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceSlug, setWorkspaceSlug] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [inviteEmails, setInviteEmails] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

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
        ownerId: user.id,
        slug,
      });
      const generalChannel = createChannelTx({
        creatorId: user.id,
        name: "General",
        slug: "general",
        visibility: "public",
        workspaceId: workspace.workspaceId,
      });
      const emails = parseInviteEmails(inviteEmails).filter(
        (email) => email !== normalizeEmail(user.email ?? ""),
      );
      const inviteTransactions = emails.map(
        (email) =>
          createWorkspaceInviteTx({
            email,
            invitedById: user.id,
            role: "member",
            workspaceId: workspace.workspaceId,
          }).tx,
      );

      await instantDB.transact([...workspace.tx, ...generalChannel.tx, ...inviteTransactions]);
      navigate(`/workspaces/${workspace.workspaceId}/setup`);
    } catch (error) {
      setNotice(toErrorMessage(error, "Could not create the workspace."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="grid flex-1 gap-8 py-12 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="space-y-6">
        <div className="space-y-3">
          <p className="font-display text-5xl leading-none tracking-[-0.04em] text-white sm:text-6xl">
            Start your workspace.
          </p>
          <p className="max-w-2xl text-lg leading-8 text-slate-300">
            You are signed in but not part of a workspace yet. Create one for your team or accept a
            pending invite below.
          </p>
        </div>

        {pendingInvites.length ? (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
            <p className="font-display text-2xl text-white">Pending invites</p>
            <p className="mt-2 text-sm text-slate-400">
              Accept an invite to join an existing workspace immediately.
            </p>
            <div className="mt-5 grid gap-4">
              {pendingInvites.map((invite) => (
                <PendingInviteCard invite={invite} key={invite.id} user={user} />
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="rounded-[2rem] border border-white/[0.12] bg-slate-900/75 p-6 shadow-[0_30px_120px_rgba(2,8,23,0.7)] backdrop-blur-2xl">
        <form className="space-y-5" onSubmit={handleCreateWorkspace}>
          <div className="border-b border-white/10 pb-4">
            <p className="font-display text-2xl text-white">Create a workspace</p>
            <p className="mt-2 text-sm text-slate-400">
              We will create your owner membership and a default `#general` channel.
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

          {notice ? <Notice message={notice} /> : null}

          <button
            className="rounded-full bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
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

function PendingInviteCard({ invite, user }: { invite: WorkspaceInvite; user: AuthenticatedUser }) {
  const [, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function acceptInvite() {
    setIsSubmitting(true);
    setNotice(null);

    try {
      navigate(await acceptWorkspaceInvite(invite, user));
    } catch (error) {
      setNotice(toErrorMessage(error, "Could not accept the invite."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
      <p className="font-display text-2xl text-white">
        {invite.workspace?.name ?? "Workspace invite"}
      </p>
      <p className="mt-2 text-sm text-slate-300">
        Join as a <span className="font-medium text-white">{invite.role}</span>.
      </p>
      {notice ? <Notice message={notice} /> : null}
      <button
        className="mt-4 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
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

function WorkspaceInviteAcceptPage({
  pendingInvites,
  user,
  workspaceId,
}: {
  pendingInvites: WorkspaceInvite[];
  user: AuthenticatedUser;
  workspaceId: string;
}) {
  const [, navigate] = useLocation();
  const [hasAttempted, setHasAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const invite = pendingInvites.find((entry) => entry.workspace?.id === workspaceId) ?? null;

  useEffect(() => {
    if (!invite || isSubmitting || hasAttempted) {
      return;
    }

    let isCancelled = false;
    const pendingInvite = invite;

    async function run() {
      setHasAttempted(true);
      setIsSubmitting(true);
      setNotice(null);

      try {
        const destination = await acceptWorkspaceInvite(pendingInvite, user);

        if (!isCancelled) {
          navigate(destination);
        }
      } catch (error) {
        if (!isCancelled) {
          setNotice(toErrorMessage(error, "Could not accept the invite."));
          setIsSubmitting(false);
        }
      }
    }

    void run();

    return () => {
      isCancelled = true;
    };
  }, [hasAttempted, invite, isSubmitting, navigate, user]);

  if (!invite) {
    return (
      <section className="flex flex-1 items-center justify-center py-14">
        <div className="w-full max-w-2xl rounded-[2rem] border border-white/[0.12] bg-slate-900/75 p-8 shadow-[0_30px_120px_rgba(2,8,23,0.7)] backdrop-blur-2xl">
          <p className="font-display text-3xl text-white">Invite not found</p>
          <p className="mt-3 leading-7 text-slate-300">
            This account does not have a pending invite for that workspace. Sign in with the invited
            email address or ask the workspace owner to send a new invite link.
          </p>
          <div className="mt-6">
            <Link
              className="inline-flex rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 font-medium text-slate-100 transition hover:bg-white/[0.1]"
              href="/"
            >
              Back to Quack
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-1 items-center justify-center py-14">
      <div className="w-full max-w-2xl rounded-[2rem] border border-white/[0.12] bg-slate-900/75 p-8 shadow-[0_30px_120px_rgba(2,8,23,0.7)] backdrop-blur-2xl">
        <p className="font-display text-3xl text-white">Accepting your invite</p>
        <p className="mt-3 leading-7 text-slate-300">
          Joining <span className="text-white">{invite.workspace?.name ?? "workspace"}</span> as{" "}
          <span className="text-white">{invite.role}</span>.
        </p>
        {notice ? <Notice message={notice} tone="error" /> : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            className="rounded-full bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            onClick={() => {
              if (isSubmitting) {
                return;
              }

              setIsSubmitting(true);
              setNotice(null);

              void acceptWorkspaceInvite(invite, user)
                .then((destination) => {
                  navigate(destination);
                })
                .catch((error) => {
                  setNotice(toErrorMessage(error, "Could not accept the invite."));
                  setIsSubmitting(false);
                });
            }}
            type="button"
          >
            {isSubmitting ? "Joining workspace..." : "Retry invite acceptance"}
          </button>
          <Link
            className="inline-flex rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 font-medium text-slate-100 transition hover:bg-white/[0.1]"
            href="/"
          >
            Back to Quack
          </Link>
        </div>
      </div>
    </section>
  );
}

function WorkspacePage({
  authErrorMessage,
  mode,
  onSignOut,
  user,
  workspaceId,
}: {
  authErrorMessage?: string;
  mode: "home" | "setup";
  onSignOut: () => Promise<void>;
  user: AuthenticatedUser;
  workspaceId: string;
}) {
  const { data, error, isLoading } = instantDB.useQuery(workspaceByIdQuery(workspaceId));
  const workspace = asArray<WorkspaceSummary>(data?.workspaces)[0];

  if (isLoading) {
    return (
      <LoadingCard
        description="Loading channels, members, and pending invites."
        title={mode === "setup" ? "Workspace setup" : "Opening workspace"}
      />
    );
  }

  if (!workspace) {
    return <Navigate to="/" />;
  }

  const members = asArray<WorkspaceMember>(workspace.members);
  const channels = asArray<WorkspaceChannel>(workspace.channels);
  const invites = asArray<WorkspaceInvite>(workspace.invites);
  const isOwner = workspace.owner?.id === user.id;

  if (!members.some((member) => member.$user?.id === user.id)) {
    return <Navigate to="/" />;
  }

  return (
    <section className="space-y-8 py-12">
      <WorkspaceHeader
        action={
          mode === "setup" ? (
            <Link
              className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/[0.1]"
              href={`/workspaces/${workspace.id}`}
            >
              Skip to workspace
            </Link>
          ) : (
            <Link
              className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/[0.1]"
              href={`/workspaces/${workspace.id}/setup`}
            >
              Invite teammates
            </Link>
          )
        }
        authErrorMessage={authErrorMessage}
        description={
          mode === "setup"
            ? "Invite teammates before you drop into the workspace."
            : "Your workspace is ready. Invite more teammates any time."
        }
        onSignOut={onSignOut}
        workspace={workspace}
      />

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-6">
          <MetricGroup
            metrics={[
              { label: "Channels", value: String(channels.length) },
              { label: "Members", value: String(members.length) },
              { label: "Pending invites", value: String(invites.length) },
            ]}
          />

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
            <p className="font-display text-2xl text-white">Channels</p>
            <div className="mt-4 space-y-3">
              {channels.map((channel) => (
                <div
                  className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-200"
                  key={channel.id}
                >
                  <span className="font-medium text-white"># {channel.name}</span>
                  <span className="ml-2 text-slate-400">{channel.visibility}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
            <p className="font-display text-2xl text-white">Members</p>
            <div className="mt-4 grid gap-3">
              {members.map((member) => (
                <div
                  className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-200"
                  key={member.id}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-white">
                        {member.displayName || member.$user?.email || member.$user?.id}
                      </p>
                      <p className="text-slate-400">{member.$user?.email ?? "No email"}</p>
                    </div>
                    <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs tracking-[0.2em] text-cyan-100 uppercase">
                      {member.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <WorkspaceCallPanel channels={channels} user={user} />

          <InviteTeammatesPanel
            canInviteAdmin={isOwner}
            existingInvites={invites}
            existingMembers={members}
            inviterId={user.id}
            workspace={workspace}
          />
        </div>
      </div>

      {error ? <Notice message={error.message} /> : null}
    </section>
  );
}

function WorkspaceCallPanel({
  channels,
  user,
}: {
  channels: WorkspaceChannel[];
  user: AuthenticatedUser;
}) {
  const [selectedChannelId, setSelectedChannelId] = useState(channels[0]?.id ?? "");

  useEffect(() => {
    if (!selectedChannelId && channels[0]?.id) {
      setSelectedChannelId(channels[0].id);
    }
  }, [channels, selectedChannelId]);

  const { error, isInCall, isJoining, join, leave, meeting, session } = useChannelCall({
    channelId: selectedChannelId,
    displayName: user.email ?? undefined,
    refreshToken: user.refresh_token,
    serverUrl,
  });

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
      <p className="font-display text-2xl text-white">Audio and video calls</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        Pick a channel and join its live Cloudflare Realtime meeting through the backend join
        endpoint.
      </p>

      <div className="mt-5 space-y-4">
        <label className="block space-y-2">
          <span className="text-sm text-slate-300">Channel</span>
          <select
            className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-cyan-400/60"
            onChange={(event) => setSelectedChannelId(event.target.value)}
            value={selectedChannelId}
          >
            {channels.map((channel) => (
              <option key={channel.id} value={channel.id}>
                #{channel.name} ({channel.visibility})
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-wrap gap-3">
          <button
            className="rounded-full bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!selectedChannelId || !user.refresh_token || isJoining}
            onClick={() => {
              void join();
            }}
            type="button"
          >
            {isJoining ? "Joining call..." : isInCall ? "Refresh call token" : "Join channel call"}
          </button>

          <button
            className="rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 font-medium text-slate-100 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!isInCall}
            onClick={() => {
              void leave();
            }}
            type="button"
          >
            Leave call
          </button>
        </div>

        {error ? <Notice message={error} tone="error" /> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { label: "Meeting", value: session?.meetingId ?? "Not joined" },
            { label: "Preset", value: session?.presetName ?? "Not joined" },
          ].map((metric) => (
            <div
              className="rounded-3xl border border-white/10 bg-white/[0.07] p-5 backdrop-blur-xl"
              key={metric.label}
            >
              <dt className="text-sm text-slate-400">{metric.label}</dt>
              <dd className="mt-2 break-all font-display text-2xl text-white">{metric.value}</dd>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/70">
          {meeting ? (
            <div className="h-[34rem]">
              <ChannelCallMeeting meeting={meeting} />
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center px-6 text-center text-sm text-slate-400">
              Join a channel to open the live audio/video meeting UI.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InviteTeammatesPanel({
  canInviteAdmin,
  existingInvites,
  existingMembers,
  inviterId,
  workspace,
}: {
  canInviteAdmin: boolean;
  existingInvites: WorkspaceInvite[];
  existingMembers: WorkspaceMember[];
  inviterId: string;
  workspace: WorkspaceSummary;
}) {
  const [inviteEmails, setInviteEmails] = useState("");
  const inviteLink = getWorkspaceInviteLink(workspace.id);
  const invitePath = getWorkspaceInvitePath(workspace.id);
  const [linkNotice, setLinkNotice] = useState<string | null>(null);
  const [role, setRole] = useState<WorkspaceRole>("member");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function invitePeople(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const memberEmails = new Set(
      existingMembers
        .map((member) => member.$user?.email)
        .filter((email): email is string => Boolean(email))
        .map((email) => normalizeEmail(email)),
    );
    const pendingEmails = new Set(existingInvites.map((invite) => normalizeEmail(invite.email)));
    const emails = parseInviteEmails(inviteEmails).filter(
      (email) => !memberEmails.has(email) && !pendingEmails.has(email),
    );

    if (!emails.length) {
      setNotice("Add at least one new email that is not already a member or pending invite.");
      return;
    }

    setIsSubmitting(true);
    setNotice(null);

    try {
      const inviteTransactions = emails.map(
        (email) =>
          createWorkspaceInviteTx({
            email,
            invitedById: inviterId,
            role,
            workspaceId: workspace.id,
          }).tx,
      );

      await instantDB.transact(inviteTransactions);
      setInviteEmails("");
      setNotice(
        `Queued ${emails.length} invite${emails.length === 1 ? "" : "s"} for ${workspace.name}.`,
      );
    } catch (error) {
      setNotice(toErrorMessage(error, "Could not send invites."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
      <p className="font-display text-2xl text-white">Invite teammates</p>
      <p className="mt-2 text-sm text-slate-400">
        Invite people by email so they can join the workspace after signing in.
      </p>

      <div className="mt-5 rounded-3xl border border-white/10 bg-slate-950/70 p-4">
        <p className="text-sm font-medium text-white">Invite link</p>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Share this link with invited users. If they sign in with the invited email, Quack will
          accept their pending invite for this workspace.
        </p>
        <code className="mt-3 block overflow-x-auto rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-xs text-cyan-100">
          {inviteLink}
        </code>
        <div className="mt-3 flex flex-wrap gap-3">
          <button
            className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/[0.1]"
            onClick={() => {
              void navigator.clipboard
                .writeText(inviteLink)
                .then(() => {
                  setLinkNotice("Invite link copied to clipboard.");
                })
                .catch(() => {
                  setLinkNotice("Could not copy the link. You can still copy it manually.");
                });
            }}
            type="button"
          >
            Copy invite link
          </button>
          <Link
            className="inline-flex rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/[0.1]"
            href={invitePath}
          >
            Open invite route
          </Link>
        </div>
        {linkNotice ? (
          <div className="mt-3">
            <Notice message={linkNotice} />
          </div>
        ) : null}
      </div>

      <form className="mt-5 space-y-4" onSubmit={invitePeople}>
        <TextareaField
          label="Emails"
          onChange={setInviteEmails}
          placeholder={"sam@quack.chat\npat@quack.chat"}
          value={inviteEmails}
        />

        <label className="block space-y-2">
          <span className="text-sm text-slate-300">Role</span>
          <select
            className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-cyan-400/60"
            onChange={(event) => setRole(coerceWorkspaceRole(event.target.value))}
            value={role}
          >
            {canInviteAdmin ? <option value="admin">Admin</option> : null}
            <option value="member">Member</option>
            <option value="guest">Guest</option>
          </select>
        </label>

        {notice ? <Notice message={notice} /> : null}

        <button
          className="rounded-full bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting || !inviteEmails.trim()}
          type="submit"
        >
          {isSubmitting ? "Sending invites..." : "Send invites"}
        </button>
      </form>
    </div>
  );
}

function AuthCard({
  authErrorMessage,
  code,
  email,
  isSubmitting,
  notice,
  onCodeChange,
  onEditEmail,
  onEmailChange,
  onSubmit,
  step,
  subtitle = "Use your email to request a magic code from the Bun server.",
  title = "Sign in to Quack",
}: {
  authErrorMessage?: string;
  code: string;
  email: string;
  isSubmitting: boolean;
  notice: string | null;
  onCodeChange: (value: string) => void;
  onEditEmail: () => void;
  onEmailChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  step: "email" | "code";
  subtitle?: string;
  title?: string;
}) {
  return (
    <div className="relative">
      <div className="absolute -left-6 top-10 h-28 w-28 rounded-full bg-cyan-400/25 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-36 w-36 rounded-full bg-fuchsia-500/20 blur-3xl" />

      <div className="relative rounded-[2rem] border border-white/[0.12] bg-slate-900/75 p-6 shadow-[0_30px_120px_rgba(2,8,23,0.7)] backdrop-blur-2xl">
        <form className="space-y-6" onSubmit={onSubmit}>
          <div className="border-b border-white/10 pb-4">
            <p className="font-display text-2xl text-white">{title}</p>
            <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
          </div>

          <InputField
            disabled={isSubmitting || step === "code"}
            label="Email"
            onChange={onEmailChange}
            placeholder="you@quack.chat"
            type="email"
            value={email}
          />

          {step === "code" ? (
            <InputField
              disabled={isSubmitting}
              label="Magic code"
              onChange={onCodeChange}
              placeholder="123456"
              value={code}
            />
          ) : null}

          {notice ? <Notice message={notice} /> : null}
          {authErrorMessage ? <Notice message={authErrorMessage} tone="error" /> : null}

          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-full bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
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
                className="rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 font-medium text-slate-100 transition hover:bg-white/[0.1]"
                disabled={isSubmitting}
                onClick={onEditEmail}
                type="button"
              >
                Edit email
              </button>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}

function WorkspaceHeader({
  action,
  authErrorMessage,
  description,
  onSignOut,
  workspace,
}: {
  action?: React.ReactNode;
  authErrorMessage?: string;
  description: string;
  onSignOut: () => Promise<void>;
  workspace: WorkspaceSummary;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-display text-5xl leading-none tracking-[-0.04em] text-white sm:text-6xl">
            {workspace.name}
          </p>
          <p className="mt-3 max-w-2xl text-lg leading-8 text-slate-300">{description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {action}
          <button
            className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/[0.1]"
            onClick={() => {
              void onSignOut();
            }}
            type="button"
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-sm text-slate-200 shadow-2xl shadow-cyan-950/20 backdrop-blur">
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_20px_rgba(74,222,128,0.75)]" />
        Workspace slug: {workspace.slug}
      </div>

      {authErrorMessage ? <Notice message={authErrorMessage} tone="error" /> : null}
    </div>
  );
}

function AppFrame({ children, statusLabel }: { children: React.ReactNode; statusLabel: string }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.16),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.2),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.18),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:88px_88px] [mask-image:radial-gradient(circle_at_center,black,transparent_78%)]" />

      <main className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8 sm:px-10 lg:px-12">
        <header className="flex items-center justify-between rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 backdrop-blur-xl">
          <div>
            <Link href="/">
              <p className="font-display cursor-pointer text-lg tracking-[0.3em] text-cyan-200 uppercase">
                Quack
              </p>
            </Link>
            <p className="text-sm text-slate-300">Instant auth + workspace onboarding</p>
          </div>

          <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-50">
            {statusLabel}
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}

function MetricGroup({
  metrics,
}: {
  metrics: Array<{
    label: string;
    value: string;
  }>;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {metrics.map((metric) => (
        <div
          className="rounded-3xl border border-white/10 bg-white/[0.07] p-5 backdrop-blur-xl"
          key={metric.label}
        >
          <dt className="text-sm text-slate-400">{metric.label}</dt>
          <dd className="mt-2 font-display text-2xl text-white">{metric.value}</dd>
        </div>
      ))}
    </div>
  );
}

function InputField({
  disabled,
  label,
  onChange,
  placeholder,
  type = "text",
  value,
}: {
  disabled?: boolean;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  value: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm text-slate-300">{label}</span>
      <input
        autoComplete={type === "email" ? "email" : undefined}
        className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none ring-0 placeholder:text-slate-500 focus:border-cyan-400/60"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </label>
  );
}

function TextareaField({
  label,
  onChange,
  placeholder,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm text-slate-300">{label}</span>
      <textarea
        className="min-h-28 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none ring-0 placeholder:text-slate-500 focus:border-cyan-400/60"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}

function LoadingCard({ description, title }: { description: string; title: string }) {
  return (
    <section className="flex flex-1 items-center justify-center py-14">
      <div className="w-full max-w-xl rounded-[2rem] border border-white/[0.12] bg-slate-900/75 p-8 text-center shadow-[0_30px_120px_rgba(2,8,23,0.7)] backdrop-blur-2xl">
        <p className="font-display text-3xl text-white">{title}</p>
        <p className="mt-3 leading-7 text-slate-300">{description}</p>
      </div>
    </section>
  );
}

function Notice({ message, tone = "info" }: { message: string; tone?: "error" | "info" }) {
  const toneClasses =
    tone === "error"
      ? "border-rose-400/20 bg-rose-400/10 text-rose-100"
      : "border-cyan-400/20 bg-cyan-400/10 text-cyan-50";

  return <div className={`rounded-2xl border px-4 py-3 text-sm ${toneClasses}`}>{message}</div>;
}

async function acceptWorkspaceInvite(invite: WorkspaceInvite, user: AuthenticatedUser) {
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

  // Create the membership before deleting the invite so Instant perms can still
  // verify the accepted invite key against the pending invite record.
  await instantDB.transact(membership.tx);

  await instantDB.transact(
    deleteWorkspaceInviteByKeyTx({
      email: invite.email,
      role,
      workspaceId: invite.workspace.id,
    }),
  );

  return `/workspaces/${invite.workspace.id}`;
}

function getWorkspaceInvitePath(workspaceId: string) {
  return `/join/${workspaceId}`;
}

function getWorkspaceInviteLink(workspaceId: string) {
  const invitePath = getWorkspaceInvitePath(workspaceId);

  if (typeof window === "undefined") {
    return invitePath;
  }

  return new URL(invitePath, window.location.origin).toString();
}

function Navigate({ to }: { to: string }) {
  const [, navigate] = useLocation();

  useEffect(() => {
    navigate(to);
  }, [navigate, to]);

  return null;
}

function asArray<T>(value: T[] | null | undefined) {
  return Array.isArray(value) ? value : [];
}

function toErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function coerceWorkspaceRole(value: string): WorkspaceRole {
  if (value === "admin" || value === "guest") {
    return value;
  }

  return "member";
}
