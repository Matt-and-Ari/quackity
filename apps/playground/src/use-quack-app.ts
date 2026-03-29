import { useEffect, useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";

import {
  quackWorkspaceSnapshot,
  type QuackAttachmentRecord,
  type QuackChannelRecord,
  type QuackMessageRecord,
  type QuackReactionRecord,
  type QuackUserRecord,
  type QuackWorkspaceMemberRecord,
  type QuackWorkspaceSnapshot,
} from "./quack-data";

interface UseQuackAppResult {
  activeChannel: QuackChannelRecord;
  attachmentsByMessageId: Map<string, QuackAttachmentRecord[]>;
  channelDraft: string;
  currentUser: QuackUserRecord;
  editingDraft: string;
  editingMessageId: string | null;
  messages: QuackMessageRecord[];
  onlineMembers: QuackWorkspaceMemberRecord[];
  reactionsByMessageId: Map<string, QuackReactionRecord[]>;
  selectedThreadMessage: QuackMessageRecord | null;
  selectedThreadReplies: QuackMessageRecord[];
  setChannelDraft: (value: string) => void;
  setEditingDraft: (value: string) => void;
  setThreadDraft: (value: string) => void;
  startEditingMessage: (messageId: string) => void;
  saveEditingMessage: () => void;
  cancelEditingMessage: () => void;
  sendChannelMessage: () => void;
  sendThreadReply: () => void;
  threadDraft: string;
  threadReplyCountByMessageId: Map<string, number>;
  toggleReaction: (messageId: string, emoji: string) => void;
  usersById: Map<string, QuackUserRecord>;
  workspace: QuackWorkspaceSnapshot["workspace"];
  workspaceMembersByUserId: Map<string, QuackWorkspaceMemberRecord>;
  visibleChannels: QuackChannelRecord[];
  openThread: (messageId: string) => void;
  closeThread: () => void;
  deleteMessage: (messageId: string) => void;
}

export function useQuackApp(): UseQuackAppResult {
  const [workspaceData, setWorkspaceData] = useState<QuackWorkspaceSnapshot>(() => {
    return structuredClone(quackWorkspaceSnapshot);
  });
  const [channelDraft, setChannelDraft] = useState("");
  const [threadDraft, setThreadDraft] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState("");
  const [selectedThreadMessageId, setSelectedThreadMessageId] = useState<string | null>(null);

  const [, setLocation] = useLocation();
  const [isChannelRouteMatch, channelParams] = useRoute("/channels/:channelSlug");
  const routedChannelSlug = channelParams?.channelSlug;

  const visibleChannels = useMemo(() => {
    return workspaceData.channels.filter((channel) => !channel.archivedAt);
  }, [workspaceData.channels]);

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
      (message) => message.id === selectedThreadMessageId,
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
    const map = new Map<string, QuackReactionRecord[]>();

    for (const reaction of workspaceData.reactions) {
      const currentReactions = map.get(reaction.messageId) ?? [];
      currentReactions.push(reaction);
      map.set(reaction.messageId, currentReactions);
    }

    return map;
  }, [workspaceData.reactions]);

  const attachmentsByMessageId = useMemo(() => {
    const map = new Map<string, QuackAttachmentRecord[]>();

    for (const attachment of workspaceData.messageAttachments) {
      const currentAttachments = map.get(attachment.messageId) ?? [];
      currentAttachments.push(attachment);
      map.set(attachment.messageId, currentAttachments);
    }

    return map;
  }, [workspaceData.messageAttachments]);

  const messages = useMemo(() => {
    return workspaceData.messages
      .filter((message) => message.channelId === activeChannel.id && !message.parentMessageId)
      .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());
  }, [activeChannel.id, workspaceData.messages]);

  const selectedThreadMessage = useMemo(() => {
    if (!selectedThreadMessageId) {
      return null;
    }

    return workspaceData.messages.find((message) => message.id === selectedThreadMessageId) ?? null;
  }, [selectedThreadMessageId, workspaceData.messages]);

  const selectedThreadReplies = useMemo(() => {
    if (!selectedThreadMessage) {
      return [];
    }

    return workspaceData.messages
      .filter((message) => message.parentMessageId === selectedThreadMessage.id)
      .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());
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
    const channelMemberUserIds = workspaceData.channelMembers
      .filter((membership) => membership.channelId === activeChannel.id)
      .map((membership) => membership.userId);

    return workspaceData.workspaceMembers.filter((member) => {
      return channelMemberUserIds.includes(member.userId);
    });
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

  function startEditingMessage(messageId: string) {
    const message = workspaceData.messages.find((entry) => entry.id === messageId);

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

    const trimmedDraft = editingDraft.trim();

    if (!trimmedDraft) {
      return;
    }

    setWorkspaceData((currentWorkspaceData) => {
      return {
        ...currentWorkspaceData,
        messages: currentWorkspaceData.messages.map((message) => {
          if (message.id !== editingMessageId) {
            return message;
          }

          return {
            ...message,
            body: trimmedDraft,
            updatedAt: new Date(),
          };
        }),
      };
    });

    setEditingMessageId(null);
    setEditingDraft("");
  }

  function sendChannelMessage() {
    const trimmedDraft = channelDraft.trim();

    if (!trimmedDraft) {
      return;
    }

    const nextMessage: QuackMessageRecord = {
      entity: "messages",
      id: createLocalId("message"),
      body: trimmedDraft,
      createdAt: new Date(),
      messageType: "message",
      channelId: activeChannel.id,
      senderUserId: workspaceData.currentUserId,
    };

    setWorkspaceData((currentWorkspaceData) => {
      return {
        ...currentWorkspaceData,
        messages: [...currentWorkspaceData.messages, nextMessage],
      };
    });

    setChannelDraft("");
  }

  function sendThreadReply() {
    if (!selectedThreadMessage) {
      return;
    }

    const trimmedDraft = threadDraft.trim();

    if (!trimmedDraft) {
      return;
    }

    const nextMessage: QuackMessageRecord = {
      entity: "messages",
      id: createLocalId("thread-reply"),
      body: trimmedDraft,
      createdAt: new Date(),
      messageType: "message",
      channelId: selectedThreadMessage.channelId,
      senderUserId: workspaceData.currentUserId,
      parentMessageId: selectedThreadMessage.id,
    };

    setWorkspaceData((currentWorkspaceData) => {
      return {
        ...currentWorkspaceData,
        messages: [...currentWorkspaceData.messages, nextMessage],
      };
    });

    setThreadDraft("");
  }

  function deleteMessage(messageId: string) {
    setWorkspaceData((currentWorkspaceData) => {
      return {
        ...currentWorkspaceData,
        messages: currentWorkspaceData.messages.map((message) => {
          if (message.id !== messageId) {
            return message;
          }

          return {
            ...message,
            body: undefined,
            deletedAt: new Date(),
          };
        }),
      };
    });

    if (editingMessageId === messageId) {
      cancelEditingMessage();
    }
  }

  function toggleReaction(messageId: string, emoji: string) {
    const reactionKey = createReactionKey(messageId, workspaceData.currentUserId, emoji);

    setWorkspaceData((currentWorkspaceData) => {
      const existingReaction = currentWorkspaceData.reactions.find((reaction) => {
        return reaction.reactionKey === reactionKey;
      });

      if (existingReaction) {
        return {
          ...currentWorkspaceData,
          reactions: currentWorkspaceData.reactions.filter(
            (reaction) => reaction.id !== existingReaction.id,
          ),
        };
      }

      const nextReaction: QuackReactionRecord = {
        entity: "reactions",
        id: createLocalId("reaction"),
        createdAt: new Date(),
        emoji,
        reactionKey,
        messageId,
        userId: currentWorkspaceData.currentUserId,
      };

      return {
        ...currentWorkspaceData,
        reactions: [...currentWorkspaceData.reactions, nextReaction],
      };
    });
  }

  return {
    activeChannel,
    attachmentsByMessageId,
    channelDraft,
    currentUser,
    editingDraft,
    editingMessageId,
    messages,
    onlineMembers,
    reactionsByMessageId,
    selectedThreadMessage,
    selectedThreadReplies,
    setChannelDraft,
    setEditingDraft,
    setThreadDraft,
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
  };
}

function createLocalId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

function createReactionKey(messageId: string, userId: string, emoji: string) {
  return `${messageId}:${userId}:${emoji}`;
}
