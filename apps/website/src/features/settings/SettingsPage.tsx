import clsx from "clsx";
import { useState } from "react";

import type {
  AuthenticatedUser,
  WorkspaceInviteRecord,
  WorkspaceMemberRecord,
  WorkspaceSummary,
} from "../../types/quack";
import { MembersSettings } from "./components/MembersSettings";
import { PreferencesSettings } from "./components/PreferencesSettings";
import { ProfileSettings } from "./components/ProfileSettings";
import { WorkspaceSettings } from "./components/WorkspaceSettings";

type SettingsTab = "profile" | "preferences" | "workspace" | "members";

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
    { id: "preferences", label: "Preferences" },
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

      <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
        <nav className="flex shrink-0 gap-1 overflow-x-auto border-b border-amber-100/70 px-3 py-2 sm:w-48 sm:flex-col sm:gap-0.5 sm:overflow-x-visible sm:border-b-0 sm:border-r sm:py-4">
          {visibleTabs.map((tab) => (
            <button
              className={clsx(
                "whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors duration-100",
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

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-8 sm:py-6">
          {activeTab === "profile" ? (
            <ProfileSettings
              currentUserMember={props.currentUserMember}
              user={props.user}
              workspaceId={props.workspace.id}
            />
          ) : null}
          {activeTab === "preferences" ? <PreferencesSettings /> : null}
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
