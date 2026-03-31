import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "wouter";

import { ResizeHandle } from "../../components/chat/ResizeHandle";
import { ThreadPanel } from "../../components/chat/ThreadPanel";
import { Navigate } from "../../components/layout/Navigate";
import { WorkspaceShellLoading } from "../../components/layout/WorkspaceShellLoading";
import { GlobalContextMenu } from "../../components/ui/GlobalContextMenu";
import { EmojiMenu } from "../../components/ui/EmojiMenu";
import { SearchCommandMenu } from "../../components/ui/SearchCommandMenu";
import { anchorFromPoint } from "../../components/ui/floating";
import { useFileUpload } from "../../hooks/useFileUpload";
import { useIsMobile } from "../../hooks/useIsMobile";
import { useMessageKeyboardNav } from "../../hooks/useMessageKeyboardNav";
import { useResizeHandle } from "../../hooks/useResizeHandle";
import { useQuackWorkspace } from "../../hooks/useQuackWorkspace";
import { useSearchMessages, type SearchResult } from "../../hooks/useSearchMessages";
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
  const app = useQuackWorkspace({
    channelSlug: props.channelSlug,
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
  const channelInputRef = useRef<HTMLTextAreaElement>(null);
  const channelScrollRef = useRef<HTMLElement>(null);
  const pendingFocusChannelIdRef = useRef<string | null>(null);
  const threadInputRef = useRef<HTMLTextAreaElement>(null);
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
      void app.toggleReaction(messageId, emoji);
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

  const workspaceId = app.workspace?.id ?? "";
  const channelUpload = useFileUpload({ workspaceId });
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
    await app.sendThreadReply(uploaded, alsoSendToChannel);
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
    requestAnimationFrame(() => threadInputRef.current?.focus());
  }

  const sidebarContentProps = {
    app,
    canManageChannels: app.canManageChannels,
    currentUserMember: app.currentUserMember,
    isDirectoryOpen,
    memberships: props.memberships,
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
      void app.saveEditingMessage();
    },
    onStartEdit: app.startEditingMessage,
    onThreadDraftChange: app.setThreadDraft,
    onToggleReaction: (messageId: string, emoji: string) => {
      void app.toggleReaction(messageId, emoji);
    },
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
          ) : (
            <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl md:rounded-[1.45rem] border border-amber-200/60 bg-white/82 shadow-[0_18px_50px_rgba(15,23,42,0.07)]">
              <ChannelHeader
                callError={callError}
                canManageChannels={app.canManageChannels}
                channelId={app.activeChannel?.id}
                channelName={app.activeChannel?.name ?? "channel"}
                channelTopic={app.activeChannel?.topic}
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
                channelName={app.activeChannel?.name ?? "channel"}
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
                  requestAnimationFrame(() => threadInputRef.current?.focus());
                }}
                onSaveEdit={() => {
                  void app.saveEditingMessage();
                }}
                onStartEdit={(messageId) => app.startEditingMessage(messageId)}
                onToggleReaction={(messageId, emoji) => {
                  void app.toggleReaction(messageId, emoji);
                }}
                ref={channelScrollRef}
                selectedMessageId={keyboardNav.selectedMessageId}
                usersById={app.usersById}
                workspaceMembersByUserId={app.workspaceMembersByUserId}
              />

              <ChannelFooter
                channelName={app.activeChannel?.name ?? "channel"}
                draft={app.channelDraft}
                onAddFiles={channelUpload.addFiles}
                onInputFocus={keyboardNav.handleInputFocus}
                onInputKeyDown={keyboardNav.handleInputKeyDown}
                onRemoveFile={channelUpload.removeFile}
                onSubmit={() => {
                  void handleSendChannelMessage();
                }}
                onValueChange={app.setChannelDraft}
                stagedFiles={channelUpload.stagedFiles}
                textareaRef={channelInputRef}
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
