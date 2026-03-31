import clsx from "clsx";

import { ChannelLink } from "../../../components/chat/ChannelLink";
import { SidebarInviteCard } from "./SidebarInviteCard";
import { SidebarMenuButton } from "./SidebarMenuButton";
import { SidebarUserCard } from "./SidebarUserCard";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { BrowseGlyph, CloseGlyph, PlusGlyph, SearchGlyph } from "./WorkspaceGlyphs";
import type { UseQuackWorkspaceResult } from "../../../hooks/useQuackWorkspace";
import type {
  AuthenticatedUser,
  ChannelRecord,
  WorkspaceInviteRecord,
  WorkspaceMemberRecord,
} from "../../../types/quack";

export {
  getWorkspaceGradient,
  getWorkspaceInitial,
  MenuRow,
  UserAvatar,
  WorkspaceIcon,
} from "./WorkspaceAtoms";

interface SidebarContentProps {
  app: UseQuackWorkspaceResult;
  canManageChannels: boolean;
  channelIdsWithDrafts: Set<string>;
  currentUserMember?: WorkspaceMemberRecord;
  isDirectoryOpen: boolean;
  memberships: WorkspaceMemberRecord[];
  onBrowse: () => void;
  onChannelContextMenu: (event: React.MouseEvent, channel: ChannelRecord) => void;
  onChannelNavigate?: () => void;
  onClose?: () => void;
  onCreateChannel: () => void;
  onCreateWorkspace: () => void;
  onInvite: () => void;
  onSearch?: () => void;
  onSettings: () => void;
  onSignOut: () => void;
  pendingInvites: WorkspaceInviteRecord[];
  user: AuthenticatedUser;
  workspace: NonNullable<UseQuackWorkspaceResult["workspace"]>;
  workspaceSlug: string;
}

export function SidebarContent(props: SidebarContentProps) {
  return (
    <>
      <div className="flex items-center gap-3 border-b border-amber-200/50 px-4 py-3.5">
        <WorkspaceSwitcher
          currentWorkspaceId={props.workspace.id}
          memberships={props.memberships}
          onCreateWorkspace={props.onCreateWorkspace}
          workspaceImageUrl={props.workspace.imageUrl}
          workspaceName={props.workspace.name}
        />
        <SidebarMenuButton
          onCreateChannel={props.canManageChannels ? props.onCreateChannel : undefined}
          onInvite={props.onInvite}
          onSettings={props.onSettings}
        />
        {props.onClose ? (
          <button
            className="flex size-7 items-center justify-center rounded-lg text-slate-400 transition-colors duration-100 hover:bg-amber-100/60 hover:text-slate-600 md:hidden"
            onClick={props.onClose}
            type="button"
          >
            <CloseGlyph />
          </button>
        ) : null}
      </div>

      <div className="flex flex-col gap-0.5 border-b border-amber-200/50 px-2 py-2">
        {props.onSearch ? (
          <button
            className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-sm font-medium text-slate-500 transition-colors duration-100 hover:bg-amber-50/80 hover:text-slate-700"
            onClick={props.onSearch}
            type="button"
          >
            <SearchGlyph />
            <span className="flex-1 text-left">Search</span>
            <kbd className="hidden rounded-md border border-amber-200/60 bg-amber-50/60 px-1.5 py-0.5 text-[0.55rem] font-medium text-slate-400 sm:inline-block">
              ⌘K
            </kbd>
          </button>
        ) : null}
        <button
          className={clsx(
            "flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-sm font-medium transition-colors duration-100",
            props.isDirectoryOpen
              ? "bg-amber-100/70 text-amber-700"
              : "text-slate-500 hover:bg-amber-50/80 hover:text-slate-700",
          )}
          onClick={props.onBrowse}
          type="button"
        >
          <BrowseGlyph />
          <span>Browse</span>
        </button>
      </div>

      <nav
        aria-label="Channels"
        className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-3"
      >
        <div className="mb-1 flex items-center justify-between px-2">
          <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-slate-400">
            Channels
          </p>
          {props.canManageChannels ? (
            <button
              className="flex size-5 items-center justify-center rounded-md text-slate-400 transition-colors duration-100 hover:bg-amber-100/60 hover:text-slate-600"
              onClick={props.onCreateChannel}
              type="button"
            >
              <PlusGlyph />
            </button>
          ) : null}
        </div>
        {props.app.visibleChannels.map((channel) => (
          <ChannelLink
            channel={channel}
            hasDraft={props.channelIdsWithDrafts.has(channel.id)}
            href={`/workspaces/${props.workspaceSlug}/channels/${channel.slug}`}
            isActive={channel.id === props.app.activeChannel?.id && !props.isDirectoryOpen}
            isRenaming={channel.id === props.app.renamingChannelId}
            key={channel.id}
            onCancelRename={props.app.cancelRenamingChannel}
            onClick={props.onChannelNavigate}
            onContextMenu={props.onChannelContextMenu}
            onRenameValueChange={props.app.setChannelRenameDraft}
            onSaveRename={() => {
              void props.app.saveRenamingChannel();
            }}
            renameValue={props.app.channelRenameDraft}
          />
        ))}
      </nav>

      {props.pendingInvites.length > 0 ? (
        <div className="border-t border-amber-200/50 px-3 py-3">
          <p className="mb-2 px-1 text-[0.65rem] font-semibold uppercase tracking-widest text-slate-400">
            Invites
            <span className="ml-1.5 inline-flex size-4 items-center justify-center rounded-full bg-amber-500 text-[0.55rem] font-bold text-white">
              {props.pendingInvites.length}
            </span>
          </p>
          <div className="flex flex-col gap-1.5">
            {props.pendingInvites.map((invite) => (
              <SidebarInviteCard invite={invite} key={invite.id} user={props.user} />
            ))}
          </div>
        </div>
      ) : null}

      <SidebarUserCard
        currentUserMember={props.currentUserMember}
        onSettings={props.onSettings}
        onSignOut={props.onSignOut}
        user={props.user}
      />
    </>
  );
}
