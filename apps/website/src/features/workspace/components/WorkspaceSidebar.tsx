import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "wouter";

import clsx from "clsx";

import { ChannelLink } from "../../../components/chat/ChatPrimitives";
import { acceptWorkspaceInvite } from "../../../lib/workspaces";
import type { UseQuackWorkspaceResult } from "../../../hooks/useQuackWorkspace";
import type {
  AuthenticatedUser,
  ChannelRecord,
  WorkspaceInviteRecord,
  WorkspaceMemberRecord,
} from "../../../types/quack";
import { channelHasActiveCall } from "./workspaceUtils";

const WORKSPACE_GRADIENT_PAIRS = [
  ["from-amber-400", "to-amber-500"],
  ["from-orange-400", "to-orange-500"],
  ["from-yellow-500", "to-amber-600"],
  ["from-amber-500", "to-orange-600"],
  ["from-rose-400", "to-rose-500"],
  ["from-emerald-400", "to-emerald-500"],
  ["from-teal-400", "to-teal-500"],
  ["from-sky-400", "to-sky-500"],
] as const;

interface WorkspaceSwitcherProps {
  currentWorkspaceId: string;
  memberships: WorkspaceMemberRecord[];
  workspaceImageUrl?: string | null;
  workspaceName: string;
}

interface WorkspaceSwitcherItemProps {
  gradient: string;
  imageUrl?: string | null;
  isActive: boolean;
  label: string;
  onClick: () => void;
  role?: string;
}

interface SidebarContentProps {
  activeCallChannelIds: ReadonlySet<string>;
  app: UseQuackWorkspaceResult;
  callChannelId: string | null;
  canManageChannels: boolean;
  isDirectoryOpen: boolean;
  memberships: WorkspaceMemberRecord[];
  onBrowse: () => void;
  onChannelContextMenu: (event: React.MouseEvent, channel: ChannelRecord) => void;
  onChannelNavigate?: () => void;
  onClose?: () => void;
  onCreateChannel: () => void;
  onInvite: () => void;
  onSettings: () => void;
  onSignOut: () => void;
  pendingInvites: WorkspaceInviteRecord[];
  user: AuthenticatedUser;
  workspace: NonNullable<UseQuackWorkspaceResult["workspace"]>;
  workspaceId: string;
}

interface SidebarInviteCardProps {
  invite: WorkspaceInviteRecord;
  user: AuthenticatedUser;
}

interface SidebarMenuButtonProps {
  onCreateChannel?: () => void;
  onInvite: () => void;
  onSettings: () => void;
  onSignOut: () => void;
}

interface MenuRowProps {
  label: string;
  onClick: () => void;
}

export function getWorkspaceGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  const pair = WORKSPACE_GRADIENT_PAIRS[Math.abs(hash) % WORKSPACE_GRADIENT_PAIRS.length];
  return `${pair[0]} ${pair[1]}`;
}

export function WorkspaceIcon(props: {
  gradient: string;
  imageUrl?: string | null;
  label: string;
  size: "sm" | "lg";
}) {
  const sizeClass = props.size === "lg" ? "size-9 rounded-xl text-sm" : "size-8 rounded-lg text-xs";

  if (props.imageUrl) {
    return (
      <img
        alt={props.label}
        className={clsx("shrink-0 object-cover shadow-sm", sizeClass)}
        src={props.imageUrl}
      />
    );
  }

  return (
    <div
      className={clsx(
        "flex shrink-0 items-center justify-center bg-gradient-to-br font-bold text-white shadow-sm",
        sizeClass,
        props.gradient,
      )}
    >
      {getWorkspaceInitial(props.label)}
    </div>
  );
}

export function UserAvatar(props: { imageUrl?: string | null; name: string; size: "xs" | "sm" }) {
  const sizeClass = props.size === "xs" ? "size-5 text-[0.5rem]" : "size-8 text-xs";
  const initial = props.name.trim().charAt(0).toUpperCase() || "?";

  if (props.imageUrl) {
    return (
      <img
        alt={props.name}
        className={clsx("shrink-0 rounded-full object-cover", sizeClass)}
        src={props.imageUrl}
      />
    );
  }

  return (
    <div
      className={clsx(
        "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 font-semibold text-white",
        sizeClass,
      )}
    >
      {initial}
    </div>
  );
}

export function SidebarContent(props: SidebarContentProps) {
  return (
    <>
      <div className="flex items-center gap-3 border-b border-amber-200/50 px-4 py-3.5">
        <WorkspaceSwitcher
          currentWorkspaceId={props.workspaceId}
          memberships={props.memberships}
          workspaceImageUrl={props.workspace.imageUrl}
          workspaceName={props.workspace.name}
        />
        <SidebarMenuButton
          onCreateChannel={props.canManageChannels ? props.onCreateChannel : undefined}
          onInvite={props.onInvite}
          onSettings={props.onSettings}
          onSignOut={props.onSignOut}
        />
        {props.onClose ? (
          <button
            className="flex size-7 items-center justify-center rounded-lg text-slate-400 transition-colors duration-100 hover:bg-amber-100/60 hover:text-slate-600 md:hidden"
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
        ) : null}
      </div>

      <div className="border-b border-amber-200/50 px-2 py-2">
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
              <svg fill="none" height="12" viewBox="0 0 12 12" width="12">
                <path
                  d="M6 1v10M1 6h10"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="1.5"
                />
              </svg>
            </button>
          ) : null}
        </div>
        {props.app.visibleChannels.map((channel) => (
          <ChannelLink
            channel={channel}
            hasActiveCall={channelHasActiveCall(
              channel,
              props.callChannelId,
              props.activeCallChannelIds,
            )}
            href={`/workspaces/${props.workspaceId}/channels/${channel.slug}`}
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
    </>
  );
}

function getWorkspaceInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "W";
}

function WorkspaceSwitcher(props: WorkspaceSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();
  const [dropdownPos, setDropdownPos] = useState<{ left: number; top: number } | null>(null);

  const otherWorkspaces = props.memberships.filter(
    (membership) =>
      membership.workspace?.id && membership.workspace.id !== props.currentWorkspaceId,
  );
  const hasMultiple = otherWorkspaces.length > 0;

  function computePosition() {
    if (!triggerRef.current) {
      return null;
    }

    const rect = triggerRef.current.getBoundingClientRect();
    return { left: rect.left, top: rect.bottom + 6 };
  }

  useLayoutEffect(() => {
    if (!isOpen) {
      return;
    }

    function updatePosition() {
      const nextPosition = computePosition();
      if (nextPosition) {
        setDropdownPos(nextPosition);
      }
    }

    function handleClickOutside(event: MouseEvent) {
      if (
        triggerRef.current?.contains(event.target as Node) ||
        dropdownRef.current?.contains(event.target as Node)
      ) {
        return;
      }

      setIsOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    updatePosition();
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen]);

  return (
    <div className="min-w-0 flex-1" ref={triggerRef}>
      <button
        className={clsx(
          "flex min-w-0 flex-1 items-center gap-3",
          hasMultiple && "group cursor-pointer",
        )}
        disabled={!hasMultiple}
        onClick={() => {
          if (!hasMultiple) {
            return;
          }

          setIsOpen((value) => {
            if (!value) {
              setDropdownPos(computePosition());
            }
            return !value;
          });
        }}
        type="button"
      >
        <WorkspaceIcon
          gradient={getWorkspaceGradient(props.workspaceName)}
          imageUrl={props.workspaceImageUrl}
          label={props.workspaceName}
          size="lg"
        />
        <h1 className="min-w-0 flex-1 truncate text-left text-[0.95rem] font-semibold tracking-tight text-slate-900">
          {props.workspaceName}
        </h1>
        {hasMultiple ? (
          <svg
            className={clsx(
              "shrink-0 text-slate-400 transition-transform duration-150",
              isOpen && "rotate-180",
            )}
            fill="none"
            height="14"
            viewBox="0 0 14 14"
            width="14"
          >
            <path
              d="M3.5 5.25 7 8.75l3.5-3.5"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
          </svg>
        ) : null}
      </button>

      {isOpen && dropdownPos
        ? createPortal(
            <div
              className="fixed z-50 w-64 overflow-hidden rounded-2xl border border-amber-200/80 bg-white/95 p-1.5 shadow-[0_16px_48px_rgba(15,23,42,0.14)] backdrop-blur-xl"
              ref={dropdownRef}
              style={{ left: dropdownPos.left, top: dropdownPos.top }}
            >
              <div className="px-3 pb-1.5 pt-2">
                <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-slate-400">
                  Workspaces
                </p>
              </div>

              <div className="flex flex-col gap-0.5">
                <WorkspaceSwitcherItem
                  gradient={getWorkspaceGradient(props.workspaceName)}
                  imageUrl={props.workspaceImageUrl}
                  isActive
                  label={props.workspaceName}
                  onClick={() => setIsOpen(false)}
                />

                {otherWorkspaces.map((membership) => {
                  const workspace = membership.workspace;
                  if (!workspace) {
                    return null;
                  }

                  return (
                    <WorkspaceSwitcherItem
                      gradient={getWorkspaceGradient(workspace.name)}
                      imageUrl={workspace.imageUrl}
                      isActive={false}
                      key={workspace.id}
                      label={workspace.name}
                      onClick={() => {
                        setIsOpen(false);
                        navigate(`/workspaces/${workspace.id}`);
                      }}
                      role={membership.role}
                    />
                  );
                })}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function WorkspaceSwitcherItem(props: WorkspaceSwitcherItemProps) {
  return (
    <button
      className={clsx(
        "flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors duration-100",
        props.isActive ? "bg-amber-100/60" : "hover:bg-amber-50/80",
      )}
      onClick={props.onClick}
      type="button"
    >
      <WorkspaceIcon
        gradient={props.gradient}
        imageUrl={props.imageUrl}
        label={props.label}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-800">{props.label}</p>
        {props.role ? <p className="text-[0.65rem] text-slate-400">{props.role}</p> : null}
      </div>
      {props.isActive ? (
        <svg
          className="shrink-0 text-amber-500"
          fill="none"
          height="16"
          viewBox="0 0 16 16"
          width="16"
        >
          <path
            d="M3.5 8.5 6.5 11.5 12.5 4.5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
        </svg>
      ) : null}
    </button>
  );
}

function BrowseGlyph() {
  return (
    <svg fill="none" height="16" viewBox="0 0 16 16" width="16">
      <path
        d="M6.5 2H3.5C2.67 2 2 2.67 2 3.5v9C2 13.33 2.67 14 3.5 14h9c.83 0 1.5-.67 1.5-1.5V9.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.3"
      />
      <path
        d="M6 10l1.5-4.5L12 4l-1.5 4.5L6 10Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.3"
      />
    </svg>
  );
}

function SidebarInviteCard(props: SidebarInviteCardProps) {
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

function SidebarMenuButton(props: SidebarMenuButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={ref}>
      <button
        className={clsx(
          "flex size-7 items-center justify-center rounded-lg transition-colors duration-100",
          isOpen
            ? "bg-amber-200/60 text-slate-700"
            : "text-slate-400 hover:bg-amber-100/60 hover:text-slate-600",
        )}
        onClick={() => setIsOpen((value) => !value)}
        type="button"
      >
        <svg fill="none" height="16" viewBox="0 0 16 16" width="16">
          <circle cx="8" cy="3" fill="currentColor" r="1.2" />
          <circle cx="8" cy="8" fill="currentColor" r="1.2" />
          <circle cx="8" cy="13" fill="currentColor" r="1.2" />
        </svg>
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-full z-30 mt-1 w-44 overflow-hidden rounded-xl border border-amber-200/80 bg-white/95 py-1 shadow-[0_12px_32px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          {props.onCreateChannel ? (
            <MenuRow
              label="New channel"
              onClick={() => {
                setIsOpen(false);
                props.onCreateChannel?.();
              }}
            />
          ) : null}
          <MenuRow
            label="Invite people"
            onClick={() => {
              setIsOpen(false);
              props.onInvite();
            }}
          />
          <MenuRow
            label="Settings"
            onClick={() => {
              setIsOpen(false);
              props.onSettings();
            }}
          />
          <div className="my-1 h-px bg-amber-100" />
          <MenuRow
            label="Sign out"
            onClick={() => {
              setIsOpen(false);
              props.onSignOut();
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

function MenuRow(props: MenuRowProps) {
  return (
    <button
      className="block w-full px-3 py-2 text-left text-sm text-slate-700 transition-colors duration-75 hover:bg-amber-50"
      onClick={props.onClick}
      type="button"
    >
      {props.label}
    </button>
  );
}
