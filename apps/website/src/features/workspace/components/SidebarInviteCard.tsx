import { useState } from "react";
import { useLocation } from "wouter";

import { WorkspaceIcon } from "./WorkspaceAtoms";
import { acceptWorkspaceInvite } from "../../../lib/workspaces";
import type { AuthenticatedUser, WorkspaceInviteRecord } from "../../../types/quack";

interface SidebarInviteCardProps {
  invite: WorkspaceInviteRecord;
  user: AuthenticatedUser;
}

export function SidebarInviteCard(props: SidebarInviteCardProps) {
  const [, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleAccept() {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const destination = await acceptWorkspaceInvite(props.invite, props.user);
      navigate(destination);
    } catch {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border border-amber-200/40 bg-amber-50/50 px-3 py-2.5">
      <div className="flex items-center gap-2">
        <WorkspaceIcon
          gradient="from-amber-400 to-amber-500"
          imageUrl={props.invite.workspace?.imageUrl}
          label={props.invite.workspace?.name ?? "W"}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-800">
            {props.invite.workspace?.name ?? "Workspace"}
          </p>
          <p className="text-[0.65rem] text-slate-400">as {props.invite.role}</p>
        </div>
      </div>
      <button
        className="mt-2 w-full rounded-lg bg-amber-500 px-2.5 py-1.5 text-xs font-medium text-white transition-colors duration-100 hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
        onClick={() => {
          void handleAccept();
        }}
        type="button"
      >
        {isSubmitting ? "Joining..." : "Accept invite"}
      </button>
    </div>
  );
}
