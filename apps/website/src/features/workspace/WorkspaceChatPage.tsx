import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "wouter";

import type { Editor } from "@tiptap/react";
import { tx } from "@instantdb/core";

import { ProfilePanel } from "../../components/chat/ProfilePanel";
import { ResizeHandle } from "../../components/chat/ResizeHandle";
import { ThreadPanel } from "../../components/chat/ThreadPanel";
import { Navigate } from "../../components/layout/Navigate";
import { WorkspaceShellLoading } from "../../components/layout/WorkspaceShellLoading";
import { GlobalContextMenu } from "../../components/ui/GlobalContextMenu";
import { EmojiMenu } from "../../components/ui/EmojiMenu";
import { SearchCommandMenu } from "../../components/ui/SearchCommandMenu";
import { anchorFromPoint } from "../../components/ui/floating";
import { instantDB } from "../../lib/instant";
import { useChannelDrafts } from "../../hooks/useChannelDrafts";
import { useFileUpload } from "../../hooks/useFileUpload";
import { useMentionCounts } from "../../hooks/useMentionCounts";
import { useMentionNotifications } from "../../hooks/useMentionNotifications";
import { useIsMobile } from "../../hooks/useIsMobile";
import { useMessageKeyboardNav } from "../../hooks/useMessageKeyboardNav";
import { useResizeHandle } from "../../hooks/useResizeHandle";
import { useQuackWorkspace } from "../../hooks/useQuackWorkspace";
import { useSearchMessages, type SearchResult } from "../../hooks/useSearchMessages";
import { useTypingIndicator } from "../../hooks/useTypingIndicator";
import { CallModal, useChannelCall } from "../../lib/channel-calls";
import { normalizeEmail } from "../../lib/workspaces";
import { ChannelFooter } from "./components/ChannelFooter";
import { ChannelHeader } from "./components/ChannelHeader";
import { ChannelMessageList } from "./components/ChannelMessageList";
import { DirectoryPanel } from "./components/WorkspaceDirectoryPanel";
import {
  CreateChannelModal,
  CreateWorkspaceModal,
  DeleteConfirmModal,
  EditChannelModal,
  InviteModal,
  SettingsModal,
} from "./components/WorkspaceModals";
import { SidebarContent } from "./components/WorkspaceSidebar";
import { useContextMenus } from "./hooks/useContextMenus";
import { useEmojiMenuState } from "./hooks/useEmojiMenuState";
import type {
  AuthenticatedUser,
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
  workspaceSlug: string;
}

export function WorkspaceChatPage(props: WorkspaceChatPageProps) {
  const isMobile = useIsMobile();
  const [, navigate] = useLocation();
  const channelDrafts = useChannelDrafts({
    userId: props.user.id,
    workspaceId: "",
  });
  const app = useQuackWorkspace({
    channelSlug: props.channelSlug,
    clearChannelDraft: channelDrafts.clearDraft,
    getChannelDraft: channelDrafts.getDraft,
    setChannelDraftExternal: channelDrafts.setDraft,
    user: props.user,
    workspaceSlug: props.workspaceSlug,
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
  const channelInputRef = useRef<Editor | null>(null);
  const channelScrollRef = useRef<HTMLElement>(null);
  const pendingFocusChannelIdRef = useRef<string | null>(null);
  const threadInputRef = useRef<Editor | null>(null);
  const threadScrollRef = useRef<HTMLDivElement>(null);
  const [alsoSendToChannel, setAlsoSendToChannel] = useState(false);
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [isCreateWorkspaceOpen, setIsCreateWorkspaceOpen] = useState(false);
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [pendingDeleteMessageId, setPendingDeleteMessageId] = useState<string | null>(null);
  const [pendingScrollToMessageId, setPendingScrollToMessageId] = useState<string | null>(null);
  const [pendingThreadReplyId, setPendingThreadReplyId] = useState<string | null>(null);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);

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

  const emojiMenu = useEmojiMenuState();

  const contextMenus = useContextMenus({
    activeChannelId: app.activeChannel?.id,
    callChannelId,
    canManageChannels: app.canManageChannels,
    currentUserId: props.user.id,
    isInCall,
    navigate: (to) => navigate(to),
    onDeleteChannel: (channelId) => {
      void app.deleteChannel(channelId);
    },
    onEditChannel: (channelId) => setEditingChannelId(channelId),
    onLeaveCall: () => {
      void leave();
    },
    onLeaveChannel: (channelId) => {
      void app.leaveChannel(channelId);
    },
    onOpenPrejoin: openPrejoin,
    onOpenThread: (messageId) => app.openThread(messageId),
    onSetPendingDeleteMessageId: (messageId) => setPendingDeleteMessageId(messageId),
    onStartEditMessage: (messageId) => app.startEditingMessage(messageId),
    onToggleReaction: (messageId, emoji) => {
      app.toggleReaction(messageId, emoji);
    },
    openEmojiMenu: emojiMenu.openEmojiMenu,
    visibleChannelsCount: app.visibleChannels.length,
    workspaceSlug: props.workspaceSlug,
  });

  const search = useSearchMessages({
    visibleChannels: app.visibleChannels,
    workspaceId: app.workspace?.id ?? "",
  });

  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);
  const openSearch = useCallback(() => setIsSearchOpen(true), []);
  const closeSearch = useCallback(() => setIsSearchOpen(false), []);

  const mentionMembers = useMemo(() => {
    const items: Array<{ displayName: string; id: string; imageUrl?: string }> = [];
    for (const [userId, member] of app.workspaceMembersByUserId) {
      items.push({
        displayName: member.displayName ?? member.$user?.email ?? userId,
        id: userId,
        imageUrl: member.$user?.avatar?.url ?? member.$user?.imageURL ?? undefined,
      });
    }
    return items;
  }, [app.workspaceMembersByUserId]);

  const mentionCounts = useMentionCounts({ userId: props.user.id });

  const channelNamesById = useMemo(() => {
    const map = new Map<string, string>();
    for (const channel of app.visibleChannels) {
      map.set(channel.id, channel.name);
    }
    return map;
  }, [app.visibleChannels]);

  useMentionNotifications({
    channelNamesById,
    userId: props.user.id,
  });

  const channelTyping = useTypingIndicator({
    channelId: app.activeChannel?.id ?? null,
    displayName: app.currentUserMember?.displayName ?? props.user.email ?? "Someone",
    userId: props.user.id,
  });

  const workspaceId = app.workspace?.id ?? "";
  channelDrafts.updateWorkspaceId(workspaceId);
  const threadUpload = useFileUpload({ workspaceId });

  const keyboardNav = useMessageKeyboardNav({
    activeChannelId: app.activeChannel?.id ?? null,
    canEditOrDelete: (message) => message.sender?.id === props.user.id,
    channelInputRef,
    messages: app.messages,
    onDelete: (messageId) => setPendingDeleteMessageId(messageId),
    onOpenReactionMenu: (messageId) => {
      const el = document.querySelector(`[data-message-id="${messageId}"]`);
      if (el) {
        const rect = el.getBoundingClientRect();
        emojiMenu.openEmojiMenu(anchorFromPoint(rect.right - 40, rect.top), messageId);
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
    if (app.selectedThreadMessage) {
      setProfileUserId(null);
    }
  }, [app.selectedThreadMessage]);

  useEffect(() => {
    const channelId = app.activeChannel?.id;
    if (!channelId) return;

    const count = mentionCounts.get(channelId) ?? 0;
    if (count === 0) return;

    instantDB
      .queryOnce({
        mentions: {
          $: {
            where: {
              "$user.id": props.user.id,
              channelId,
              read: false,
            },
          },
        },
      })
      .then((result) => {
        const unread = result.data?.mentions ?? [];
        if (unread.length === 0) return;
        const txs = unread.map((m) => tx.mentions[m.id].update({ read: true }));
        void instantDB.transact(txs);
      })
      .catch(() => {});
  }, [app.activeChannel?.id, mentionCounts, props.user.id]);

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
        channelInputRef.current.commands.focus();
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
  }, [app.activeChannel?.id, isMobile, closeSidebar]);

  const previousThreadIdRef = useRef<string | null>(null);

  useEffect(() => {
    const nextThreadId = app.selectedThreadMessage?.id ?? null;
    const previousThreadId = previousThreadIdRef.current;
    previousThreadIdRef.current = nextThreadId;

    if (nextThreadId && !previousThreadId) {
      requestAnimationFrame(() => threadInputRef.current?.commands.focus());
    }

    if (!nextThreadId && previousThreadId) {
      channelInputRef.current?.commands.focus();
    }
  }, [app.selectedThreadMessage?.id]);

  useEffect(() => {
    if (!app.selectedThreadMessage) return;

    function handleEscapeForThread(event: KeyboardEvent) {
      if (event.key !== "Escape") return;

      const isThreadInputFocused = threadInputRef.current?.isFocused ?? false;

      if (isThreadInputFocused) {
        threadInputRef.current?.commands.blur();
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
    if (!pendingThreadReplyId || !app.selectedThreadMessage) return;

    const allThreadMessages = [app.selectedThreadMessage, ...app.selectedThreadReplies];
    const targetExists = allThreadMessages.some((m) => m.id === pendingThreadReplyId);
    if (targetExists) {
      requestAnimationFrame(() => {
        setPendingThreadReplyId(null);
      });
    }
  }, [pendingThreadReplyId, app.selectedThreadMessage, app.selectedThreadReplies]);

  useEffect(() => {
    contextMenus.setContextMenu(null);
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
    const activeId = app.activeChannel?.id;
    if (!activeId) return;
    const uploaded = channelDrafts.hasFiles(activeId)
      ? await channelDrafts.uploadAllFiles(activeId)
      : undefined;
    app.sendChannelMessage(uploaded);
    requestAnimationFrame(() => {
      if (channelScrollRef.current) {
        channelScrollRef.current.scrollTop = 0;
      }
    });
  }

  async function handleSendThreadReply() {
    const uploaded = threadUpload.hasFiles ? await threadUpload.uploadAll() : undefined;
    app.sendThreadReply(uploaded, alsoSendToChannel);
    threadUpload.clearFiles();
    if (alsoSendToChannel) {
      requestAnimationFrame(() => {
        if (channelScrollRef.current) {
          channelScrollRef.current.scrollTop = 0;
        }
      });
    }
    requestAnimationFrame(() => {
      if (threadScrollRef.current) {
        threadScrollRef.current.scrollTop = threadScrollRef.current.scrollHeight;
      }
    });
  }

  function handleSearchSelect(result: SearchResult) {
    closeSearch();
    const targetChannel = result.channel;

    if (result.type === "channel") {
      navigate(`/workspaces/${props.workspaceSlug}/channels/${targetChannel.slug}`);
      return;
    }

    const targetMessageId = result.message.id;

    if (app.activeChannel?.id === targetChannel.id) {
      keyboardNav.handleMessageClick(targetMessageId);
    } else {
      setPendingScrollToMessageId(targetMessageId);
      navigate(`/workspaces/${props.workspaceSlug}/channels/${targetChannel.slug}`);
    }
  }

  async function handleEmojiSelect(emoji: string) {
    if (!emojiMenu.messageId) {
      return;
    }

    await app.toggleReaction(emojiMenu.messageId, emoji);
    emojiMenu.closeEmojiMenu();
  }

  function handleJumpToChannelPost(channelPostMessageId: string) {
    keyboardNav.handleMessageClick(channelPostMessageId);
  }

  function handleJumpToThreadSource(threadReplyId: string, parentMessageId: string) {
    app.openThread(parentMessageId);
    setPendingThreadReplyId(threadReplyId);
    requestAnimationFrame(() => threadInputRef.current?.commands.focus());
  }

  function handleOpenProfile(userId: string) {
    app.closeThread();
    setProfileUserId(userId);
  }

  function handleCloseProfile() {
    setProfileUserId(null);
  }

  const sidebarContentProps = {
    app,
    canManageChannels: app.canManageChannels,
    channelIdsWithDrafts: channelDrafts.channelIdsWithDrafts,
    currentUserMember: app.currentUserMember,
    isDirectoryOpen,
    memberships: props.memberships,
    mentionCounts,
    onChannelContextMenu: contextMenus.handleChannelContextMenu,
    onChannelNavigate: () => {
      setIsDirectoryOpen(false);
      closeSidebar();
    },
    onCreateChannel: () => setIsCreateChannelOpen(true),
    onCreateWorkspace: () => setIsCreateWorkspaceOpen(true),
    onInvite: () => setIsInviteOpen(true),
    onSearch: openSearch,
    onSettings: () => setIsSettingsOpen(true),
    onSignOut: () => {
      void props.onSignOut();
    },
    pendingInvites: props.pendingInvites,
    user: props.user,
    workspace,
    workspaceSlug: props.workspaceSlug,
  };

  const threadPanelProps = {
    alsoSendToChannel,
    channelName: app.activeChannel?.name ?? "channel",
    currentUser: app.usersById.get(props.user.id) ?? {
      email: props.user.email ?? undefined,
      id: props.user.id,
    },
    currentUserId: props.user.id,
    editingDraft: app.editingDraft,
    editingMessageId: app.editingMessageId,
    members: mentionMembers,
    onAddFiles: threadUpload.addFiles,
    onAlsoSendToChannelChange: setAlsoSendToChannel,
    onCancelEdit: app.cancelEditingMessage,
    onClose: app.closeThread,
    onDeleteMessage: (messageId: string) => {
      setPendingDeleteMessageId(messageId);
    },
    onEditDraftChange: app.setEditingDraft,
    onJumpToChannelPost: handleJumpToChannelPost,
    onJumpToThreadSource: handleJumpToThreadSource,
    onMessageContextMenu: contextMenus.handleThreadMessageContextMenu,
    onOpenReactionMenu: emojiMenu.openEmojiMenu,
    onRemoveFile: threadUpload.removeFile,
    onReply: () => {
      void handleSendThreadReply();
    },
    onSaveEdit: () => {
      app.saveEditingMessage();
    },
    onStartEdit: app.startEditingMessage,
    onThreadDraftChange: app.setThreadDraft,
    onToggleReaction: (messageId: string, emoji: string) => {
      app.toggleReaction(messageId, emoji);
    },
    onUserClick: handleOpenProfile,
    replies: app.selectedThreadReplies,
    rootMessage: app.selectedThreadMessage,
    selectedReplyId: pendingThreadReplyId,
    stagedFiles: threadUpload.stagedFiles,
    startThreadResize: thread.startResize,
    threadDraft: app.threadDraft,
    threadInputRef,
    threadScrollRef,
    threadWidth: thread.width,
    usersById: app.usersById,
    workspaceMembersByUserId: app.workspaceMembersByUserId,
  };

  return (
    <>
      <div className="h-[100dvh] overflow-hidden p-1.5 sm:p-2 md:p-3">
        <div className="flex h-full gap-1.5 sm:gap-2 md:gap-3">
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
            <aside
              className="relative flex min-h-0 flex-col overflow-hidden rounded-[1.45rem] border border-amber-200/60 bg-amber-50/75 shadow-[0_18px_50px_rgba(217,119,6,0.08)] select-none"
              style={{ flexShrink: 0, width: sidebar.width }}
            >
              <SidebarContent onBrowse={() => setIsDirectoryOpen(true)} {...sidebarContentProps} />
              <ResizeHandle onMouseDown={sidebar.startResize} side="right" />
            </aside>
          )}

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
              workspaceSlug={props.workspaceSlug}
            />
          ) : !app.activeChannel ? (
            <main className="flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center overflow-hidden rounded-2xl md:rounded-[1.45rem] border border-amber-200/60 bg-white/82 shadow-[0_18px_50px_rgba(15,23,42,0.07)]">
              {app.isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-300 border-t-amber-500" />
                </div>
              ) : (
                <div className="flex max-w-xs flex-col items-center text-center px-4">
                  <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200/80 shadow-[0_8px_24px_rgba(217,119,6,0.12)]">
                    <svg fill="none" height="28" viewBox="0 0 24 24" width="28">
                      <path
                        className="text-amber-500"
                        d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                      />
                    </svg>
                  </div>
                  <p className="mt-4 text-sm font-semibold text-slate-900">No channels yet</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    {app.canManageChannels
                      ? "Create a channel to get the conversation started."
                      : "Channels will appear here once an admin creates one."}
                  </p>
                  {app.canManageChannels ? (
                    <button
                      className="mt-4 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-medium text-white transition-colors duration-100 hover:bg-amber-600"
                      onClick={() => setIsCreateChannelOpen(true)}
                      type="button"
                    >
                      Create a channel
                    </button>
                  ) : null}
                </div>
              )}
            </main>
          ) : (
            <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl md:rounded-[1.45rem] border border-amber-200/60 bg-white/82 shadow-[0_18px_50px_rgba(15,23,42,0.07)]">
              <ChannelHeader
                callError={callError}
                canManageChannels={app.canManageChannels}
                channelId={app.activeChannel.id}
                channelName={app.activeChannel.name}
                channelTopic={app.activeChannel.topic}
                errorMessage={app.errorMessage}
                hasRefreshToken={Boolean(props.user.refresh_token)}
                isInCall={isInCall}
                isMobile={isMobile}
                notice={app.notice}
                onEditChannel={() => setEditingChannelId(app.activeChannel!.id)}
                onLeaveCall={() => {
                  void leave();
                }}
                onOpenPrejoin={openPrejoin}
                onOpenSidebar={() => setIsSidebarOpen(true)}
              />

              <ChannelMessageList
                activeThreadMessageId={app.selectedThreadMessage?.id}
                channelName={app.activeChannel.name}
                currentUserId={props.user.id}
                editingDraft={app.editingDraft}
                editingMessageId={app.editingMessageId}
                isMessagesLoading={app.isMessagesLoading}
                messages={app.messages}
                onCancelEdit={app.cancelEditingMessage}
                onContextMenu={contextMenus.handleMessageContextMenu}
                onDelete={(messageId) => setPendingDeleteMessageId(messageId)}
                onEditDraftChange={app.setEditingDraft}
                onJumpToThreadSource={handleJumpToThreadSource}
                onMessageClick={keyboardNav.handleMessageClick}
                onOpenReactionMenu={emojiMenu.openEmojiMenu}
                onReply={(messageId) => {
                  app.openThread(messageId);
                  requestAnimationFrame(() => threadInputRef.current?.commands.focus());
                }}
                onSaveEdit={() => {
                  app.saveEditingMessage();
                }}
                onStartEdit={(messageId) => app.startEditingMessage(messageId)}
                onToggleReaction={(messageId, emoji) => {
                  app.toggleReaction(messageId, emoji);
                }}
                onUserClick={handleOpenProfile}
                ref={channelScrollRef}
                selectedMessageId={keyboardNav.selectedMessageId}
                usersById={app.usersById}
                workspaceMembersByUserId={app.workspaceMembersByUserId}
              />

              <ChannelFooter
                activeTypers={channelTyping.activeTypers}
                channelName={app.activeChannel.name}
                draft={app.channelDraft}
                editorRef={channelInputRef}
                members={mentionMembers}
                onAddFiles={(files: FileList) => {
                  channelDrafts.addFiles(app.activeChannel!.id, files);
                }}
                onInputKeyDown={keyboardNav.handleInputKeyDown}
                onRemoveFile={(fileId: string) => {
                  channelDrafts.removeFile(app.activeChannel!.id, fileId);
                }}
                onSubmit={() => {
                  void handleSendChannelMessage();
                }}
                onTypingBlur={channelTyping.handleBlur}
                onTypingKeyDown={channelTyping.handleKeyDown}
                onValueChange={app.setChannelDraft}
                stagedFiles={channelDrafts.getStagedFiles(app.activeChannel.id)}
              />
            </main>
          )}

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
          ) : profileUserId && app.usersById.get(profileUserId) ? (
            isMobile ? (
              createPortal(
                <div className="fixed inset-0 z-30 flex flex-col bg-white">
                  <ProfilePanel
                    channels={app.visibleChannels.filter((ch) =>
                      ch.members?.some((m) => m.$user?.id === profileUserId),
                    )}
                    isMobile
                    onClose={handleCloseProfile}
                    startResize={thread.startResize}
                    user={app.usersById.get(profileUserId)!}
                    width={thread.width}
                    workspaceMember={app.workspaceMembersByUserId.get(profileUserId)}
                  />
                </div>,
                document.body,
              )
            ) : (
              <ProfilePanel
                channels={app.visibleChannels.filter((ch) =>
                  ch.members?.some((m) => m.$user?.id === profileUserId),
                )}
                onClose={handleCloseProfile}
                startResize={thread.startResize}
                user={app.usersById.get(profileUserId)!}
                width={thread.width}
                workspaceMember={app.workspaceMembersByUserId.get(profileUserId)}
              />
            )
          ) : null}
        </div>
      </div>

      <GlobalContextMenu menu={contextMenus.contextMenu} onClose={contextMenus.closeContextMenu} />
      <EmojiMenu
        anchor={emojiMenu.anchor}
        isOpen={emojiMenu.isOpen}
        onClose={emojiMenu.closeEmojiMenu}
        onSelect={(emoji) => {
          void handleEmojiSelect(emoji);
        }}
      />

      {pendingDeleteMessageId ? (
        <DeleteConfirmModal
          onClose={() => setPendingDeleteMessageId(null)}
          onConfirm={() => {
            app.deleteMessage(pendingDeleteMessageId);
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
          inviterName={app.currentUserMember?.displayName ?? props.user.email ?? "Someone"}
          isOwner={workspace.owner?.id === props.user.id}
          memberEmails={
            new Set(
              workspace.members
                ?.map((m) => m.$user?.email)
                .filter((e): e is string => Boolean(e))
                .map(normalizeEmail) ?? [],
            )
          }
          onClose={() => setIsInviteOpen(false)}
          pendingEmails={new Set(app.invites.map((invite) => normalizeEmail(invite.email)))}
          refreshToken={props.user.refresh_token}
          userId={props.user.id}
          workspaceId={workspace.id}
          workspaceName={workspace.name}
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

      {isCreateWorkspaceOpen ? (
        <CreateWorkspaceModal onClose={() => setIsCreateWorkspaceOpen(false)} user={props.user} />
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
