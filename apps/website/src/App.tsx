import type { User } from "@instantdb/react";
import { workspaceInvitesByEmailQuery, workspaceMembershipsByUserQuery } from "@quack/data";
import { useEffect, useMemo, useState } from "react";
import { Link, Route, Switch, useLocation } from "wouter";

import { AppFrame } from "./components/layout/AppFrame";
import { Navigate } from "./components/layout/Navigate";
import { WorkspaceShellLoading } from "./components/layout/WorkspaceShellLoading";
import { Notice } from "./components/ui/FormFields";
import { LoggedOutPage, OnboardingPage } from "./features/auth/AuthScreens";
import { LandingPage } from "./features/landing/LandingPage";
import { WorkspaceChatPage } from "./features/workspace/WorkspaceChatPage";
import { instantDB } from "./lib/instant";
import { asArray, toErrorMessage } from "./lib/ui";
import {
  acceptWorkspaceInvite as acceptWorkspaceInviteAction,
  normalizeEmail,
} from "./lib/workspaces";
import type { WorkspaceInviteRecord, WorkspaceMemberRecord } from "./types/quack";

type AuthenticatedUser = User;

export default function App() {
  const { isLoading, user } = instantDB.useAuth();

  if (isLoading) {
    return <WorkspaceShellLoading />;
  }

  if (!user) {
    return (
      <Switch>
        <Route path="/">
          <LandingPage />
        </Route>

        <Route path="/login">
          <AppFrame statusLabel="Sign in">
            <LoggedOutPage />
          </AppFrame>
        </Route>

        <Route path="/join/:workspaceId">
          <AppFrame statusLabel="Sign in">
            <LoggedOutPage />
          </AppFrame>
        </Route>

        <Route>
          <Navigate to="/" />
        </Route>
      </Switch>
    );
  }

  return <LoggedInApp user={user} />;
}

function LoggedInApp(props: { user: AuthenticatedUser }) {
  const user = props.user;
  const membershipsState = instantDB.useQuery(workspaceMembershipsByUserQuery(user.id));
  const invitesState = instantDB.useQuery(
    workspaceInvitesByEmailQuery(user.email ? normalizeEmail(user.email) : "__no_invites__"),
  );

  const memberships = useMemo(
    () => asArray<WorkspaceMemberRecord>(membershipsState.data?.workspaceMembers),
    [membershipsState.data],
  );
  const pendingInvites = useMemo(
    () => asArray<WorkspaceInviteRecord>(invitesState.data?.workspaceInvites),
    [invitesState.data],
  );

  const primaryWorkspaceId = memberships[0]?.workspace?.id;

  async function handleSignOut() {
    await instantDB.auth.signOut();
  }

  if (membershipsState.isLoading || invitesState.isLoading) {
    return <WorkspaceShellLoading />;
  }

  return (
    <Switch>
      <Route path="/login">
        <Navigate to={primaryWorkspaceId ? `/workspaces/${primaryWorkspaceId}` : "/onboarding"} />
      </Route>

      <Route path="/join/:workspaceId">
        {(params) =>
          memberships.some((m) => m.workspace?.id === params.workspaceId) ? (
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

      <Route path="/onboarding">
        {memberships.length ? (
          <Navigate to={`/workspaces/${primaryWorkspaceId}`} />
        ) : (
          <AppFrame statusLabel="Create your first workspace">
            <OnboardingPage pendingInvites={pendingInvites} user={user} />
          </AppFrame>
        )}
      </Route>

      <Route path="/workspaces/:workspaceId/*?">
        {(params) =>
          memberships.length ? (
            <WorkspaceChatPage
              channelSlug={extractChannelSlug(params["*"])}
              memberships={memberships}
              onSignOut={handleSignOut}
              pendingInvites={pendingInvites}
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
  );
}

function WorkspaceInviteAcceptPage(props: {
  pendingInvites: WorkspaceInviteRecord[];
  user: AuthenticatedUser;
  workspaceId: string;
}) {
  const [, navigate] = useLocation();
  const [hasAttempted, setHasAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const invite =
    props.pendingInvites.find((entry) => entry.workspace?.id === props.workspaceId) ?? null;

  useEffect(() => {
    if (!invite || isSubmitting || hasAttempted) {
      return;
    }

    let isCancelled = false;

    async function run() {
      setHasAttempted(true);
      setIsSubmitting(true);
      setNotice(null);

      try {
        const destination = await acceptWorkspaceInvite(invite!, props.user);

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
  }, [hasAttempted, invite, isSubmitting, navigate, props.user]);

  if (!invite) {
    return (
      <AppFrame statusLabel="Invite not found">
        <section className="flex flex-1 items-center justify-center px-4 py-14">
          <div className="w-full max-w-md rounded-[1.45rem] border border-amber-200/60 bg-white/82 p-5 shadow-[0_18px_50px_rgba(217,119,6,0.08)] sm:p-6">
            <p className="text-lg font-semibold text-slate-900">Invite not found</p>
            <p className="mt-2 text-sm text-slate-500">
              This account does not have a pending invite for that workspace. Sign in with the
              invited email address or ask the workspace owner to send a new invite.
            </p>
            <Link
              className="mt-4 inline-block rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-medium text-white transition-colors duration-100 hover:bg-amber-600"
              href="/"
            >
              Back to Quackity
            </Link>
          </div>
        </section>
      </AppFrame>
    );
  }

  return (
    <AppFrame statusLabel="Accepting invite">
      <section className="flex flex-1 items-center justify-center px-4 py-14">
        <div className="w-full max-w-md rounded-[1.45rem] border border-amber-200/60 bg-white/82 p-5 shadow-[0_18px_50px_rgba(217,119,6,0.08)] sm:p-6">
          <p className="text-lg font-semibold text-slate-900">Accepting your invite</p>
          <p className="mt-2 text-sm text-slate-500">
            Joining{" "}
            <span className="font-medium text-slate-900">
              {invite.workspace?.name ?? "workspace"}
            </span>{" "}
            as <span className="font-medium text-slate-900">{invite.role}</span>.
          </p>
          {notice ? (
            <div className="mt-3">
              <Notice message={notice} tone="error" />
            </div>
          ) : null}
          <div className="mt-4 flex items-center gap-2">
            <button
              className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-medium text-white transition-colors duration-100 hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              onClick={() => {
                if (isSubmitting) return;

                setIsSubmitting(true);
                setNotice(null);

                void acceptWorkspaceInvite(invite, props.user)
                  .then((destination) => navigate(destination))
                  .catch((error) => {
                    setNotice(toErrorMessage(error, "Could not accept the invite."));
                    setIsSubmitting(false);
                  });
              }}
              type="button"
            >
              {isSubmitting ? "Joining..." : "Retry"}
            </button>
            <Link
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors duration-100 hover:bg-slate-100"
              href="/"
            >
              Back to Quackity
            </Link>
          </div>
        </div>
      </section>
    </AppFrame>
  );
}

async function acceptWorkspaceInvite(invite: WorkspaceInviteRecord, user: AuthenticatedUser) {
  return await acceptWorkspaceInviteAction(invite, user);
}

function extractChannelSlug(rest: string | undefined): string | undefined {
  if (!rest) return undefined;
  const match = rest.match(/^channels\/([^/]+)/);
  return match?.[1];
}
