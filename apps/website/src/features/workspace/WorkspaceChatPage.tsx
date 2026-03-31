import { createPortal } from "react-dom";
import { useLocation } from "wouter";

import { ProfilePanel } from "../../components/chat/ProfilePanel";
import { ResizeHandle } from "../../components/chat/ResizeHandle";
import { ThreadPanel } from "../../components/chat/ThreadPanel";
import { Navigate } from "../../components/layout/Navigate";
import { WorkspaceShellLoading } from "../../components/layout/WorkspaceShellLoading";
import { GlobalContextMenu } from "../../components/ui/GlobalContextMenu";
import { EmojiMenu } from "../../components/ui/EmojiMenu";
import { SearchCommandMenu } from "../../components/ui/SearchCommandMenu";
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
import { DmEmptyState } from "./components/WorkspaceGlyphs";
import { SidebarContent } from "./components/WorkspaceSidebar";
import { CallModal } from "../../lib/channel-calls";
import { useWorkspaceChatEffects } from "./hooks/useWorkspaceChatEffects";
import type {
  AuthenticatedUser,
  WorkspaceInviteRecord,
  WorkspaceMemberRecord,
} from "../../types/quack";
import type { SearchResult } from "../../hooks/useSearchMessages";

interface WorkspaceChatPageProps {
  channelSlug?: string;
  memberships: WorkspaceMemberRecord[];
  onSignOut: () => Promise<void>;
  pendingInvites: WorkspaceInviteRecord[];
  user: AuthenticatedUser;
  workspaceSlug: string;
}

export function WorkspaceChatPage(props: WorkspaceChatPageProps) {
  const [, navigate] = useLocation();

  const state = useWorkspaceChatEffects({
    channelSlug: props.channelSlug,
    navigate,
    user: props.user,
    workspaceSlug: props.workspaceSlug,
  });

  if (state.app.isLoading) {
    return <WorkspaceShellLoading />;
  }

  if (!state.app.workspace) {
    return <Navigate to="/" />;
  }

  const workspace = state.app.workspace;

  if (!state.app.currentUserMember && workspace.owner?.id !== props.user.id) {
    return <Navigate to="/" />;
  }

  async function handleSendChannelMessage() {
    const activeId = state.app.activeChannel?.id;
    if (!activeId) return;
    const uploaded = state.channelDrafts.hasFiles(activeId)
      ? await state.channelDrafts.uploadAllFiles(activeId)
      : undefined;
    state.app.sendChannelMessage(uploaded);
    requestAnimationFrame(() => {
      if (state.channelScrollRef.current) {
        state.channelScrollRef.current.scrollTop = 0;
      }
    });
  }

  async function handleSendThreadReply() {
    const uploaded = state.threadUpload.hasFiles ? await state.threadUpload.uploadAll() : undefined;
    state.app.sendThreadReply(uploaded, state.alsoSendToChannel);
    state.threadUpload.clearFiles();
    if (state.alsoSendToChannel) {
      requestAnimationFrame(() => {
        if (state.channelScrollRef.current) {
          state.channelScrollRef.current.scrollTop = 0;
        }
      });
    }
    requestAnimationFrame(() => {
      if (state.threadScrollRef.current) {
        state.threadScrollRef.current.scrollTop = state.threadScrollRef.current.scrollHeight;
      }
    });
  }

  function handleSearchSelect(result: SearchResult) {
    state.closeSearch();
    const targetChannel = result.channel;
    const prefix = targetChannel.visibility === "dm" ? "dms" : "channels";

    if (result.type === "channel") {
      navigate(`/workspaces/${props.workspaceSlug}/${prefix}/${targetChannel.slug}`);
      return;
    }

    const isAlreadyOnChannel = state.app.activeChannel?.id === targetChannel.id;

    if (result.type === "thread") {
      if (!isAlreadyOnChannel) {
        navigate(`/workspaces/${props.workspaceSlug}/${prefix}/${targetChannel.slug}`);
      }
      state.app.openThread(result.parentMessageId);
      state.setPendingThreadReplyId(result.message.id);
      return;
    }

    if (isAlreadyOnChannel) {
      state.keyboardNav.handleMessageClick(result.message.id);
    } else {
      state.setPendingScrollToMessageId(result.message.id);
      navigate(`/workspaces/${props.workspaceSlug}/${prefix}/${targetChannel.slug}`);
    }
  }

  async function handleEmojiSelect(emoji: string) {
    if (!state.emojiMenu.messageId) {
      return;
    }

    await state.app.toggleReaction(state.emojiMenu.messageId, emoji);
    state.emojiMenu.closeEmojiMenu();
  }

  function handleJumpToChannelPost(channelPostMessageId: string) {
    state.keyboardNav.handleMessageClick(channelPostMessageId);
  }

  function handleJumpToThreadSource(threadReplyId: string, parentMessageId: string) {
    state.app.openThread(parentMessageId);
    state.setPendingThreadReplyId(threadReplyId);
    requestAnimationFrame(() => state.threadInputRef.current?.commands.focus());
  }

  function handleOpenProfile(userId: string) {
    state.app.closeThread();
    state.setProfileUserId(userId);
  }

  function handleCloseProfile() {
    state.setProfileUserId(null);
  }

  const sidebarContentProps = {
    app: state.app,
    canManageChannels: state.app.canManageChannels,
    channelIdsWithDrafts: state.channelDrafts.channelIdsWithDrafts,
    currentUserMember: state.app.currentUserMember,
    isDirectoryOpen: state.isDirectoryOpen,
    memberships: props.memberships,
    mentionCounts: state.mentionCounts,
    onChannelContextMenu: state.contextMenus.handleChannelContextMenu,
    onChannelNavigate: () => {
      state.setIsDirectoryOpen(false);
      state.closeSidebar();
    },
    onDmNavigate: (targetUserId: string) => {
      state.setIsDirectoryOpen(false);
      state.closeSidebar();
      void state.app.openOrCreateDm(targetUserId);
    },
    onCreateChannel: () => state.setIsCreateChannelOpen(true),
    onCreateWorkspace: () => state.setIsCreateWorkspaceOpen(true),
    onInvite: () => state.setIsInviteOpen(true),
    onSearch: state.openSearch,
    onSettings: () => state.setIsSettingsOpen(true),
    onSignOut: () => {
      void props.onSignOut();
    },
    pendingInvites: props.pendingInvites,
    user: props.user,
    workspace,
    workspaceSlug: props.workspaceSlug,
  };

  const threadPanelProps = {
    alsoSendToChannel: state.alsoSendToChannel,
    channelName: state.app.activeChannel?.name ?? "channel",
    currentUser: state.app.usersById.get(props.user.id) ?? {
      email: props.user.email ?? undefined,
      id: props.user.id,
    },
    currentUserId: props.user.id,
    editingDraft: state.app.editingDraft,
    editingMessageId: state.app.editingMessageId,
    members: state.mentionMembers,
    onAddFiles: state.threadUpload.addFiles,
    onAlsoSendToChannelChange: state.setAlsoSendToChannel,
    onCancelEdit: state.app.cancelEditingMessage,
    onClose: state.app.closeThread,
    onDeleteMessage: (messageId: string) => {
      state.setPendingDeleteMessageId(messageId);
    },
    onEditDraftChange: state.app.setEditingDraft,
    onJumpToChannelPost: handleJumpToChannelPost,
    onJumpToThreadSource: handleJumpToThreadSource,
    onMessageContextMenu: state.contextMenus.handleThreadMessageContextMenu,
    onOpenReactionMenu: state.emojiMenu.openEmojiMenu,
    onRemoveFile: state.threadUpload.removeFile,
    onReply: () => {
      void handleSendThreadReply();
    },
    onSaveEdit: () => {
      state.app.saveEditingMessage();
    },
    onStartEdit: state.app.startEditingMessage,
    onThreadDraftChange: state.app.setThreadDraft,
    onToggleReaction: (messageId: string, emoji: string) => {
      state.app.toggleReaction(messageId, emoji);
    },
    onUserClick: handleOpenProfile,
    replies: state.app.selectedThreadReplies,
    rootMessage: state.app.selectedThreadMessage,
    selectedReplyId: state.pendingThreadReplyId,
    stagedFiles: state.threadUpload.stagedFiles,
    startThreadResize: state.thread.startResize,
    threadDraft: state.app.threadDraft,
    threadInputRef: state.threadInputRef,
    threadScrollRef: state.threadScrollRef,
    threadWidth: state.thread.width,
    usersById: state.app.usersById,
    workspaceMembersByUserId: state.app.workspaceMembersByUserId,
  };

  return (
    <>
      <div className="h-[100dvh] overflow-hidden p-1.5 sm:p-2 md:p-3">
        <div className="flex h-full gap-1.5 sm:gap-2 md:gap-3">
          {state.isMobile ? (
            <>
              {state.isSidebarOpen
                ? createPortal(
                    <div className="fixed inset-0 z-30">
                      <div
                        className="absolute inset-0 bg-slate-950/30 backdrop-blur-sm"
                        onClick={state.closeSidebar}
                      />
                      <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col overflow-hidden rounded-r-2xl bg-amber-50/95 shadow-[4px_0_30px_rgba(15,23,42,0.14)] backdrop-blur-xl">
                        <SidebarContent
                          onBrowse={() => {
                            state.setIsDirectoryOpen(true);
                            state.closeSidebar();
                          }}
                          onClose={state.closeSidebar}
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
              style={{ flexShrink: 0, width: state.sidebar.width }}
            >
              <SidebarContent
                onBrowse={() => state.setIsDirectoryOpen(true)}
                {...sidebarContentProps}
              />
              <ResizeHandle onMouseDown={state.sidebar.startResize} side="right" />
            </aside>
          )}

          {state.isDirectoryOpen ? (
            <DirectoryPanel
              allChannels={[...state.app.visibleChannels, ...state.app.unjoinedChannels]}
              canManageChannels={state.app.canManageChannels}
              currentUserId={props.user.id}
              members={state.app.allWorkspaceMembers}
              onClose={() => state.setIsDirectoryOpen(false)}
              onJoinChannel={(channelId) => {
                void state.app.joinChannel(channelId);
              }}
              onLeaveChannel={(channelId) => {
                void state.app.leaveChannel(channelId);
              }}
              visibleChannelIds={new Set(state.app.visibleChannels.map((c) => c.id))}
              workspaceSlug={props.workspaceSlug}
            />
          ) : !state.app.activeChannel && state.activeDmInfo ? (
            <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl md:rounded-[1.45rem] border border-amber-200/60 bg-white/82 shadow-[0_18px_50px_rgba(15,23,42,0.07)]">
              <ChannelHeader
                callError={null}
                canManageChannels={false}
                channelId=""
                channelName={state.activeDmInfo.displayName}
                channelTopic={undefined}
                errorMessage={null}
                hasRefreshToken={false}
                isDm
                isInCall={false}
                isMobile={state.isMobile}
                notice={null}
                onEditChannel={() => {}}
                onLeaveCall={() => {}}
                onOpenPrejoin={() => {}}
                onOpenSidebar={() => state.setIsSidebarOpen(true)}
              />
              <section className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden flex flex-col-reverse px-2 pt-3 pb-1 sm:px-4 sm:pt-4 sm:pb-1.5">
                <DmEmptyState
                  displayName={state.activeDmInfo.displayName}
                  imageUrl={state.activeDmInfo.imageUrl}
                  isSelf={state.activeDmInfo.isSelf}
                  role={state.activeDmInfo.role}
                />
              </section>
            </main>
          ) : !state.app.activeChannel ? (
            <main className="flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center overflow-hidden rounded-2xl md:rounded-[1.45rem] border border-amber-200/60 bg-white/82 shadow-[0_18px_50px_rgba(15,23,42,0.07)]">
              {state.app.isLoading ? (
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
                    {state.app.canManageChannels
                      ? "Create a channel to get the conversation started."
                      : "Channels will appear here once an admin creates one."}
                  </p>
                  {state.app.canManageChannels ? (
                    <button
                      className="mt-4 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-medium text-white transition-colors duration-100 hover:bg-amber-600"
                      onClick={() => state.setIsCreateChannelOpen(true)}
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
                callError={state.callError}
                canManageChannels={state.app.canManageChannels}
                channelId={state.app.activeChannel.id}
                channelName={state.app.activeChannel.name}
                channelTopic={state.app.activeChannel.topic}
                errorMessage={state.app.errorMessage}
                hasRefreshToken={Boolean(props.user.refresh_token)}
                isDm={state.app.activeChannel.visibility === "dm"}
                isInCall={state.isInCall}
                isMobile={state.isMobile}
                notice={state.app.notice}
                onEditChannel={() => state.setEditingChannelId(state.app.activeChannel!.id)}
                onLeaveCall={() => {
                  void state.leave();
                }}
                onOpenPrejoin={state.openPrejoin}
                onOpenSidebar={() => state.setIsSidebarOpen(true)}
              />

              <ChannelMessageList
                activeThreadMessageId={state.app.selectedThreadMessage?.id}
                channelName={state.app.activeChannel.name}
                currentUserId={props.user.id}
                dmInfo={state.activeDmInfo}
                editingDraft={state.app.editingDraft}
                editingMessageId={state.app.editingMessageId}
                isMessagesLoading={state.app.isMessagesLoading}
                messages={state.app.messages}
                onCancelEdit={state.app.cancelEditingMessage}
                onContextMenu={state.contextMenus.handleMessageContextMenu}
                onDelete={(messageId) => state.setPendingDeleteMessageId(messageId)}
                onEditDraftChange={state.app.setEditingDraft}
                onJumpToThreadSource={handleJumpToThreadSource}
                onMessageClick={state.keyboardNav.handleMessageClick}
                onOpenReactionMenu={state.emojiMenu.openEmojiMenu}
                onReply={(messageId) => {
                  state.app.openThread(messageId);
                  requestAnimationFrame(() => state.threadInputRef.current?.commands.focus());
                }}
                onSaveEdit={() => {
                  state.app.saveEditingMessage();
                }}
                onStartEdit={(messageId) => state.app.startEditingMessage(messageId)}
                onToggleReaction={(messageId, emoji) => {
                  state.app.toggleReaction(messageId, emoji);
                }}
                onUserClick={handleOpenProfile}
                ref={state.channelScrollRef}
                selectedMessageId={state.keyboardNav.selectedMessageId}
                usersById={state.app.usersById}
                workspaceMembersByUserId={state.app.workspaceMembersByUserId}
              />

              <ChannelFooter
                activeTypers={state.channelTyping.activeTypers}
                channelName={state.app.activeChannel.name}
                draft={state.app.channelDraft}
                editorRef={state.channelInputRef}
                isDm={state.app.activeChannel.visibility === "dm"}
                members={state.mentionMembers}
                onAddFiles={(files: FileList) => {
                  state.channelDrafts.addFiles(state.app.activeChannel!.id, files);
                }}
                onInputKeyDown={state.keyboardNav.handleInputKeyDown}
                onRemoveFile={(fileId: string) => {
                  state.channelDrafts.removeFile(state.app.activeChannel!.id, fileId);
                }}
                onSubmit={() => {
                  void handleSendChannelMessage();
                }}
                onTypingBlur={state.channelTyping.handleBlur}
                onTypingKeyDown={state.channelTyping.handleKeyDown}
                onValueChange={state.app.setChannelDraft}
                stagedFiles={state.channelDrafts.getStagedFiles(state.app.activeChannel.id)}
              />
            </main>
          )}

          {state.app.selectedThreadMessage ? (
            state.isMobile ? (
              createPortal(
                <div className="fixed inset-0 z-30 flex flex-col bg-white">
                  <ThreadPanel {...threadPanelProps} isMobile />
                </div>,
                document.body,
              )
            ) : (
              <ThreadPanel {...threadPanelProps} />
            )
          ) : state.profileUserId && state.app.usersById.get(state.profileUserId) ? (
            state.isMobile ? (
              createPortal(
                <div className="fixed inset-0 z-30 flex flex-col bg-white">
                  <ProfilePanel
                    channels={state.app.visibleChannels.filter((ch) =>
                      ch.members?.some((m) => m.$user?.id === state.profileUserId),
                    )}
                    isMobile
                    onClose={handleCloseProfile}
                    startResize={state.thread.startResize}
                    user={state.app.usersById.get(state.profileUserId)!}
                    width={state.thread.width}
                    workspaceMember={state.app.workspaceMembersByUserId.get(state.profileUserId)}
                  />
                </div>,
                document.body,
              )
            ) : (
              <ProfilePanel
                channels={state.app.visibleChannels.filter((ch) =>
                  ch.members?.some((m) => m.$user?.id === state.profileUserId),
                )}
                onClose={handleCloseProfile}
                startResize={state.thread.startResize}
                user={state.app.usersById.get(state.profileUserId)!}
                width={state.thread.width}
                workspaceMember={state.app.workspaceMembersByUserId.get(state.profileUserId)}
              />
            )
          ) : null}
        </div>
      </div>

      <GlobalContextMenu
        menu={state.contextMenus.contextMenu}
        onClose={state.contextMenus.closeContextMenu}
      />
      <EmojiMenu
        anchor={state.emojiMenu.anchor}
        isOpen={state.emojiMenu.isOpen}
        onClose={state.emojiMenu.closeEmojiMenu}
        onSelect={(emoji) => {
          void handleEmojiSelect(emoji);
        }}
      />

      {state.pendingDeleteMessageId ? (
        <DeleteConfirmModal
          onClose={() => state.setPendingDeleteMessageId(null)}
          onConfirm={() => {
            state.app.deleteMessage(state.pendingDeleteMessageId!);
            state.setPendingDeleteMessageId(null);
            state.keyboardNav.clearSelection();
          }}
        />
      ) : null}

      {state.isCreateChannelOpen ? (
        <CreateChannelModal
          onClose={() => state.setIsCreateChannelOpen(false)}
          onCreateChannel={state.app.createChannel}
        />
      ) : null}

      {state.editingChannelId ? (
        <EditChannelModal
          channel={state.app.visibleChannels.find((c) => c.id === state.editingChannelId) ?? null}
          onClose={() => state.setEditingChannelId(null)}
          onSave={async (input) => {
            await state.app.updateChannel(state.editingChannelId!, input);
            state.setEditingChannelId(null);
          }}
        />
      ) : null}

      {state.isInviteOpen ? (
        <InviteModal
          inviterName={state.app.currentUserMember?.displayName ?? props.user.email ?? "Someone"}
          isOwner={workspace.owner?.id === props.user.id}
          memberEmails={
            new Set(
              workspace.members
                ?.map((m) => m.$user?.email)
                .filter((e): e is string => Boolean(e))
                .map(normalizeEmail) ?? [],
            )
          }
          onClose={() => state.setIsInviteOpen(false)}
          pendingEmails={new Set(state.app.invites.map((invite) => normalizeEmail(invite.email)))}
          refreshToken={props.user.refresh_token}
          userId={props.user.id}
          workspaceId={workspace.id}
          workspaceName={workspace.name}
        />
      ) : null}

      <CallModal
        error={state.callError}
        meeting={state.meeting}
        onDismiss={state.dismissCall}
        phase={state.callPhase}
      />

      {state.isSettingsOpen ? (
        <SettingsModal
          currentUserMember={state.app.currentUserMember}
          invites={state.app.invites}
          onClose={() => state.setIsSettingsOpen(false)}
          user={props.user}
          workspace={workspace}
        />
      ) : null}

      {state.isCreateWorkspaceOpen ? (
        <CreateWorkspaceModal
          onClose={() => state.setIsCreateWorkspaceOpen(false)}
          user={props.user}
        />
      ) : null}

      <SearchCommandMenu
        isOpen={state.isSearchOpen}
        onClose={state.closeSearch}
        onSelectResult={handleSearchSelect}
        search={state.search}
      />
    </>
  );
}
