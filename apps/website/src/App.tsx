import type { User } from "@instantdb/react";
import { workspaceInvitesByEmailQuery, workspaceMembershipsByUserQuery } from "@quack/data";
import { useMemo } from "react";
import { Route, Switch } from "wouter";

import { AppFrame } from "./components/layout/AppFrame";
import { LoadingCard } from "./components/layout/LoadingCard";
import { Navigate } from "./components/layout/Navigate";
import { LoggedOutPage, OnboardingPage } from "./features/auth/AuthScreens";
import { WorkspaceChatPage } from "./features/workspace/WorkspaceChatPage";
import { instantDB } from "./lib/instant";
import { asArray } from "./lib/ui";
import { normalizeEmail } from "./lib/workspaces";
import type { WorkspaceInviteRecord, WorkspaceMemberRecord } from "./types/quack";

type AuthenticatedUser = User;

export default function App() {
  const { isLoading, user } = instantDB.useAuth();

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
    return (
      <AppFrame statusLabel="Sign in">
        <Switch>
          <Route path="/login">
            <LoggedOutPage />
          </Route>

          <Route>
            <Navigate to="/login" />
          </Route>
        </Switch>
      </AppFrame>
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
    <Switch>
      <Route path="/login">
        <Navigate to={primaryWorkspaceId ? `/workspaces/${primaryWorkspaceId}` : "/onboarding"} />
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

      <Route path="/workspaces/:workspaceId/setup">
        {(params) =>
          memberships.length ? (
            <WorkspaceChatPage
              onSignOut={handleSignOut}
              user={user}
              workspaceId={params.workspaceId}
            />
          ) : (
            <Navigate to="/onboarding" />
          )
        }
      </Route>

      <Route path="/workspaces/:workspaceId/channels/:channelSlug">
        {(params) =>
          memberships.length ? (
            <WorkspaceChatPage
              channelSlug={params.channelSlug}
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
            <WorkspaceChatPage
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
  );
}
