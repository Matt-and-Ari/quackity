import { createWorkspaceInviteTx, type ChannelVisibility, type WorkspaceRole } from "@quack/data";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "wouter";

import clsx from "clsx";

import {
  ChannelLink,
  DeleteGlyph,
  EditGlyph,
  LeaveGlyph,
  MessageCard,
  MessageInput,
  ReactionGlyph,
  ReplyGlyph,
  ResizeHandle,
  ThreadPanel,
} from "../../components/chat/ChatPrimitives";
import { Navigate } from "../../components/layout/Navigate";
import { InputField, Notice, TextareaField } from "../../components/ui/FormFields";
import {
  GlobalContextMenu,
  type ContextMenuEntry,
  type ContextMenuState,
} from "../../components/ui/GlobalContextMenu";
import { EmojiMenu } from "../../components/ui/EmojiMenu";
import { HoverTooltip } from "../../components/ui/HoverTooltip";
import { anchorFromPoint, type FloatingAnchor } from "../../components/ui/floating";
import { useResizeHandle } from "../../hooks/useResizeHandle";
import { useQuackWorkspace } from "../../hooks/useQuackWorkspace";
import { CallModal, useChannelCall } from "../../lib/channel-calls";
import { instantDB } from "../../lib/instant";
import { normalizeEmail, parseInviteEmails } from "../../lib/workspaces";
import type {
  AuthenticatedUser,
  ChannelRecord,
  MessageRecord,
  WorkspaceMemberRecord,
} from "../../types/quack";

const serverUrl = import.meta.env.VITE_SERVER_URL ?? "http://localhost:3001";

interface WorkspaceChatPageProps {
  channelSlug?: string;
  memberships: WorkspaceMemberRecord[];
  onSignOut: () => Promise<void>;
  user: AuthenticatedUser;
  workspaceId: string;
}

export function WorkspaceChatPage(props: WorkspaceChatPageProps) {
  const app = useQuackWorkspace({
    channelSlug: props.channelSlug,
    user: props.user,
    workspaceId: props.workspaceId,
  });
  const sidebar = useResizeHandle({
    defaultWidth: 248,
    maxWidth: 360,
    minWidth: 180,
    side: "right",
  });
  const thread = useResizeHandle({
    defaultWidth: 336,
    maxWidth: 480,
    minWidth: 260,
    side: "left",
  });
  const channelInputRef = useRef<HTMLTextAreaElement>(null);
  const threadInputRef = useRef<HTMLTextAreaElement>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [emojiMenuState, setEmojiMenuState] = useState<{
    anchor: FloatingAnchor | null;
    messageId: string | null;
  }>({
    anchor: null,
    messageId: null,
  });
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const {
    dismiss: dismissCall,
    error: callError,
    isInCall,
    join,
    leave,
    meeting,
    openPrejoin,
    phase: callPhase,
  } = useChannelCall({
    channelId: app.activeChannel?.id ?? "",
    displayName: app.currentUserMember?.displayName ?? props.user.email ?? undefined,
    refreshToken: props.user.refresh_token,
    serverUrl,
  });

  useEffect(() => {
    const channelName = app.activeChannel?.name;
    document.title = channelName ? `${channelName} | Quack` : "Quack";
  }, [app.activeChannel?.name]);

  useEffect(() => {
    channelInputRef.current?.focus();
  }, [app.activeChannel?.id]);

  const previousThreadIdRef = useRef<string | null>(null);

  useEffect(() => {
    const nextThreadId = app.selectedThreadMessage?.id ?? null;
    const previousThreadId = previousThreadIdRef.current;
    previousThreadIdRef.current = nextThreadId;

    if (nextThreadId && !previousThreadId) {
      requestAnimationFrame(() => threadInputRef.current?.focus());
    }

    if (!nextThreadId && previousThreadId) {
      channelInputRef.current?.focus();
    }
  }, [app.selectedThreadMessage?.id]);

  useEffect(() => {
    setContextMenu(null);
  }, [
    app.activeChannel?.id,
    app.editingMessageId,
    app.renamingChannelId,
    app.selectedThreadMessage?.id,
  ]);

  if (app.isLoading) {
    return null;
  }

  if (!app.workspace) {
    return <Navigate to="/" />;
  }

  const workspace = app.workspace;

  if (!app.currentUserMember && workspace.owner?.id !== props.user.id) {
    return <Navigate to="/" />;
  }

  function closeContextMenu() {
    setContextMenu(null);
  }

  function closeEmojiMenu() {
    setEmojiMenuState({ anchor: null, messageId: null });
  }

  function openEmojiMenu(anchor: FloatingAnchor, messageId: string) {
    setContextMenu(null);
    setEmojiMenuState({ anchor, messageId });
  }

  async function handleEmojiSelect(emoji: string) {
    if (!emojiMenuState.messageId) {
      return;
    }

    await app.toggleReaction(emojiMenuState.messageId, emoji);
    closeEmojiMenu();
  }

  function handleChannelContextMenu(event: React.MouseEvent, channel: ChannelRecord) {
    event.preventDefault();
    closeEmojiMenu();

    const canRemoveChannel = app.visibleChannels.length > 1;
    const isPrivateMembership = channel.visibility === "private";
    const canLeaveChannel =
      canRemoveChannel &&
      isPrivateMembership &&
      Boolean(channel.members?.some((member) => member.$user?.id === props.user.id));
    const entries: ContextMenuEntry[] = [
      {
        disabled: !app.canManageChannels,
        hint: app.canManageChannels
          ? "Update the visible name and slug"
          : "Only workspace managers can rename channels",
        icon: <EditGlyph />,
        id: "rename-channel",
        label: "Rename channel",
        onSelect: () => app.startRenamingChannel(channel.id),
      },
      { id: "separator-channel-actions", type: "separator" },
      {
        disabled: !app.canManageChannels || !canRemoveChannel,
        hint: !canRemoveChannel
          ? "At least one channel must remain"
          : app.canManageChannels
            ? "Archive it from the sidebar"
            : "Only workspace managers can delete channels",
        icon: <DeleteGlyph />,
        id: "delete-channel",
        label: "Delete channel",
        onSelect: () => {
          void app.deleteChannel(channel.id);
        },
        tone: "danger",
      },
      {
        disabled: !canLeaveChannel,
        hint: !canRemoveChannel
          ? "At least one channel must remain"
          : channel.visibility === "public"
            ? "Public channels stay visible to the whole workspace"
            : "Leave this private channel",
        icon: <LeaveGlyph />,
        id: "leave-channel",
        label: "Leave channel",
        onSelect: () => {
          void app.leaveChannel(channel.id);
        },
      },
    ];

    setContextMenu({
      entries,
      subtitle: channel.visibility === "private" ? "Private channel" : "Public channel",
      title: `#${channel.name}`,
      x: event.clientX,
      y: event.clientY,
    });
  }

  function handleMessageContextMenu(event: React.MouseEvent, message: MessageRecord) {
    event.preventDefault();
    closeEmojiMenu();

    const menuX = event.clientX;
    const menuY = event.clientY;
    const threadTargetMessageId = message.parentMessage?.id ?? message.id;
    const isDeleted = Boolean(message.deletedAt);
    const entries: ContextMenuEntry[] = [
      {
        hint: message.parentMessage ? "Jump back to the thread" : "Open the conversation drawer",
        icon: <ReplyGlyph />,
        id: "reply-thread",
        label: "Reply in thread",
        onSelect: () => app.openThread(threadTargetMessageId),
      },
      {
        disabled: isDeleted,
        hint: isDeleted ? "Unavailable for deleted messages" : "Browse the full emoji menu",
        icon: <ReactionGlyph />,
        id: "add-reaction",
        label: "Add reaction",
        onSelect: () => {
          requestAnimationFrame(() => {
            openEmojiMenu(anchorFromPoint(menuX, menuY), message.id);
          });
        },
      },
      { id: "separator-message-actions", type: "separator" },
      {
        disabled: isDeleted,
        hint: isDeleted ? "Deleted messages cannot be edited" : "Open the inline editor",
        icon: <EditGlyph />,
        id: "edit-message",
        label: "Edit message",
        onSelect: () => app.startEditingMessage(message.id),
      },
      {
        disabled: isDeleted,
        hint: isDeleted
          ? "This message is already deleted"
          : "Replace the body with a deleted state",
        icon: <DeleteGlyph />,
        id: "delete-message",
        label: "Delete message",
        onSelect: () => {
          void app.deleteMessage(message.id);
        },
        tone: "danger",
      },
    ];

    setContextMenu({
      entries,
      subtitle: "Message actions",
      title: "Conversation menu",
      x: menuX,
      y: menuY,
    });
  }

  return (
    <>
      <div className="h-screen overflow-hidden p-2 sm:p-3">
        <div className="flex h-full gap-2 sm:gap-3">
          {/* ── Sidebar ── */}
          <aside
            className="relative flex min-h-0 flex-col overflow-hidden rounded-[1.45rem] border border-amber-200/60 bg-amber-50/75 shadow-[0_18px_50px_rgba(217,119,6,0.08)] select-none"
            style={{ flexShrink: 0, width: sidebar.width }}
          >
            <div className="flex items-center gap-3 border-b border-amber-200/50 px-4 py-3.5">
              <WorkspaceSwitcher
                currentWorkspaceId={workspace.id}
                memberships={props.memberships}
                workspaceName={workspace.name}
              />
              <SidebarMenuButton
                onCreateChannel={
                  app.canManageChannels ? () => setIsCreateChannelOpen(true) : undefined
                }
                onInvite={() => setIsInviteOpen(true)}
                onSignOut={() => {
                  void props.onSignOut();
                }}
              />
            </div>

            <div className="flex items-center gap-2.5 border-b border-amber-200/50 px-4 py-3">
              <span className="size-2 shrink-0 rounded-full bg-emerald-500" />
              <span className="truncate text-sm font-medium text-slate-700">
                {app.currentUserMember?.displayName ?? props.user.email ?? "You"}
              </span>
              <span className="ml-auto truncate text-xs text-slate-400">
                {app.currentUserMember?.role ?? "owner"}
              </span>
            </div>

            <nav
              aria-label="Channels"
              className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-3"
            >
              <div className="mb-1 flex items-center justify-between px-2">
                <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-slate-400">
                  Channels
                </p>
                {app.canManageChannels ? (
                  <button
                    className="flex size-5 items-center justify-center rounded-md text-slate-400 transition-colors duration-100 hover:bg-amber-100/60 hover:text-slate-600"
                    onClick={() => setIsCreateChannelOpen(true)}
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
              {app.visibleChannels.map((channel) => (
                <ChannelLink
                  channel={channel}
                  href={`/workspaces/${workspace.id}/channels/${channel.slug}`}
                  isActive={channel.id === app.activeChannel?.id}
                  isRenaming={channel.id === app.renamingChannelId}
                  key={channel.id}
                  onCancelRename={app.cancelRenamingChannel}
                  onContextMenu={handleChannelContextMenu}
                  onRenameValueChange={app.setChannelRenameDraft}
                  onSaveRename={() => {
                    void app.saveRenamingChannel();
                  }}
                  renameValue={app.channelRenameDraft}
                />
              ))}
            </nav>

            <div className="border-t border-amber-200/50 px-3 py-3">
              <p className="mb-2 px-1 text-[0.65rem] font-semibold uppercase tracking-widest text-slate-400">
                Members
              </p>
              <div className="flex flex-col gap-1">
                {app.onlineMembers.map((member) => (
                  <div
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-600"
                    key={member.id}
                  >
                    <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
                    <span className="truncate">
                      {member.displayName ?? member.$user?.email ?? member.id}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <ResizeHandle onMouseDown={sidebar.startResize} side="right" />
          </aside>

          {/* ── Main channel ── */}
          <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[1.45rem] border border-amber-200/60 bg-white/82 shadow-[0_18px_50px_rgba(15,23,42,0.07)]">
            <header className="select-none border-b border-amber-100/70 px-5 py-3.5">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                    #{app.activeChannel?.name ?? "channel"}
                  </h2>
                  {app.activeChannel?.topic ? (
                    <p className="mt-0.5 truncate text-sm text-slate-500">
                      {app.activeChannel.topic}
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center gap-1">
                  {isInCall ? (
                    <HoverTooltip content="Leave call" side="bottom">
                      <button
                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-500 transition-colors duration-100 hover:bg-rose-50"
                        onClick={() => {
                          void leave();
                        }}
                        type="button"
                      >
                        <HangUpGlyph />
                        <span>Leave</span>
                      </button>
                    </HoverTooltip>
                  ) : (
                    <HoverTooltip content="Start a call" side="bottom">
                      <button
                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 transition-colors duration-100 hover:bg-amber-50 hover:text-amber-700"
                        disabled={!app.activeChannel?.id || !props.user.refresh_token}
                        onClick={openPrejoin}
                        type="button"
                      >
                        <CallGlyph />
                        <span>Call</span>
                      </button>
                    </HoverTooltip>
                  )}
                </div>
              </div>

              {callError ? (
                <div className="mt-2">
                  <Notice message={callError} tone="error" />
                </div>
              ) : null}
              {app.notice ? (
                <div className="mt-2">
                  <Notice message={app.notice} tone="error" />
                </div>
              ) : null}
              {app.errorMessage ? (
                <div className="mt-2">
                  <Notice message={app.errorMessage} tone="error" />
                </div>
              ) : null}
            </header>

            <section className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              <div className="mx-auto flex max-w-3xl flex-col gap-1">
                {app.messages.filter((m) => !m.deletedAt).length === 0 ? (
                  <ChannelEmptyState channelName={app.activeChannel?.name ?? "channel"} />
                ) : (
                  app.messages
                    .filter((m) => !m.deletedAt)
                    .map((message) => (
                      <MessageCard
                        currentUserId={props.user.id}
                        editingDraft={app.editingDraft}
                        isActiveThread={message.id === app.selectedThreadMessage?.id}
                        isEditing={app.editingMessageId === message.id}
                        key={message.id}
                        message={message}
                        onCancelEdit={app.cancelEditingMessage}
                        onContextMenu={handleMessageContextMenu}
                        onDelete={() => {
                          void app.deleteMessage(message.id);
                        }}
                        onEditDraftChange={app.setEditingDraft}
                        onOpenReactionMenu={(anchor) => openEmojiMenu(anchor, message.id)}
                        onReply={() => app.openThread(message.id)}
                        onSaveEdit={() => {
                          void app.saveEditingMessage();
                        }}
                        onStartEdit={() => app.startEditingMessage(message.id)}
                        onToggleReaction={(emoji) => {
                          void app.toggleReaction(message.id, emoji);
                        }}
                        usersById={app.usersById}
                        workspaceMembersByUserId={app.workspaceMembersByUserId}
                      />
                    ))
                )}
              </div>
            </section>

            <footer className="border-t border-amber-100/70 px-4 py-3">
              <div className="mx-auto max-w-3xl">
                <MessageInput
                  onSubmit={() => {
                    void app.sendChannelMessage();
                  }}
                  onValueChange={app.setChannelDraft}
                  placeholder={`Message #${app.activeChannel?.name ?? "channel"}`}
                  textareaRef={channelInputRef}
                  value={app.channelDraft}
                />
              </div>
            </footer>
          </main>

          {/* ── Thread panel ── */}
          {app.selectedThreadMessage ? (
            <ThreadPanel
              currentUser={
                app.usersById.get(props.user.id) ?? {
                  email: props.user.email ?? undefined,
                  id: props.user.id,
                }
              }
              currentUserId={props.user.id}
              editingDraft={app.editingDraft}
              editingMessageId={app.editingMessageId}
              onCancelEdit={app.cancelEditingMessage}
              onClose={app.closeThread}
              onDeleteMessage={(messageId) => {
                void app.deleteMessage(messageId);
              }}
              onEditDraftChange={app.setEditingDraft}
              onMessageContextMenu={handleMessageContextMenu}
              onReply={() => {
                void app.sendThreadReply();
              }}
              onSaveEdit={() => {
                void app.saveEditingMessage();
              }}
              onStartEdit={app.startEditingMessage}
              onThreadDraftChange={app.setThreadDraft}
              onToggleReaction={(messageId, emoji) => {
                void app.toggleReaction(messageId, emoji);
              }}
              replies={app.selectedThreadReplies}
              rootMessage={app.selectedThreadMessage}
              startThreadResize={thread.startResize}
              threadDraft={app.threadDraft}
              threadInputRef={threadInputRef}
              threadWidth={thread.width}
              usersById={app.usersById}
              workspaceMembersByUserId={app.workspaceMembersByUserId}
            />
          ) : null}
        </div>
      </div>

      <GlobalContextMenu menu={contextMenu} onClose={closeContextMenu} />
      <EmojiMenu
        anchor={emojiMenuState.anchor}
        isOpen={emojiMenuState.messageId !== null}
        onClose={closeEmojiMenu}
        onSelect={(emoji) => {
          void handleEmojiSelect(emoji);
        }}
      />

      {isCreateChannelOpen ? (
        <CreateChannelModal
          canManageChannels={app.canManageChannels}
          onClose={() => setIsCreateChannelOpen(false)}
          onCreateChannel={app.createChannel}
        />
      ) : null}

      {isInviteOpen ? (
        <InviteModal
          isOwner={workspace.owner?.id === props.user.id}
          onClose={() => setIsInviteOpen(false)}
          pendingEmails={new Set(app.invites.map((invite) => normalizeEmail(invite.email)))}
          memberEmails={
            new Set(
              workspace.members
                ?.map((m) => m.$user?.email)
                .filter((e): e is string => Boolean(e))
                .map(normalizeEmail) ?? [],
            )
          }
          workspaceId={workspace.id}
          userId={props.user.id}
        />
      ) : null}

      <CallModal
        channelName={app.activeChannel?.name ?? "channel"}
        displayName={app.currentUserMember?.displayName ?? props.user.email ?? "You"}
        error={callError}
        meeting={meeting}
        onDismiss={dismissCall}
        onJoin={() => {
          void join();
        }}
        onLeave={() => {
          void leave();
        }}
        phase={callPhase}
      />
    </>
  );
}

/* ── Workspace switcher ── */

function getWorkspaceInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "W";
}

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

function getWorkspaceGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  const pair = WORKSPACE_GRADIENT_PAIRS[Math.abs(hash) % WORKSPACE_GRADIENT_PAIRS.length];
  return `${pair[0]} ${pair[1]}`;
}

interface WorkspaceSwitcherProps {
  currentWorkspaceId: string;
  memberships: WorkspaceMemberRecord[];
  workspaceName: string;
}

function WorkspaceSwitcher(props: WorkspaceSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();
  const [dropdownPos, setDropdownPos] = useState({ left: 0, top: 0 });

  const otherWorkspaces = props.memberships.filter(
    (m) => m.workspace?.id && m.workspace.id !== props.currentWorkspaceId,
  );
  const hasMultiple = otherWorkspaces.length > 0;

  useEffect(() => {
    if (!isOpen) return;

    function updatePosition() {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({ left: rect.left, top: rect.bottom + 6 });
    }

    updatePosition();

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
          if (hasMultiple) setIsOpen((v) => !v);
        }}
        type="button"
      >
        <div
          className={clsx(
            "flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-bold text-white shadow-sm",
            getWorkspaceGradient(props.workspaceName),
          )}
        >
          {getWorkspaceInitial(props.workspaceName)}
        </div>
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

      {isOpen
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
                  isActive
                  label={props.workspaceName}
                  onClick={() => setIsOpen(false)}
                />

                {otherWorkspaces.map((membership) => {
                  const ws = membership.workspace;
                  if (!ws) return null;
                  return (
                    <WorkspaceSwitcherItem
                      gradient={getWorkspaceGradient(ws.name)}
                      isActive={false}
                      key={ws.id}
                      label={ws.name}
                      onClick={() => {
                        setIsOpen(false);
                        navigate(`/workspaces/${ws.id}`);
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

interface WorkspaceSwitcherItemProps {
  gradient: string;
  isActive: boolean;
  label: string;
  onClick: () => void;
  role?: string;
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
      <div
        className={clsx(
          "flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-xs font-bold text-white shadow-sm",
          props.gradient,
        )}
      >
        {getWorkspaceInitial(props.label)}
      </div>
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

/* ── Sidebar action menu ── */

function SidebarMenuButton(props: {
  onCreateChannel?: () => void;
  onInvite: () => void;
  onSignOut: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

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
        onClick={() => setIsOpen((v) => !v)}
        type="button"
      >
        <svg fill="none" height="16" viewBox="0 0 16 16" width="16">
          <circle cx="8" cy="3" fill="currentColor" r="1.2" />
          <circle cx="8" cy="8" fill="currentColor" r="1.2" />
          <circle cx="8" cy="13" fill="currentColor" r="1.2" />
        </svg>
      </button>

      {isOpen ? (
        <div className="absolute top-full right-0 z-30 mt-1 w-44 overflow-hidden rounded-xl border border-amber-200/80 bg-white/95 py-1 shadow-[0_12px_32px_rgba(15,23,42,0.12)] backdrop-blur-xl">
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

function MenuRow(props: { label: string; onClick: () => void }) {
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

/* ── Modals ── */

function CreateChannelModal(props: {
  canManageChannels: boolean;
  onClose: () => void;
  onCreateChannel: (input: {
    name: string;
    topic?: string;
    visibility: ChannelVisibility;
  }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [visibility, setVisibility] = useState<ChannelVisibility>("public");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await props.onCreateChannel({ name, topic, visibility });
      props.onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ActionModal onClose={props.onClose} title="New channel">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <InputField label="Name" onChange={setName} placeholder="design-crit" value={name} />
        <InputField label="Topic" onChange={setTopic} placeholder="Optional topic" value={topic} />
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-600">Visibility</span>
          <select
            className="w-full rounded-xl border border-amber-200/80 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-amber-400"
            onChange={(event) => setVisibility(event.target.value as ChannelVisibility)}
            value={visibility}
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </label>
        <div className="flex gap-2 pt-1">
          <button
            className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-medium text-white transition-colors duration-100 hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting || !name.trim()}
            type="submit"
          >
            {isSubmitting ? "Creating..." : "Create"}
          </button>
          <button
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors duration-100 hover:bg-slate-100"
            onClick={props.onClose}
            type="button"
          >
            Cancel
          </button>
        </div>
      </form>
    </ActionModal>
  );
}

function InviteModal(props: {
  isOwner: boolean;
  memberEmails: Set<string>;
  onClose: () => void;
  pendingEmails: Set<string>;
  userId: string;
  workspaceId: string;
}) {
  const [emails, setEmails] = useState("");
  const [role, setRole] = useState<WorkspaceRole>("member");
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedEmails = parseInviteEmails(emails).filter(
      (email) => !props.memberEmails.has(email) && !props.pendingEmails.has(email),
    );

    if (!parsedEmails.length) {
      setNotice("Add at least one new email not already a member or pending invite.");
      return;
    }

    setNotice(null);
    setIsSubmitting(true);

    try {
      const txs = parsedEmails.map(
        (email) =>
          createWorkspaceInviteTx({
            email,
            invitedById: props.userId,
            role,
            workspaceId: props.workspaceId,
          }).tx,
      );

      await instantDB.transact(txs);
      props.onClose();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not send invites.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ActionModal onClose={props.onClose} title="Invite teammates">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <TextareaField
          label="Emails"
          onChange={setEmails}
          placeholder={"sam@quack.chat\npat@quack.chat"}
          value={emails}
        />
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-600">Role</span>
          <select
            className="w-full rounded-xl border border-amber-200/80 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-amber-400"
            onChange={(event) => setRole(coerceWorkspaceRole(event.target.value))}
            value={role}
          >
            {props.isOwner ? <option value="admin">Admin</option> : null}
            <option value="member">Member</option>
            <option value="guest">Guest</option>
          </select>
        </label>
        {notice ? <Notice message={notice} tone="error" /> : null}
        <div className="flex gap-2 pt-1">
          <button
            className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-medium text-white transition-colors duration-100 hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting || !emails.trim()}
            type="submit"
          >
            {isSubmitting ? "Sending..." : "Send invites"}
          </button>
          <button
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors duration-100 hover:bg-slate-100"
            onClick={props.onClose}
            type="button"
          >
            Cancel
          </button>
        </div>
      </form>
    </ActionModal>
  );
}

function ActionModal(props: { children: ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/20 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-amber-200/80 bg-white p-5 shadow-[0_30px_80px_rgba(15,23,42,0.14)]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">{props.title}</h3>
          <button
            className="rounded-md px-2 py-1 text-xs text-slate-500 transition-colors duration-100 hover:bg-slate-100"
            onClick={props.onClose}
            type="button"
          >
            Close
          </button>
        </div>
        {props.children}
      </div>
    </div>
  );
}

/* ── Small glyphs ── */

function CallGlyph() {
  return (
    <svg fill="none" height="16" viewBox="0 0 16 16" width="16">
      <path
        d="M5.4 2.8A1.2 1.2 0 0 1 6.6 2h2.8a1.2 1.2 0 0 1 1.2 1.2V3a.8.8 0 0 1-.8.8H6.2a.8.8 0 0 1-.8-.8v-.2ZM3.5 6a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v6.5a1.5 1.5 0 0 1-1.5 1.5h-6A1.5 1.5 0 0 1 3.5 12.5V6Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.2"
      />
    </svg>
  );
}

function HangUpGlyph() {
  return (
    <svg fill="none" height="16" viewBox="0 0 16 16" width="16">
      <path
        d="M2 8c0-.5.8-3 6-3s6 2.5 6 3v1.5a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V8.5m-4 0V9.5a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V8Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.2"
      />
    </svg>
  );
}

function ChannelEmptyState(props: { channelName: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-20 select-none">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200/80 shadow-[0_8px_24px_rgba(217,119,6,0.12)]">
        <svg fill="none" height="28" viewBox="0 0 24 24" width="28">
          <path
            d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            className="text-amber-500"
          />
          <path
            d="M8 10h.01M12 10h.01M16 10h.01"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2"
            className="text-amber-400"
          />
        </svg>
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-900">Welcome to #{props.channelName}</p>
      <p className="mt-1 max-w-xs text-center text-xs leading-5 text-slate-400">
        This is the very beginning of the channel. Send a message to start the conversation.
      </p>
    </div>
  );
}

function coerceWorkspaceRole(value: string): WorkspaceRole {
  if (value === "admin" || value === "guest") {
    return value;
  }

  return "member";
}
