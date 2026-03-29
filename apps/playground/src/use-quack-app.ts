import { useEffect, useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";

import {
  createReactionKey,
  mockWorkspace,
  type MockAttachment,
  type MockChannel,
  type MockMessage,
  type MockReaction,
  type MockWorkspaceMember,
  type User,
  type WorkspaceSnapshot,
} from "./quack-data";

export interface UseQuackAppResult {
  activeChannel: MockChannel;
  attachmentsByMessageId: Map<string, MockAttachment[]>;
  channelDraft: string;
  channelRenameDraft: string;
  currentUser: User;
  editingDraft: string;
  editingMessageId: string | null;
  messages: MockMessage[];
  onlineMembers: MockWorkspaceMember[];
  reactionsByMessageId: Map<string, MockReaction[]>;
  selectedThreadMessage: MockMessage | null;
  selectedThreadReplies: MockMessage[];
  setChannelDraft: (value: string) => void;
  setChannelRenameDraft: (value: string) => void;
  setEditingDraft: (value: string) => void;
  setThreadDraft: (value: string) => void;
  startRenamingChannel: (channelId: string) => void;
  saveRenamingChannel: () => void;
  cancelRenamingChannel: () => void;
  startEditingMessage: (messageId: string) => void;
  saveEditingMessage: () => void;
  cancelEditingMessage: () => void;
  sendChannelMessage: () => void;
  sendThreadReply: () => void;
  threadDraft: string;
  threadReplyCountByMessageId: Map<string, number>;
  toggleReaction: (messageId: string, emoji: string) => void;
  usersById: Map<string, User>;
  workspace: WorkspaceSnapshot["workspace"];
  workspaceMembersByUserId: Map<string, MockWorkspaceMember>;
  visibleChannels: MockChannel[];
  openThread: (messageId: string) => void;
  closeThread: () => void;
  deleteMessage: (messageId: string) => void;
  deleteChannel: (channelId: string) => void;
  leaveChannel: (channelId: string) => void;
  renamingChannelId: string | null;
}

export function useQuackApp(): UseQuackAppResult {
  const [workspaceData, setWorkspaceData] = useState<WorkspaceSnapshot>(() => {
    return structuredClone(mockWorkspace);
  });
  const [channelDraft, setChannelDraft] = useState("");
  const [channelRenameDraft, setChannelRenameDraft] = useState("");
  const [threadDraft, setThreadDraft] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState("");
  const [selectedThreadMessageId, setSelectedThreadMessageId] = useState<string | null>(null);
  const [renamingChannelId, setRenamingChannelId] = useState<string | null>(null);

  const [, setLocation] = useLocation();
  const [isChannelRouteMatch, channelParams] = useRoute("/channels/:channelSlug");
  const routedChannelSlug = channelParams?.channelSlug;

  const visibleChannels = useMemo(() => {
    const currentUserChannelIds = new Set(
      workspaceData.channelMembers
        .filter((channelMember) => channelMember.userId === workspaceData.currentUserId)
        .map((channelMember) => channelMember.channelId),
    );

    return workspaceData.channels.filter(
      (channel) => !channel.archivedAt && currentUserChannelIds.has(channel.id),
    );
  }, [workspaceData.channelMembers, workspaceData.channels, workspaceData.currentUserId]);

  const activeChannel = useMemo(() => {
    const defaultChannel = visibleChannels[0];

    if (!defaultChannel) {
      throw new Error("Quack playground requires at least one channel");
    }

    if (!isChannelRouteMatch) {
      return defaultChannel;
    }

    return visibleChannels.find((channel) => channel.slug === routedChannelSlug) ?? defaultChannel;
  }, [isChannelRouteMatch, routedChannelSlug, visibleChannels]);

  useEffect(() => {
    const defaultChannel = visibleChannels[0];

    if (!defaultChannel) {
      return;
    }

    if (!isChannelRouteMatch) {
      setLocation(`/channels/${defaultChannel.slug}`);
      return;
    }

    const hasValidChannel = visibleChannels.some((channel) => channel.slug === routedChannelSlug);

    if (!hasValidChannel) {
      setLocation(`/channels/${defaultChannel.slug}`);
    }
  }, [isChannelRouteMatch, routedChannelSlug, setLocation, visibleChannels]);

  useEffect(() => {
    if (!selectedThreadMessageId) {
      return;
    }

    const selectedThreadMessage = workspaceData.messages.find(
      (m) => m.id === selectedThreadMessageId,
    );

    if (!selectedThreadMessage || selectedThreadMessage.channelId !== activeChannel.id) {
      setSelectedThreadMessageId(null);
      setThreadDraft("");
    }
  }, [activeChannel.id, selectedThreadMessageId, workspaceData.messages]);

  const usersById = useMemo(() => {
    return new Map(workspaceData.users.map((user) => [user.id, user]));
  }, [workspaceData.users]);

  const workspaceMembersByUserId = useMemo(() => {
    return new Map(workspaceData.workspaceMembers.map((member) => [member.userId, member]));
  }, [workspaceData.workspaceMembers]);

  const reactionsByMessageId = useMemo(() => {
    const map = new Map<string, MockReaction[]>();

    for (const reaction of workspaceData.reactions) {
      const list = map.get(reaction.messageId) ?? [];
      list.push(reaction);
      map.set(reaction.messageId, list);
    }

    return map;
  }, [workspaceData.reactions]);

  const attachmentsByMessageId = useMemo(() => {
    const map = new Map<string, MockAttachment[]>();

    for (const attachment of workspaceData.messageAttachments) {
      const list = map.get(attachment.messageId) ?? [];
      list.push(attachment);
      map.set(attachment.messageId, list);
    }

    return map;
  }, [workspaceData.messageAttachments]);

  const messages = useMemo(() => {
    return workspaceData.messages
      .filter((m) => m.channelId === activeChannel.id && !m.parentMessageId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [activeChannel.id, workspaceData.messages]);

  const selectedThreadMessage = useMemo(() => {
    if (!selectedThreadMessageId) {
      return null;
    }

    return workspaceData.messages.find((m) => m.id === selectedThreadMessageId) ?? null;
  }, [selectedThreadMessageId, workspaceData.messages]);

  const selectedThreadReplies = useMemo(() => {
    if (!selectedThreadMessage) {
      return [];
    }

    return workspaceData.messages
      .filter((m) => m.parentMessageId === selectedThreadMessage.id)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [selectedThreadMessage, workspaceData.messages]);

  const threadReplyCountByMessageId = useMemo(() => {
    const map = new Map<string, number>();

    for (const message of workspaceData.messages) {
      if (!message.parentMessageId) {
        continue;
      }

      map.set(message.parentMessageId, (map.get(message.parentMessageId) ?? 0) + 1);
    }

    return map;
  }, [workspaceData.messages]);

  const onlineMembers = useMemo(() => {
    const channelUserIds = workspaceData.channelMembers
      .filter((cm) => cm.channelId === activeChannel.id)
      .map((cm) => cm.userId);

    return workspaceData.workspaceMembers.filter((m) => channelUserIds.includes(m.userId));
  }, [activeChannel.id, workspaceData.channelMembers, workspaceData.workspaceMembers]);

  const currentUser = useMemo(() => {
    const user = usersById.get(workspaceData.currentUserId);

    if (!user) {
      throw new Error("Current Quack user not found");
    }

    return user;
  }, [usersById, workspaceData.currentUserId]);

  function openThread(messageId: string) {
    setSelectedThreadMessageId(messageId);
    setEditingMessageId(null);
    setEditingDraft("");
  }

  function closeThread() {
    setSelectedThreadMessageId(null);
    setThreadDraft("");
  }

  function startRenamingChannel(channelId: string) {
    const channel = workspaceData.channels.find((item) => item.id === channelId);

    if (!channel || channel.archivedAt) {
      return;
    }

    setRenamingChannelId(channelId);
    setChannelRenameDraft(channel.name);
  }

  function cancelRenamingChannel() {
    setRenamingChannelId(null);
    setChannelRenameDraft("");
  }

  function saveRenamingChannel() {
    if (!renamingChannelId) {
      return;
    }

    const trimmedName = channelRenameDraft.trim();

    if (!trimmedName) {
      return;
    }

    const nextSlug = createUniqueChannelSlug({
      channels: workspaceData.channels,
      name: trimmedName,
      workspaceSlug: workspaceData.workspace.slug,
      currentChannelId: renamingChannelId,
    });

    setWorkspaceData((prev) => ({
      ...prev,
      channels: prev.channels.map((channel) =>
        channel.id !== renamingChannelId
          ? channel
          : {
              ...channel,
              name: trimmedName,
              scopedSlug: `${prev.workspace.slug}:${nextSlug}`,
              slug: nextSlug,
            },
      ),
    }));

    if (activeChannel.id === renamingChannelId) {
      setLocation(`/channels/${nextSlug}`);
    }

    cancelRenamingChannel();
  }

  function startEditingMessage(messageId: string) {
    const message = workspaceData.messages.find((m) => m.id === messageId);

    if (!message || message.deletedAt) {
      return;
    }

    setEditingMessageId(messageId);
    setEditingDraft(message.body ?? "");
  }

  function cancelEditingMessage() {
    setEditingMessageId(null);
    setEditingDraft("");
  }

  function saveEditingMessage() {
    if (!editingMessageId) {
      return;
    }

    const trimmed = editingDraft.trim();

    if (!trimmed) {
      return;
    }

    setWorkspaceData((prev) => ({
      ...prev,
      messages: prev.messages.map((m) =>
        m.id !== editingMessageId
          ? m
          : { ...m, body: trimmed, updatedAt: new Date().toISOString() },
      ),
    }));

    setEditingMessageId(null);
    setEditingDraft("");
  }

  function sendChannelMessage() {
    const trimmed = channelDraft.trim();

    if (!trimmed) {
      return;
    }

    const next: MockMessage = {
      id: `msg-${crypto.randomUUID().slice(0, 8)}`,
      body: trimmed,
      createdAt: new Date().toISOString(),
      messageType: "message",
      channelId: activeChannel.id,
      senderUserId: workspaceData.currentUserId,
    };

    setWorkspaceData((prev) => ({ ...prev, messages: [...prev.messages, next] }));
    setChannelDraft("");
  }

  function sendThreadReply() {
    if (!selectedThreadMessage) {
      return;
    }

    const trimmed = threadDraft.trim();

    if (!trimmed) {
      return;
    }

    const next: MockMessage = {
      id: `reply-${crypto.randomUUID().slice(0, 8)}`,
      body: trimmed,
      createdAt: new Date().toISOString(),
      messageType: "message",
      channelId: selectedThreadMessage.channelId,
      senderUserId: workspaceData.currentUserId,
      parentMessageId: selectedThreadMessage.id,
    };

    setWorkspaceData((prev) => ({ ...prev, messages: [...prev.messages, next] }));
    setThreadDraft("");
  }

  function deleteMessage(messageId: string) {
    setWorkspaceData((prev) => ({
      ...prev,
      messages: prev.messages.map((m) =>
        m.id !== messageId ? m : { ...m, body: undefined, deletedAt: new Date().toISOString() },
      ),
    }));

    if (editingMessageId === messageId) {
      cancelEditingMessage();
    }
  }

  function deleteChannel(channelId: string) {
    if (visibleChannels.length <= 1) {
      return;
    }

    setWorkspaceData((prev) => ({
      ...prev,
      channels: prev.channels.map((channel) =>
        channel.id !== channelId ? channel : { ...channel, archivedAt: new Date().toISOString() },
      ),
    }));

    if (renamingChannelId === channelId) {
      cancelRenamingChannel();
    }
  }

  function leaveChannel(channelId: string) {
    if (visibleChannels.length <= 1) {
      return;
    }

    setWorkspaceData((prev) => ({
      ...prev,
      channelMembers: prev.channelMembers.filter(
        (channelMember) =>
          !(channelMember.channelId === channelId && channelMember.userId === prev.currentUserId),
      ),
    }));

    if (renamingChannelId === channelId) {
      cancelRenamingChannel();
    }
  }

  function toggleReaction(messageId: string, emoji: string) {
    const key = createReactionKey(messageId, workspaceData.currentUserId, emoji);

    setWorkspaceData((prev) => {
      const existing = prev.reactions.find((r) => r.reactionKey === key);

      if (existing) {
        return { ...prev, reactions: prev.reactions.filter((r) => r.id !== existing.id) };
      }

      const next: MockReaction = {
        id: `rx-${crypto.randomUUID().slice(0, 8)}`,
        createdAt: new Date().toISOString(),
        emoji,
        reactionKey: key,
        messageId,
        userId: prev.currentUserId,
      };

      return { ...prev, reactions: [...prev.reactions, next] };
    });
  }

  return {
    activeChannel,
    attachmentsByMessageId,
    channelDraft,
    channelRenameDraft,
    currentUser,
    editingDraft,
    editingMessageId,
    messages,
    onlineMembers,
    reactionsByMessageId,
    selectedThreadMessage,
    selectedThreadReplies,
    setChannelDraft,
    setChannelRenameDraft,
    setEditingDraft,
    setThreadDraft,
    startRenamingChannel,
    saveRenamingChannel,
    cancelRenamingChannel,
    startEditingMessage,
    saveEditingMessage,
    cancelEditingMessage,
    sendChannelMessage,
    sendThreadReply,
    threadDraft,
    threadReplyCountByMessageId,
    toggleReaction,
    usersById,
    workspace: workspaceData.workspace,
    workspaceMembersByUserId,
    visibleChannels,
    openThread,
    closeThread,
    deleteMessage,
    deleteChannel,
    leaveChannel,
    renamingChannelId,
  };
}

interface CreateUniqueChannelSlugProps {
  channels: MockChannel[];
  currentChannelId: string;
  name: string;
  workspaceSlug: string;
}

function createUniqueChannelSlug(props: CreateUniqueChannelSlugProps) {
  const baseSlug = slugifyChannelName(props.name);
  const siblingScopedSlugs = new Set(
    props.channels
      .filter((channel) => channel.id !== props.currentChannelId)
      .map((channel) => channel.scopedSlug),
  );

  let suffix = 1;
  let nextSlug = baseSlug;

  while (siblingScopedSlugs.has(`${props.workspaceSlug}:${nextSlug}`)) {
    suffix += 1;
    nextSlug = `${baseSlug}-${suffix}`;
  }

  return nextSlug;
}

function slugifyChannelName(value: string) {
  const nextSlug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return nextSlug || "channel";
}
