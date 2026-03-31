import {
  archiveChannelTx,
  channelsByWorkspaceQuery,
  createChannelMemberTx,
  createChannelTx,
  createMessageAttachmentTx,
  createMessageTx,
  createReactionTx,
  deleteChannelMemberTx,
  deleteReactionByKeyTx,
  messagesByChannelQuery,
  updateChannelTx,
  updateMessageTx,
  workspaceBySlugQuery,
  type ChannelVisibility,
} from "@quack/data";
import { tx } from "@instantdb/core";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";

import { instantDB } from "../lib/instant";
import { asArray, slugifyChannelName, toErrorMessage } from "../lib/ui";
import type { UploadedFile } from "./useFileUpload";
import type {
  AuthenticatedUser,
  ChannelRecord,
  InstantUserWithAvatar,
  MessageRecord,
  WorkspaceInviteRecord,
  WorkspaceMemberRecord,
  WorkspaceSummary,
} from "../types/quack";

interface CreateChannelInput {
  name: string;
  topic?: string;
  visibility: ChannelVisibility;
}

const EMPTY_UUID = "00000000-0000-0000-0000-000000000000";

interface UseQuackWorkspaceProps {
  channelSlug?: string;
  clearChannelDraft?: (channelId: string) => void;
  getChannelDraft?: (channelId: string) => string;
  setChannelDraftExternal?: (channelId: string, value: string) => void;
  user: AuthenticatedUser;
  workspaceSlug: string;
}

export interface UseQuackWorkspaceResult {
  activeChannel: ChannelRecord | null;
  canManageChannels: boolean;
  cancelEditingMessage: () => void;
  cancelRenamingChannel: () => void;
  channelDraft: string;
  channelRenameDraft: string;
  clearChannelDraft: () => void;
  closeThread: () => void;
  createChannel: (input: CreateChannelInput) => Promise<void>;
  currentUserMember?: WorkspaceMemberRecord;
  deleteChannel: (channelId: string) => Promise<void>;
  deleteMessage: (messageId: string) => void;
  editingDraft: string;
  editingMessageId: string | null;
  errorMessage?: string;
  invites: WorkspaceInviteRecord[];
  allWorkspaceMembers: WorkspaceMemberRecord[];
  isLoading: boolean;
  isMessagesLoading: boolean;
  joinChannel: (channelId: string) => Promise<void>;
  leaveChannel: (channelId: string) => Promise<void>;
  messages: MessageRecord[];
  notice: string | null;
  onlineMembers: WorkspaceMemberRecord[];
  openThread: (messageId: string) => void;
  renamingChannelId: string | null;
  saveEditingMessage: () => void;
  saveRenamingChannel: () => Promise<void>;
  selectedThreadMessage: MessageRecord | null;
  selectedThreadReplies: MessageRecord[];
  sendChannelMessage: (files?: UploadedFile[]) => void;
  sendThreadReply: (files?: UploadedFile[], alsoSendToChannel?: boolean) => void;
  setChannelDraft: (value: string) => void;
  setChannelRenameDraft: (value: string) => void;
  setEditingDraft: (value: string) => void;
  setNotice: (value: string | null) => void;
  setThreadDraft: (value: string) => void;
  startEditingMessage: (messageId: string) => void;
  startRenamingChannel: (channelId: string) => void;
  threadDraft: string;
  toggleReaction: (messageId: string, emoji: string) => void;
  updateChannel: (
    channelId: string,
    input: { name: string; topic?: string; visibility?: ChannelVisibility },
  ) => Promise<void>;
  unjoinedChannels: ChannelRecord[];
  usersById: Map<string, InstantUserWithAvatar>;
  visibleChannels: ChannelRecord[];
  workspace: WorkspaceSummary | null;
  workspaceMembersByUserId: Map<string, WorkspaceMemberRecord>;
}

export function useQuackWorkspace(props: UseQuackWorkspaceProps): UseQuackWorkspaceResult {
  const [, navigate] = useLocation();
  const [fallbackDraft, setFallbackDraft] = useState("");
  const [channelRenameDraft, setChannelRenameDraft] = useState("");
  const [editingDraft, setEditingDraft] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [optimisticMessages, setOptimisticMessages] = useState<MessageRecord[]>([]);
  const [renamingChannelId, setRenamingChannelId] = useState<string | null>(null);
  const [selectedThreadMessageId, setSelectedThreadMessageId] = useState<string | null>(null);
  const [threadDraft, setThreadDraft] = useState("");

  const workspaceState = instantDB.useQuery(workspaceBySlugQuery(props.workspaceSlug));

  const workspace = asArray<WorkspaceSummary>(workspaceState.data?.workspaces)[0] ?? null;
  const resolvedWorkspaceId = workspace?.id ?? EMPTY_UUID;

  const channelsState = instantDB.useQuery(channelsByWorkspaceQuery(resolvedWorkspaceId));

  const members = asArray<WorkspaceMemberRecord>(workspace?.members);
  const invites = asArray<WorkspaceInviteRecord>(workspace?.invites);
  const allChannels = asArray<ChannelRecord>(channelsState.data?.channels);
  const currentUserMember = members.find((member) => member.$user?.id === props.user.id);
  const isOwner = workspace?.owner?.id === props.user.id;
  const isAdmin = currentUserMember?.role === "admin";
  const canManageChannels = Boolean(isOwner || isAdmin);

  const visibleChannels = useMemo(() => {
    return allChannels.filter((channel) => {
      if (channel.archivedAt) return false;
      return asArray(channel.members).some((member) => member.$user?.id === props.user.id);
    });
  }, [allChannels, props.user.id]);

  const unjoinedChannels = useMemo(() => {
    return allChannels.filter((channel) => {
      if (channel.archivedAt) return false;
      const isMember = asArray(channel.members).some(
        (member) => member.$user?.id === props.user.id,
      );
      if (isMember) return false;
      if (channel.visibility === "public") return true;
      if (canManageChannels) return true;
      return false;
    });
  }, [allChannels, canManageChannels, props.user.id]);

  const activeChannel = useMemo(() => {
    const defaultChannel = visibleChannels[0] ?? null;

    if (!defaultChannel) {
      return null;
    }

    if (!props.channelSlug) {
      return defaultChannel;
    }

    return visibleChannels.find((channel) => channel.slug === props.channelSlug) ?? defaultChannel;
  }, [props.channelSlug, visibleChannels]);

  const activeChannelId = activeChannel?.id ?? null;

  const channelDraft =
    activeChannelId && props.getChannelDraft
      ? props.getChannelDraft(activeChannelId)
      : fallbackDraft;

  function setChannelDraft(value: string) {
    if (activeChannelId && props.setChannelDraftExternal) {
      props.setChannelDraftExternal(activeChannelId, value);
    } else {
      setFallbackDraft(value);
    }
  }

  function clearChannelDraft() {
    if (activeChannelId && props.clearChannelDraft) {
      props.clearChannelDraft(activeChannelId);
    } else {
      setFallbackDraft("");
    }
  }

  useEffect(() => {
    if (!activeChannel) {
      return;
    }

    if (!props.channelSlug || props.channelSlug !== activeChannel.slug) {
      navigate(`/workspaces/${props.workspaceSlug}/channels/${activeChannel.slug}`, {
        replace: true,
      });
    }
  }, [activeChannel, navigate, props.channelSlug, props.workspaceSlug]);

  const autoJoinRanForRef = useRef<string | null>(null);
  useEffect(() => {
    console.log("[auto-join] effect fired", {
      alreadyRanForWorkspace: autoJoinRanForRef.current === resolvedWorkspaceId,
      resolvedWorkspaceId,
      hasWorkspace: Boolean(workspace),
      channelsLoading: channelsState.isLoading,
      hasCurrentUserMember: Boolean(currentUserMember),
      isOwner,
      allChannelsCount: allChannels.length,
      userId: props.user.id,
    });

    if (autoJoinRanForRef.current === resolvedWorkspaceId) return;
    if (!workspace || channelsState.isLoading) return;
    if (!(currentUserMember || isOwner)) return;

    autoJoinRanForRef.current = resolvedWorkspaceId;

    const publicChannelsToJoin = allChannels.filter((channel) => {
      if (channel.archivedAt || channel.visibility !== "public") return false;
      const alreadyMember = asArray(channel.members).some(
        (member) => member.$user?.id === props.user.id,
      );
      console.log("[auto-join] channel check", {
        channelId: channel.id,
        channelName: channel.name,
        visibility: channel.visibility,
        archivedAt: channel.archivedAt,
        alreadyMember,
        memberCount: asArray(channel.members).length,
      });
      return !alreadyMember;
    });

    console.log(
      "[auto-join] publicChannelsToJoin:",
      publicChannelsToJoin.length,
      publicChannelsToJoin.map((c) => c.name),
    );

    if (publicChannelsToJoin.length === 0) return;

    const txs = publicChannelsToJoin.map(
      (channel) => createChannelMemberTx({ channelId: channel.id, userId: props.user.id }).tx,
    );
    console.log("[auto-join] transacting", txs.length, "channel memberships");
    void instantDB
      .transact(txs)
      .then(() => {
        console.log("[auto-join] transact succeeded");
      })
      .catch((err: unknown) => {
        console.error("[auto-join] transact failed", err);
      });
  });

  const prevChannelIdRef = useRef(activeChannelId);
  useEffect(() => {
    if (prevChannelIdRef.current !== activeChannelId) {
      prevChannelIdRef.current = activeChannelId;
      setOptimisticMessages([]);
    }
  }, [activeChannelId]);

  const hasActiveChannel = activeChannel !== null;
  const messagesState = instantDB.useQuery(messagesByChannelQuery(activeChannel?.id ?? EMPTY_UUID));

  const serverMessages = useMemo(() => {
    if (!hasActiveChannel) {
      return [];
    }
    return asArray<MessageRecord>(messagesState.data?.messages);
  }, [hasActiveChannel, messagesState.data]);

  useEffect(() => {
    if (optimisticMessages.length === 0) return;
    const serverIds = new Set<string>();
    for (const msg of serverMessages) {
      serverIds.add(msg.id);
      for (const reply of asArray(msg.threadReplies)) {
        serverIds.add(reply.id);
      }
    }
    const remaining = optimisticMessages.filter((m) => !serverIds.has(m.id));
    if (remaining.length !== optimisticMessages.length) {
      setOptimisticMessages(remaining);
    }
  }, [serverMessages, optimisticMessages]);

  const rootMessages = useMemo(() => {
    const pendingRoot = optimisticMessages.filter((m) => m.messageType === "message");
    if (pendingRoot.length === 0) return serverMessages;
    const serverIds = new Set(serverMessages.map((m) => m.id));
    const deduped = pendingRoot.filter((m) => !serverIds.has(m.id));
    if (deduped.length === 0) return serverMessages;
    return [...serverMessages, ...deduped];
  }, [serverMessages, optimisticMessages]);

  useEffect(() => {
    if (!selectedThreadMessageId) {
      return;
    }

    const stillExists = rootMessages.some(
      (message) =>
        message.id === selectedThreadMessageId ||
        asArray(message.threadReplies).some((reply) => reply.id === selectedThreadMessageId),
    );

    if (!stillExists) {
      setSelectedThreadMessageId(null);
      setThreadDraft("");
    }
  }, [rootMessages, selectedThreadMessageId]);

  const selectedThreadMessage = useMemo(() => {
    if (!selectedThreadMessageId) {
      return null;
    }

    const rootMessage = rootMessages.find((message) => message.id === selectedThreadMessageId);
    return rootMessage ?? null;
  }, [rootMessages, selectedThreadMessageId]);

  const selectedThreadReplies = useMemo(() => {
    const serverReplies = asArray(selectedThreadMessage?.threadReplies);
    if (!selectedThreadMessageId || optimisticMessages.length === 0) return serverReplies;
    const pendingReplies = optimisticMessages.filter(
      (m) => m.messageType === "thread_reply" && m.parentMessage?.id === selectedThreadMessageId,
    );
    if (pendingReplies.length === 0) return serverReplies;
    const replyIds = new Set(serverReplies.map((r) => r.id));
    const dedupedReplies = pendingReplies.filter((m) => !replyIds.has(m.id));
    if (dedupedReplies.length === 0) return serverReplies;
    return [...serverReplies, ...dedupedReplies];
  }, [selectedThreadMessage, selectedThreadMessageId, optimisticMessages]);

  const usersById = useMemo(() => {
    const nextUsers = new Map<string, InstantUserWithAvatar>();

    for (const member of members) {
      if (member.$user?.id) {
        nextUsers.set(member.$user.id, member.$user);
      }
    }

    for (const message of rootMessages) {
      collectMessageUsers(nextUsers, message);
    }

    return nextUsers;
  }, [members, rootMessages]);

  const workspaceMembersByUserId = useMemo(() => {
    return new Map(
      members
        .filter((member): member is WorkspaceMemberRecord & { $user: InstantUserWithAvatar } =>
          Boolean(member.$user?.id),
        )
        .map((member) => [member.$user.id, member] as const),
    );
  }, [members]);

  const onlineMembers = useMemo(() => {
    return members.filter((member) => {
      if (!member.$user?.id) {
        return false;
      }

      if (!activeChannel) {
        return false;
      }

      if (activeChannel.visibility === "public") {
        return true;
      }

      if (canManageChannels) {
        return true;
      }

      return asArray(activeChannel.members).some(
        (channelMember) => channelMember.$user?.id === member.$user?.id,
      );
    });
  }, [activeChannel, canManageChannels, members]);

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
    const channel = allChannels.find((item) => item.id === channelId);

    if (!channel || channel.archivedAt) {
      return;
    }

    setChannelRenameDraft(channel.name);
    setRenamingChannelId(channelId);
  }

  async function saveRenamingChannel() {
    if (!renamingChannelId || !workspace) {
      return;
    }

    const trimmedName = channelRenameDraft.trim();

    if (!trimmedName) {
      return;
    }

    const nextSlug = createUniqueChannelSlug({
      channels: allChannels,
      currentChannelId: renamingChannelId,
      name: trimmedName,
    });

    try {
      await instantDB.transact(
        updateChannelTx(renamingChannelId, {
          name: trimmedName,
          slug: nextSlug,
          workspaceId: workspace.id,
        }),
      );

      if (activeChannel?.id === renamingChannelId) {
        navigate(`/workspaces/${props.workspaceSlug}/channels/${nextSlug}`);
      }
    } catch (error) {
      setNotice(toErrorMessage(error, "Could not rename the channel."));
    } finally {
      setChannelRenameDraft("");
      setRenamingChannelId(null);
    }
  }

  function cancelRenamingChannel() {
    setChannelRenameDraft("");
    setRenamingChannelId(null);
  }

  async function updateChannel(
    channelId: string,
    input: { name: string; topic?: string; visibility?: ChannelVisibility },
  ) {
    if (!workspace) return;

    const trimmedName = input.name.trim();
    if (!trimmedName) return;

    const nextSlug = createUniqueChannelSlug({
      channels: allChannels,
      currentChannelId: channelId,
      name: trimmedName,
    });

    try {
      await instantDB.transact(
        updateChannelTx(channelId, {
          name: trimmedName,
          slug: nextSlug,
          topic: input.topic?.trim() ?? "",
          visibility: input.visibility,
          workspaceId: workspace.id,
        }),
      );

      if (activeChannel?.id === channelId) {
        navigate(`/workspaces/${props.workspaceSlug}/channels/${nextSlug}`);
      }
    } catch (error) {
      setNotice(toErrorMessage(error, "Could not update the channel."));
    }
  }

  function startEditingMessage(messageId: string) {
    const targetMessage = rootMessages
      .flatMap((message) => [message, ...asArray(message.threadReplies)])
      .find((message) => message.id === messageId);

    if (!targetMessage || targetMessage.deletedAt) {
      return;
    }

    setEditingDraft(targetMessage.body ?? "");
    setEditingMessageId(messageId);
  }

  function cancelEditingMessage() {
    setEditingDraft("");
    setEditingMessageId(null);
  }

  function saveEditingMessage() {
    if (!editingMessageId) {
      return;
    }

    const trimmedBody = editingDraft.trim();

    if (!trimmedBody) {
      return;
    }

    instantDB
      .transact(
        updateMessageTx(editingMessageId, {
          body: trimmedBody,
          updatedAt: new Date(),
        }),
      )
      .catch((error) => {
        setNotice(toErrorMessage(error, "Could not update the message."));
      });
    cancelEditingMessage();
  }

  function sendChannelMessage(files?: UploadedFile[]) {
    if (!activeChannel) {
      return;
    }

    const trimmedBody = channelDraft.trim();
    const hasFiles = files && files.length > 0;

    if (!trimmedBody && !hasFiles) {
      return;
    }

    const nextMessage = createMessageTx({
      body: trimmedBody || undefined,
      channelId: activeChannel.id,
      senderId: props.user.id,
    });

    const attachmentTxs = (files ?? []).map(
      (file) =>
        createMessageAttachmentTx({
          attachmentType: file.attachmentType,
          contentType: file.contentType,
          fileId: file.fileId,
          messageId: nextMessage.messageId,
          name: file.name,
          sizeBytes: file.sizeBytes,
        }).tx,
    );

    const currentUserData = currentUserMember?.$user;
    const optimistic: MessageRecord = {
      id: nextMessage.messageId,
      body: trimmedBody || undefined,
      createdAt: new Date().toISOString(),
      messageType: "message",
      sender: currentUserData ?? { id: props.user.id, email: props.user.email ?? "" },
      reactions: [],
      threadReplies: [],
      attachments: [],
    } as MessageRecord;

    setOptimisticMessages((prev) => [...prev, optimistic]);

    clearChannelDraft();
    instantDB.transact([nextMessage.tx, ...attachmentTxs]).catch((error) => {
      setOptimisticMessages((prev) => prev.filter((m) => m.id !== nextMessage.messageId));
      setNotice(toErrorMessage(error, "Could not send the message."));
    });
  }

  function sendThreadReply(files?: UploadedFile[], alsoSendToChannel?: boolean) {
    if (!activeChannel || !selectedThreadMessage) {
      return;
    }

    const trimmedBody = threadDraft.trim();
    const hasFiles = files && files.length > 0;

    if (!trimmedBody && !hasFiles) {
      return;
    }

    const reply = createMessageTx({
      body: trimmedBody || undefined,
      channelId: activeChannel.id,
      parentMessageId: selectedThreadMessage.id,
      senderId: props.user.id,
    });

    const attachmentTxs = (files ?? []).map(
      (file) =>
        createMessageAttachmentTx({
          attachmentType: file.attachmentType,
          contentType: file.contentType,
          fileId: file.fileId,
          messageId: reply.messageId,
          name: file.name,
          sizeBytes: file.sizeBytes,
        }).tx,
    );

    const allTxs = [reply.tx, ...attachmentTxs];

    let optimisticChannelMessageId: string | undefined;

    if (alsoSendToChannel) {
      const channelMessage = createMessageTx({
        body: trimmedBody || undefined,
        channelId: activeChannel.id,
        senderId: props.user.id,
      });
      optimisticChannelMessageId = channelMessage.messageId;
      allTxs.push(channelMessage.tx);
      allTxs.push(tx.messages[reply.messageId].link({ channelPost: channelMessage.messageId }));
    }

    const currentUserData = currentUserMember?.$user;
    const senderData = currentUserData ?? { id: props.user.id, email: props.user.email ?? "" };

    const optimisticReply: MessageRecord = {
      id: reply.messageId,
      body: trimmedBody || undefined,
      createdAt: new Date().toISOString(),
      messageType: "thread_reply",
      parentMessage: { id: selectedThreadMessage.id } as MessageRecord,
      sender: senderData,
      reactions: [],
      threadReplies: [],
      attachments: [],
    } as MessageRecord;

    setOptimisticMessages((prev) => {
      const next = [...prev, optimisticReply];
      if (optimisticChannelMessageId) {
        next.push({
          id: optimisticChannelMessageId,
          body: trimmedBody || undefined,
          createdAt: new Date().toISOString(),
          messageType: "message",
          sender: senderData,
          reactions: [],
          threadReplies: [],
          attachments: [],
        } as MessageRecord);
      }
      return next;
    });

    setThreadDraft("");
    instantDB.transact(allTxs).catch((error) => {
      setOptimisticMessages((prev) =>
        prev.filter((m) => m.id !== reply.messageId && m.id !== optimisticChannelMessageId),
      );
      setNotice(toErrorMessage(error, "Could not send the thread reply."));
    });
  }

  function deleteMessage(messageId: string) {
    if (editingMessageId === messageId) {
      cancelEditingMessage();
    }

    instantDB
      .transact(
        updateMessageTx(messageId, {
          body: undefined,
          deletedAt: new Date(),
          updatedAt: new Date(),
        }),
      )
      .catch((error) => {
        setNotice(toErrorMessage(error, "Could not delete the message."));
      });
  }

  function toggleReaction(messageId: string, emoji: string) {
    const targetMessage = rootMessages
      .flatMap((message) => [message, ...asArray(message.threadReplies)])
      .find((message) => message.id === messageId);

    if (!targetMessage) {
      return;
    }

    const existingReaction = asArray(targetMessage.reactions).find(
      (reaction) => reaction.$user?.id === props.user.id && reaction.emoji === emoji,
    );

    instantDB
      .transact(
        existingReaction
          ? deleteReactionByKeyTx({
              emoji,
              messageId,
              userId: props.user.id,
            })
          : createReactionTx({
              emoji,
              messageId,
              userId: props.user.id,
            }).tx,
      )
      .catch((error) => {
        setNotice(toErrorMessage(error, "Could not update the reaction."));
      });
  }

  async function createChannel(input: CreateChannelInput) {
    if (!workspace) {
      return;
    }

    const trimmedName = input.name.trim();

    if (!trimmedName) {
      setNotice("Channel name is required.");
      return;
    }

    const slug = createUniqueChannelSlug({
      channels: allChannels,
      currentChannelId: "",
      name: trimmedName,
    });

    try {
      const nextChannel = createChannelTx({
        creatorId: props.user.id,
        name: trimmedName,
        slug,
        topic: input.topic?.trim() || undefined,
        visibility: input.visibility,
        workspaceId: workspace.id,
      });
      await instantDB.transact(nextChannel.tx);
      navigate(`/workspaces/${props.workspaceSlug}/channels/${slug}`);
    } catch (error) {
      setNotice(toErrorMessage(error, "Could not create the channel."));
    }
  }

  async function deleteChannel(channelId: string) {
    if (visibleChannels.length <= 1) {
      setNotice("At least one channel must remain.");
      return;
    }

    try {
      await instantDB.transact(archiveChannelTx(channelId, new Date()));
    } catch (error) {
      setNotice(toErrorMessage(error, "Could not archive the channel."));
    }
  }

  async function leaveChannel(channelId: string) {
    if (visibleChannels.length <= 1) {
      setNotice("At least one channel must remain.");
      return;
    }

    const channel = allChannels.find((item) => item.id === channelId);
    if (!channel) return;

    const membership = asArray(channel.members).find(
      (member) => member.$user?.id === props.user.id,
    );

    if (!membership) {
      setNotice("You are not a member of this channel.");
      return;
    }

    try {
      await instantDB.transact(deleteChannelMemberTx(membership.id));
    } catch (error) {
      setNotice(toErrorMessage(error, "Could not leave the channel."));
    }
  }

  async function joinChannel(channelId: string) {
    const channel = allChannels.find((item) => item.id === channelId);
    if (!channel) return;

    const alreadyMember = asArray(channel.members).some(
      (member) => member.$user?.id === props.user.id,
    );
    if (alreadyMember) return;

    if (channel.visibility === "private" && !canManageChannels) {
      setNotice("You cannot join a private channel without an invitation.");
      return;
    }

    try {
      const result = createChannelMemberTx({
        channelId,
        userId: props.user.id,
      });
      await instantDB.transact(result.tx);
    } catch (error) {
      setNotice(toErrorMessage(error, "Could not join the channel."));
    }
  }

  return {
    activeChannel,
    canManageChannels,
    cancelEditingMessage,
    cancelRenamingChannel,
    channelDraft,
    channelRenameDraft,
    clearChannelDraft,
    closeThread,
    createChannel,
    allWorkspaceMembers: members,
    currentUserMember,
    deleteChannel,
    deleteMessage,
    editingDraft,
    editingMessageId,
    errorMessage:
      workspaceState.error?.message ?? channelsState.error?.message ?? messagesState.error?.message,
    invites,
    isLoading: workspaceState.isLoading || channelsState.isLoading,
    isMessagesLoading: hasActiveChannel && messagesState.isLoading,
    joinChannel,
    leaveChannel,
    messages: rootMessages,
    notice,
    onlineMembers,
    openThread,
    renamingChannelId,
    saveEditingMessage,
    saveRenamingChannel,
    selectedThreadMessage,
    selectedThreadReplies,
    sendChannelMessage,
    sendThreadReply,
    setChannelDraft,
    setChannelRenameDraft,
    setEditingDraft,
    setNotice,
    setThreadDraft,
    startEditingMessage,
    startRenamingChannel,
    threadDraft,
    toggleReaction,
    unjoinedChannels,
    updateChannel,
    usersById,
    visibleChannels,
    workspace,
    workspaceMembersByUserId,
  };
}

function collectMessageUsers(
  usersById: Map<string, InstantUserWithAvatar>,
  message: MessageRecord,
) {
  if (message.sender?.id) {
    usersById.set(message.sender.id, message.sender);
  }

  if (message.parentMessage?.sender?.id) {
    usersById.set(message.parentMessage.sender.id, message.parentMessage.sender);
  }

  for (const reaction of asArray(message.reactions)) {
    if (reaction.$user?.id) {
      usersById.set(reaction.$user.id, reaction.$user);
    }
  }

  for (const reply of asArray(message.threadReplies)) {
    if (reply.sender?.id) {
      usersById.set(reply.sender.id, reply.sender);
    }

    for (const reaction of asArray(reply.reactions)) {
      if (reaction.$user?.id) {
        usersById.set(reaction.$user.id, reaction.$user);
      }
    }
  }
}

function createUniqueChannelSlug(props: {
  channels: ChannelRecord[];
  currentChannelId: string;
  name: string;
}) {
  const baseSlug = slugifyChannelName(props.name);
  const siblingSlugs = new Set(
    props.channels
      .filter((channel) => channel.id !== props.currentChannelId)
      .map((channel) => channel.slug),
  );

  let suffix = 1;
  let nextSlug = baseSlug;

  while (siblingSlugs.has(nextSlug)) {
    suffix += 1;
    nextSlug = `${baseSlug}-${suffix}`;
  }

  return nextSlug;
}
