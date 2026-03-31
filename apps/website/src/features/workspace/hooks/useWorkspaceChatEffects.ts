import type { Editor } from "@tiptap/react";
import { tx } from "@instantdb/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useChannelDrafts } from "../../../hooks/useChannelDrafts";
import { useFileUpload } from "../../../hooks/useFileUpload";
import { useIsMobile } from "../../../hooks/useIsMobile";
import { useMentionCounts } from "../../../hooks/useMentionCounts";
import { useMentionNotifications } from "../../../hooks/useMentionNotifications";
import { useMessageKeyboardNav } from "../../../hooks/useMessageKeyboardNav";
import { useResizeHandle } from "../../../hooks/useResizeHandle";
import { useQuackWorkspace } from "../../../hooks/useQuackWorkspace";
import { useSearchMessages } from "../../../hooks/useSearchMessages";
import { useTypingIndicator } from "../../../hooks/useTypingIndicator";
import { instantDB } from "../../../lib/instant";
import { useChannelCall } from "../../../lib/channel-calls";
import { anchorFromPoint } from "../../../components/ui/floating";
import { useContextMenus } from "./useContextMenus";
import { useEmojiMenuState } from "./useEmojiMenuState";
import type { AuthenticatedUser } from "../../../types/quack";

const serverUrl = import.meta.env.VITE_SERVER_URL ?? "http://localhost:3001";

interface UseWorkspaceChatEffectsProps {
  channelSlug?: string;
  navigate: (to: string) => void;
  user: AuthenticatedUser;
  workspaceSlug: string;
}

export function useWorkspaceChatEffects(props: UseWorkspaceChatEffectsProps) {
  const isMobile = useIsMobile();

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
    navigate: (to) => props.navigate(to),
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
    dmChannels: app.dmChannels,
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

  const dmChannelIds = useMemo(() => {
    return new Set(app.dmChannels.map((c) => c.id));
  }, [app.dmChannels]);

  const activeDmInfo = useMemo(() => {
    if (app.activeChannel?.visibility === "dm") {
      const members = app.activeChannel.members ?? [];
      const otherMember = members.find((m) => m.$user?.id !== props.user.id);
      const isSelf = !otherMember || otherMember.$user?.id === props.user.id;
      const targetUserId = isSelf ? props.user.id : otherMember.$user?.id;
      const workspaceMember = targetUserId
        ? app.workspaceMembersByUserId.get(targetUserId)
        : undefined;
      const user = targetUserId ? app.usersById.get(targetUserId) : undefined;
      const displayName = workspaceMember?.displayName ?? user?.email ?? app.activeChannel.name;
      const imageUrl = user?.avatar?.url ?? user?.imageURL ?? undefined;
      const role = workspaceMember?.role;

      return { displayName, imageUrl, isSelf, role };
    }

    if (app.pendingDmInfo) {
      return {
        displayName: app.pendingDmInfo.displayName,
        imageUrl: app.pendingDmInfo.imageUrl,
        isSelf: app.pendingDmInfo.isSelf,
        role: app.pendingDmInfo.role,
      };
    }

    return undefined;
  }, [
    app.activeChannel,
    app.pendingDmInfo,
    app.workspaceMembersByUserId,
    app.usersById,
    props.user.id,
  ]);

  useMentionNotifications({
    channelNamesById,
    dmChannelIds,
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

  // Document title effect
  useEffect(() => {
    const channelName = app.activeChannel?.name;
    document.title = channelName ? `${channelName} | Quackity` : "Quackity";
  }, [app.activeChannel?.name]);

  // Close profile when thread opens
  useEffect(() => {
    if (app.selectedThreadMessage) {
      setProfileUserId(null);
    }
  }, [app.selectedThreadMessage]);

  // Mark mentions as read when entering a channel
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

  // Cmd+K search toggle
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

  // Scroll to pending message
  useEffect(() => {
    if (!pendingScrollToMessageId || !app.messages.length) return;

    const messageExists = app.messages.some((m) => m.id === pendingScrollToMessageId);
    if (messageExists) {
      keyboardNav.handleMessageClick(pendingScrollToMessageId);
      setPendingScrollToMessageId(null);
    }
  }, [pendingScrollToMessageId, app.messages]);

  // Focus channel input on channel change
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

  // Thread focus management
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

  // Escape to close thread
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

  // Pending thread reply scroll + highlight
  useEffect(() => {
    if (!pendingThreadReplyId || !app.selectedThreadMessage) return;

    const allThreadMessages = [app.selectedThreadMessage, ...app.selectedThreadReplies];
    const targetExists = allThreadMessages.some((m) => m.id === pendingThreadReplyId);
    if (targetExists) {
      const timer = setTimeout(() => {
        setPendingThreadReplyId(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [pendingThreadReplyId, app.selectedThreadMessage, app.selectedThreadReplies]);

  // Close context menu on state changes
  useEffect(() => {
    contextMenus.setContextMenu(null);
  }, [
    app.activeChannel?.id,
    app.editingMessageId,
    app.renamingChannelId,
    app.selectedThreadMessage?.id,
  ]);

  return {
    activeDmInfo,
    alsoSendToChannel,
    app,
    callChannelId,
    callError,
    callPhase,
    channelDrafts,
    channelInputRef,
    channelScrollRef,
    channelTyping,
    closeSidebar,
    closeSearch,
    contextMenus,
    dismissCall,
    editingChannelId,
    emojiMenu,
    isCreateChannelOpen,
    isCreateWorkspaceOpen,
    isDirectoryOpen,
    isInCall,
    isInviteOpen,
    isMobile,
    isSearchOpen,
    isSettingsOpen,
    isSidebarOpen,
    keyboardNav,
    leave,
    meeting,
    mentionCounts,
    mentionMembers,
    openPrejoin,
    openSearch,
    pendingDeleteMessageId,
    pendingThreadReplyId,
    profileUserId,
    search,
    setAlsoSendToChannel,
    setEditingChannelId,
    setIsCreateChannelOpen,
    setIsCreateWorkspaceOpen,
    setIsDirectoryOpen,
    setIsInviteOpen,
    setIsSearchOpen,
    setIsSettingsOpen,
    setIsSidebarOpen,
    setPendingDeleteMessageId,
    setPendingScrollToMessageId,
    setPendingThreadReplyId,
    setProfileUserId,
    sidebar,
    thread,
    threadInputRef,
    threadScrollRef,
    threadUpload,
  };
}
