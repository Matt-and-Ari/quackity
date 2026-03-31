import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "wouter";

import {
  CopyGlyph,
  DateHeading,
  DeleteGlyph,
  EditGlyph,
  LeaveGlyph,
  MessageCard,
  MessageInput,
  ReactionGlyph,
  ReplyGlyph,
  ResizeHandle,
  ThreadPanel,
  dateDayKey,
} from "../../components/chat/ChatPrimitives";
import { Navigate } from "../../components/layout/Navigate";
import { WorkspaceShellLoading } from "../../components/layout/WorkspaceShellLoading";
import { Notice } from "../../components/ui/FormFields";
import {
  GlobalContextMenu,
  type ContextMenuEntry,
  type ContextMenuState,
} from "../../components/ui/GlobalContextMenu";
import { EmojiMenu } from "../../components/ui/EmojiMenu";
import { HoverTooltip } from "../../components/ui/HoverTooltip";
import { SearchCommandMenu } from "../../components/ui/SearchCommandMenu";
import { anchorFromPoint, type FloatingAnchor } from "../../components/ui/floating";
import { useFileUpload } from "../../hooks/useFileUpload";
import { useIsMobile } from "../../hooks/useIsMobile";
import { useMessageKeyboardNav } from "../../hooks/useMessageKeyboardNav";
import { useResizeHandle } from "../../hooks/useResizeHandle";
import { useQuackWorkspace } from "../../hooks/useQuackWorkspace";
import { useSearchMessages, type SearchResult } from "../../hooks/useSearchMessages";
import { CallModal, useChannelCall } from "../../lib/channel-calls";
import { normalizeEmail } from "../../lib/workspaces";
import { DirectoryPanel } from "./components/WorkspaceDirectoryPanel";
import {
  CallGlyph,
  ChannelEmptyState,
  HamburgerGlyph,
  HangUpGlyph,
  KebabGlyph,
} from "./components/WorkspaceGlyphs";
import {
  CreateChannelModal,
  DeleteConfirmModal,
  EditChannelModal,
  InviteModal,
  SettingsModal,
} from "./components/WorkspaceModals";
import { SidebarContent } from "./components/WorkspaceSidebar";
import type {
  AuthenticatedUser,
  ChannelRecord,
  MessageRecord,
  WorkspaceInviteRecord,
  WorkspaceMemberRecord,
} from "../../types/quack";

const serverUrl = import.meta.env.VITE_SERVER_URL ?? "http://localhost:3001";

interface WorkspaceChatPageProps {
  channelSlug?: string;
  memberships: WorkspaceMemberRecord[];
  onSignOut: () => Promise<void>;
  pendingInvites: WorkspaceInviteRecord[];
  user: AuthenticatedUser;
  workspaceId: string;
}

export function WorkspaceChatPage(props: WorkspaceChatPageProps) {
  const isMobile = useIsMobile();
  const [, navigate] = useLocation();
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
  const channelScrollRef = useRef<HTMLElement>(null);
  const pendingFocusChannelIdRef = useRef<string | null>(null);
  const threadInputRef = useRef<HTMLTextAreaElement>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [emojiMenuState, setEmojiMenuState] = useState<{
    anchor: FloatingAnchor | null;
    messageId: string | null;
  }>({
    anchor: null,
    messageId: null,
  });
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [pendingDeleteMessageId, setPendingDeleteMessageId] = useState<string | null>(null);
  const [pendingScrollToMessageId, setPendingScrollToMessageId] = useState<string | null>(null);

  const {
    dismiss: dismissCall,
    error: callError,
    isInCall,
    leave,
    meeting,
    openPrejoin,
    phase: callPhase,
    session: callSession,
  } = useChannelCall({
    channelId: app.activeChannel?.id ?? "",
    displayName: app.currentUserMember?.displayName ?? props.user.email ?? undefined,
    refreshToken: props.user.refresh_token,
    serverUrl,
  });

  const callChannelId = callSession?.channelId ?? null;

  const search = useSearchMessages({
    visibleChannels: app.visibleChannels,
    workspaceId: props.workspaceId,
  });

  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);
  const openSearch = useCallback(() => setIsSearchOpen(true), []);
  const closeSearch = useCallback(() => setIsSearchOpen(false), []);

  const channelUpload = useFileUpload({ workspaceId: props.workspaceId });
  const threadUpload = useFileUpload({ workspaceId: props.workspaceId });

  function isOwnMessage(message: MessageRecord) {
    return message.sender?.id === props.user.id;
  }

  const keyboardNav = useMessageKeyboardNav({
    activeChannelId: app.activeChannel?.id ?? null,
    canEditOrDelete: isOwnMessage,
    channelInputRef,
    messages: app.messages,
    onDelete: (messageId) => setPendingDeleteMessageId(messageId),
    onOpenReactionMenu: (messageId) => {
      const el = document.querySelector(`[data-message-id="${messageId}"]`);
      if (el) {
        const rect = el.getBoundingClientRect();
        openEmojiMenu(anchorFromPoint(rect.right - 40, rect.top), messageId);
      }
    },
    onReply: (messageId) => app.openThread(messageId),
    onStartEdit: (messageId) => app.startEditingMessage(messageId),
  });

  useEffect(() => {
    const channelName = app.activeChannel?.name;
    document.title = channelName ? `${channelName} | Quackity` : "Quackity";
  }, [app.activeChannel?.name]);

  useEffect(() => {
    function handleGlobalKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    }

    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    if (!pendingScrollToMessageId || !app.messages.length) return;

    const messageExists = app.messages.some((m) => m.id === pendingScrollToMessageId);
    if (messageExists) {
      keyboardNav.handleMessageClick(pendingScrollToMessageId);
      setPendingScrollToMessageId(null);
    }
  }, [pendingScrollToMessageId, app.messages]);

  useEffect(() => {
    if (!app.activeChannel?.id) return;
    pendingFocusChannelIdRef.current = app.activeChannel.id;

    let attempts = 0;
    const maxAttempts = 10;

    function tryFocus() {
      if (pendingFocusChannelIdRef.current !== app.activeChannel?.id) return;
      if (channelInputRef.current) {
        channelInputRef.current.focus();
        pendingFocusChannelIdRef.current = null;
        return;
      }
      attempts++;
      if (attempts < maxAttempts) {
        requestAnimationFrame(tryFocus);
      }
    }

    requestAnimationFrame(tryFocus);
    if (isMobile) closeSidebar();
    setIsDirectoryOpen(false);
    channelUpload.clearFiles();
  }, [app.activeChannel?.id, isMobile, closeSidebar]);

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
    if (!app.selectedThreadMessage) return;

    function handleEscapeForThread(event: KeyboardEvent) {
      if (event.key !== "Escape") return;

      const isThreadInputFocused = document.activeElement === threadInputRef.current;

      if (isThreadInputFocused) {
        threadInputRef.current?.blur();
        event.preventDefault();
        return;
      }

      const target = event.target as HTMLElement;
      const isInInput =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      if (isInInput) return;

      event.preventDefault();
      app.closeThread();
    }

    document.addEventListener("keydown", handleEscapeForThread);
    return () => document.removeEventListener("keydown", handleEscapeForThread);
  }, [app.selectedThreadMessage, app.closeThread]);

  useEffect(() => {
    setContextMenu(null);
  }, [
    app.activeChannel?.id,
    app.editingMessageId,
    app.renamingChannelId,
    app.selectedThreadMessage?.id,
  ]);

  if (app.isLoading) {
    return <WorkspaceShellLoading />;
  }

  if (!app.workspace) {
    return <Navigate to="/" />;
  }

  const workspace = app.workspace;

  if (!app.currentUserMember && workspace.owner?.id !== props.user.id) {
    return <Navigate to="/" />;
  }

  async function handleSendChannelMessage() {
    const uploaded = channelUpload.hasFiles ? await channelUpload.uploadAll() : undefined;
    await app.sendChannelMessage(uploaded);
    channelUpload.clearFiles();
    requestAnimationFrame(() => {
      if (channelScrollRef.current) {
        channelScrollRef.current.scrollTop = 0;
      }
    });
  }

  async function handleSendThreadReply() {
    const uploaded = threadUpload.hasFiles ? await threadUpload.uploadAll() : undefined;
    await app.sendThreadReply(uploaded);
    threadUpload.clearFiles();
  }

  function handleSearchSelect(result: SearchResult) {
    closeSearch();
    const targetChannel = result.channel;
    const targetMessageId = result.message.id;

    if (app.activeChannel?.id === targetChannel.id) {
      keyboardNav.handleMessageClick(targetMessageId);
    } else {
      setPendingScrollToMessageId(targetMessageId);
      navigate(`/workspaces/${props.workspaceId}/channels/${targetChannel.slug}`);
    }
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
    const hasMembership = Boolean(
      channel.members?.some((member) => member.$user?.id === props.user.id),
    );
    const canLeaveChannel = canRemoveChannel && hasMembership;

    const isInCallOnThisChannel = isInCall && callChannelId === channel.id;

    const entries: ContextMenuEntry[] = [];

    if (!isInCall) {
      entries.push({
        disabled: !channel.id || !props.user.refresh_token,
        hint: "Start a new call in this channel",
        icon: <CallGlyph />,
        id: "start-call",
        label: "Start call",
        onSelect: () => {
          if (channel.id !== app.activeChannel?.id) {
            navigate(`/workspaces/${props.workspaceId}/channels/${channel.slug}`);
          }
          requestAnimationFrame(() => openPrejoin());
        },
      });
    }

    if (isInCallOnThisChannel) {
      entries.push({
        disabled: false,
        hint: "Leave the active call",
        icon: <HangUpGlyph />,
        id: "leave-call",
        label: "Leave call",
        onSelect: () => {
          void leave();
        },
        tone: "danger",
      });
    }

    if (entries.length > 0) {
      entries.push({ id: "separator-call-actions", type: "separator" });
    }

    entries.push(
      {
        disabled: !app.canManageChannels,
        hint: app.canManageChannels
          ? "Edit name, topic, and visibility"
          : "Only workspace managers can edit channels",
        icon: <EditGlyph />,
        id: "edit-channel",
        label: "Edit channel",
        onSelect: () => setEditingChannelId(channel.id),
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
          : !hasMembership
            ? "You are not a member of this channel"
            : "Remove this channel from your sidebar",
        icon: <LeaveGlyph />,
        id: "leave-channel",
        label: "Leave channel",
        onSelect: () => {
          void app.leaveChannel(channel.id);
        },
      },
    );

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
    const isOwn = isOwnMessage(message);
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
      {
        disabled: isDeleted || !message.body,
        hint: isDeleted ? "Unavailable for deleted messages" : "Copy the message text",
        icon: <CopyGlyph />,
        id: "copy-text",
        label: "Copy text",
        onSelect: () => {
          if (message.body) {
            void navigator.clipboard.writeText(message.body);
          }
        },
      },
    ];

    if (isOwn) {
      entries.push(
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
          onSelect: () => setPendingDeleteMessageId(message.id),
          tone: "danger",
        },
      );
    }

    setContextMenu({
      entries,
      subtitle: "Message actions",
      title: "Conversation menu",
      x: menuX,
      y: menuY,
    });
  }

  const sidebarContentProps = {
    app,
    canManageChannels: app.canManageChannels,
    currentUserMember: app.currentUserMember,
    isDirectoryOpen,
    memberships: props.memberships,
    onChannelContextMenu: handleChannelContextMenu,
    onChannelNavigate: () => {
      setIsDirectoryOpen(false);
      closeSidebar();
    },
    onCreateChannel: () => setIsCreateChannelOpen(true),
    onInvite: () => setIsInviteOpen(true),
    onSearch: openSearch,
    onSettings: () => setIsSettingsOpen(true),
    onSignOut: () => {
      void props.onSignOut();
    },
    pendingInvites: props.pendingInvites,
    user: props.user,
    workspace,
    workspaceId: workspace.id,
  };

  const threadCurrentUser = app.usersById.get(props.user.id) ?? {
    email: props.user.email ?? undefined,
    id: props.user.id,
  };

  const threadPanelProps = {
    currentUser: threadCurrentUser,
    currentUserId: props.user.id,
    editingDraft: app.editingDraft,
    editingMessageId: app.editingMessageId,
    onAddFiles: threadUpload.addFiles,
    onCancelEdit: app.cancelEditingMessage,
    onClose: app.closeThread,
    onDeleteMessage: (messageId: string) => {
      setPendingDeleteMessageId(messageId);
    },
    onEditDraftChange: app.setEditingDraft,
    onMessageContextMenu: handleMessageContextMenu,
    onRemoveFile: threadUpload.removeFile,
    onReply: () => {
      void handleSendThreadReply();
    },
    onSaveEdit: () => {
      void app.saveEditingMessage();
    },
    onStartEdit: app.startEditingMessage,
    onThreadDraftChange: app.setThreadDraft,
    onToggleReaction: (messageId: string, emoji: string) => {
      void app.toggleReaction(messageId, emoji);
    },
    replies: app.selectedThreadReplies,
    rootMessage: app.selectedThreadMessage,
    stagedFiles: threadUpload.stagedFiles,
    startThreadResize: thread.startResize,
    threadDraft: app.threadDraft,
    threadInputRef,
    threadWidth: thread.width,
    usersById: app.usersById,
    workspaceMembersByUserId: app.workspaceMembersByUserId,
  };

  return (
    <>
      <div className="h-[100dvh] overflow-hidden p-1.5 sm:p-2 md:p-3">
        <div className="flex h-full gap-1.5 sm:gap-2 md:gap-3">
          {/* ── Mobile sidebar overlay ── */}
          {isMobile ? (
            <>
              {isSidebarOpen
                ? createPortal(
                    <div className="fixed inset-0 z-30">
                      <div
                        className="absolute inset-0 bg-slate-950/30 backdrop-blur-sm"
                        onClick={closeSidebar}
                      />
                      <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col overflow-hidden rounded-r-2xl bg-amber-50/95 shadow-[4px_0_30px_rgba(15,23,42,0.14)] backdrop-blur-xl">
                        <SidebarContent
                          onBrowse={() => {
                            setIsDirectoryOpen(true);
                            closeSidebar();
                          }}
                          onClose={closeSidebar}
                          {...sidebarContentProps}
                        />
                      </aside>
                    </div>,
                    document.body,
                  )
                : null}
            </>
          ) : (
            /* ── Desktop sidebar ── */
            <aside
              className="relative flex min-h-0 flex-col overflow-hidden rounded-[1.45rem] border border-amber-200/60 bg-amber-50/75 shadow-[0_18px_50px_rgba(217,119,6,0.08)] select-none"
              style={{ flexShrink: 0, width: sidebar.width }}
            >
              <SidebarContent onBrowse={() => setIsDirectoryOpen(true)} {...sidebarContentProps} />
              <ResizeHandle onMouseDown={sidebar.startResize} side="right" />
            </aside>
          )}

          {/* ── Main area ── */}
          {isDirectoryOpen ? (
            <DirectoryPanel
              allChannels={[...app.visibleChannels, ...app.unjoinedChannels]}
              canManageChannels={app.canManageChannels}
              currentUserId={props.user.id}
              members={app.allWorkspaceMembers}
              onClose={() => setIsDirectoryOpen(false)}
              onJoinChannel={(channelId) => {
                void app.joinChannel(channelId);
              }}
              onLeaveChannel={(channelId) => {
                void app.leaveChannel(channelId);
              }}
              visibleChannelIds={new Set(app.visibleChannels.map((c) => c.id))}
              workspaceId={props.workspaceId}
            />
          ) : (
            <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl md:rounded-[1.45rem] border border-amber-200/60 bg-white/82 shadow-[0_18px_50px_rgba(15,23,42,0.07)]">
              <header className="select-none border-b border-amber-100/70 px-3 py-2.5 sm:px-5 sm:py-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    {isMobile ? (
                      <button
                        className="flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors duration-100 hover:bg-amber-50 hover:text-slate-700"
                        onClick={() => setIsSidebarOpen(true)}
                        type="button"
                      >
                        <HamburgerGlyph />
                      </button>
                    ) : null}
                    <div className="flex min-w-0 items-baseline gap-2">
                      <h2 className="shrink-0 truncate text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
                        {app.activeChannel?.name ?? "channel"}
                      </h2>
                      {app.activeChannel?.topic && !isMobile ? (
                        <p className="min-w-0 truncate text-sm text-slate-400">
                          {app.activeChannel.topic}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
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
                          <span className="hidden sm:inline">Leave</span>
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
                          <span className="hidden sm:inline">Call</span>
                        </button>
                      </HoverTooltip>
                    )}
                    {app.canManageChannels && app.activeChannel ? (
                      <HoverTooltip content="Channel settings" side="bottom">
                        <button
                          className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition-colors duration-100 hover:bg-amber-50 hover:text-slate-600"
                          onClick={() => setEditingChannelId(app.activeChannel!.id)}
                          type="button"
                        >
                          <KebabGlyph />
                        </button>
                      </HoverTooltip>
                    ) : null}
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

              <section
                ref={channelScrollRef}
                className="min-h-0 flex-1 overflow-y-auto flex flex-col-reverse px-2 py-3 sm:px-4 sm:py-4"
              >
                {app.isMessagesLoading ? (
                  <div className="flex flex-1 items-center justify-center py-12">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-300 border-t-amber-500" />
                  </div>
                ) : app.messages.filter((m) => !m.deletedAt).length === 0 ? (
                  <ChannelEmptyState channelName={app.activeChannel?.name ?? "channel"} />
                ) : (
                  <div className="flex flex-col gap-1">
                    {app.messages
                      .filter((m) => !m.deletedAt)
                      .map((message, index, filtered) => {
                        const prevMessage = index > 0 ? filtered[index - 1] : null;
                        const showDateHeading =
                          !prevMessage ||
                          dateDayKey(message.createdAt) !== dateDayKey(prevMessage.createdAt);

                        return (
                          <div key={message.id}>
                            {showDateHeading ? <DateHeading timestamp={message.createdAt} /> : null}
                            <MessageCard
                              currentUserId={props.user.id}
                              editingDraft={app.editingDraft}
                              isActiveThread={message.id === app.selectedThreadMessage?.id}
                              isEditing={app.editingMessageId === message.id}
                              isOwnMessage={isOwnMessage(message)}
                              isSelected={keyboardNav.selectedMessageId === message.id}
                              message={message}
                              onCancelEdit={app.cancelEditingMessage}
                              onClick={() => keyboardNav.handleMessageClick(message.id)}
                              onContextMenu={handleMessageContextMenu}
                              onDelete={() => setPendingDeleteMessageId(message.id)}
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
                          </div>
                        );
                      })}
                  </div>
                )}
              </section>

              <footer className="border-t border-amber-100/70 px-2 py-2 sm:px-4 sm:py-3">
                <div>
                  <MessageInput
                    onAddFiles={channelUpload.addFiles}
                    onFocus={keyboardNav.handleInputFocus}
                    onKeyDown={keyboardNav.handleInputKeyDown}
                    onRemoveFile={channelUpload.removeFile}
                    onSubmit={() => {
                      void handleSendChannelMessage();
                    }}
                    onValueChange={app.setChannelDraft}
                    placeholder={`Message #${app.activeChannel?.name ?? "channel"}`}
                    stagedFiles={channelUpload.stagedFiles}
                    textareaRef={channelInputRef}
                    value={app.channelDraft}
                  />
                </div>
              </footer>
            </main>
          )}

          {/* ── Thread panel ── */}
          {app.selectedThreadMessage ? (
            isMobile ? (
              createPortal(
                <div className="fixed inset-0 z-30 flex flex-col bg-white">
                  <ThreadPanel {...threadPanelProps} isMobile />
                </div>,
                document.body,
              )
            ) : (
              <ThreadPanel {...threadPanelProps} />
            )
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

      {pendingDeleteMessageId ? (
        <DeleteConfirmModal
          onClose={() => setPendingDeleteMessageId(null)}
          onConfirm={() => {
            void app.deleteMessage(pendingDeleteMessageId);
            setPendingDeleteMessageId(null);
            keyboardNav.clearSelection();
          }}
        />
      ) : null}

      {isCreateChannelOpen ? (
        <CreateChannelModal
          onClose={() => setIsCreateChannelOpen(false)}
          onCreateChannel={app.createChannel}
        />
      ) : null}

      {editingChannelId ? (
        <EditChannelModal
          channel={app.visibleChannels.find((c) => c.id === editingChannelId) ?? null}
          onClose={() => setEditingChannelId(null)}
          onSave={async (input) => {
            await app.updateChannel(editingChannelId, input);
            setEditingChannelId(null);
          }}
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

      <CallModal error={callError} meeting={meeting} onDismiss={dismissCall} phase={callPhase} />

      {isSettingsOpen ? (
        <SettingsModal
          currentUserMember={app.currentUserMember}
          invites={app.invites}
          onClose={() => setIsSettingsOpen(false)}
          user={props.user}
          workspace={workspace}
        />
      ) : null}

      <SearchCommandMenu
        isOpen={isSearchOpen}
        onClose={closeSearch}
        onSelectResult={handleSearchSelect}
        search={search}
      />
    </>
  );
}
