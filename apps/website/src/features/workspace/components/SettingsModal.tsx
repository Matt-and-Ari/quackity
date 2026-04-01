import { useEffect } from "react";

import { SettingsPage } from "../../settings/SettingsPage";
import type {
  AuthenticatedUser,
  WorkspaceInviteRecord,
  WorkspaceMemberRecord,
  WorkspaceSummary,
} from "../../../types/quack";

interface SettingsModalProps {
  currentUserMember?: WorkspaceMemberRecord;
  invites: WorkspaceInviteRecord[];
  onClose: () => void;
  user: AuthenticatedUser;
  workspace: WorkspaceSummary;
}

export function SettingsModal(props: SettingsModalProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        props.onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [props.onClose]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-slate-950/20 backdrop-blur-sm sm:items-center sm:px-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          props.onClose();
        }
      }}
    >
      <div className="flex h-[min(96dvh,780px)] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl border border-amber-200/80 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.14)] sm:h-[min(92dvh,780px)] sm:rounded-2xl">
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
