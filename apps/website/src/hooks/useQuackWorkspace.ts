import {
  archiveChannelTx,
  channelsByWorkspaceQuery,
  createChannelTx,
  createMessageAttachmentTx,
  createMessageTx,
  createReactionTx,
  deleteChannelMemberTx,
  deleteReactionByKeyTx,
  messagesByChannelQuery,
  updateChannelTx,
  updateMessageTx,
  workspaceByIdQuery,
  type ChannelVisibility,
} from "@quack/data";
import { useEffect, useMemo, useState } from "react";
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

const EMPTY_CHANNEL_ID = "00000000-0000-0000-0000-000000000000";

interface UseQuackWorkspaceProps {
  channelSlug?: string;
  user: AuthenticatedUser;
  workspaceId: string;
}

export interface UseQuackWorkspaceResult {
  activeChannel: ChannelRecord | null;
  canManageChannels: boolean;
  cancelEditingMessage: () => void;
  cancelRenamingChannel: () => void;
  channelDraft: string;
  channelRenameDraft: string;
  closeThread: () => void;
  createChannel: (input: CreateChannelInput) => Promise<void>;
  currentUserMember?: WorkspaceMemberRecord;
  deleteChannel: (channelId: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  editingDraft: string;
  editingMessageId: string | null;
  errorMessage?: string;
  invites: WorkspaceInviteRecord[];
  isLoading: boolean;
  leaveChannel: (channelId: string) => Promise<void>;
  messages: MessageRecord[];
  notice: string | null;
  onlineMembers: WorkspaceMemberRecord[];
  openThread: (messageId: string) => void;
  renamingChannelId: string | null;
  saveEditingMessage: () => Promise<void>;
  saveRenamingChannel: () => Promise<void>;
  selectedThreadMessage: MessageRecord | null;
  selectedThreadReplies: MessageRecord[];
  sendChannelMessage: (files?: UploadedFile[]) => Promise<void>;
  sendThreadReply: (files?: UploadedFile[]) => Promise<void>;
  setChannelDraft: (value: string) => void;
  setChannelRenameDraft: (value: string) => void;
  setEditingDraft: (value: string) => void;
  setNotice: (value: string | null) => void;
  setThreadDraft: (value: string) => void;
  startEditingMessage: (messageId: string) => void;
  startRenamingChannel: (channelId: string) => void;
  threadDraft: string;
  toggleReaction: (messageId: string, emoji: string) => Promise<void>;
  usersById: Map<string, InstantUserWithAvatar>;
  visibleChannels: ChannelRecord[];
  workspace: WorkspaceSummary | null;
  workspaceMembersByUserId: Map<string, WorkspaceMemberRecord>;
}

export function useQuackWorkspace(props: UseQuackWorkspaceProps): UseQuackWorkspaceResult {
  const [, navigate] = useLocation();
  const [channelDraft, setChannelDraft] = useState("");
  const [channelRenameDraft, setChannelRenameDraft] = useState("");
  const [editingDraft, setEditingDraft] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [renamingChannelId, setRenamingChannelId] = useState<string | null>(null);
  const [selectedThreadMessageId, setSelectedThreadMessageId] = useState<string | null>(null);
  const [threadDraft, setThreadDraft] = useState("");

  const workspaceState = instantDB.useQuery(workspaceByIdQuery(props.workspaceId));
  const channelsState = instantDB.useQuery(channelsByWorkspaceQuery(props.workspaceId));

  const workspace = asArray<WorkspaceSummary>(workspaceState.data?.workspaces)[0] ?? null;
  const members = asArray<WorkspaceMemberRecord>(workspace?.members);
  const invites = asArray<WorkspaceInviteRecord>(workspace?.invites);
  const allChannels = asArray<ChannelRecord>(channelsState.data?.channels);
  const currentUserMember = members.find((member) => member.$user?.id === props.user.id);
  const isOwner = workspace?.owner?.id === props.user.id;
  const isAdmin = currentUserMember?.role === "admin";
  const canManageChannels = Boolean(isOwner || isAdmin);

  const visibleChannels = useMemo(() => {
    return allChannels.filter((channel) => {
      if (channel.archivedAt) {
        return false;
      }

      if (channel.visibility === "public") {
        return currentUserMember !== undefined || isOwner;
      }

      if (canManageChannels) {
        return true;
      }

      return asArray(channel.members).some((member) => member.$user?.id === props.user.id);
    });
  }, [allChannels, canManageChannels, currentUserMember, isOwner, props.user.id]);

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

  useEffect(() => {
    if (!activeChannel) {
      return;
    }

    if (!props.channelSlug || props.channelSlug !== activeChannel.slug) {
      navigate(`/workspaces/${props.workspaceId}/channels/${activeChannel.slug}`, {
        replace: true,
      });
    }
  }, [activeChannel, navigate, props.channelSlug, props.workspaceId]);

  const hasActiveChannel = activeChannel !== null;
  const messagesState = instantDB.useQuery(
    messagesByChannelQuery(activeChannel?.id ?? EMPTY_CHANNEL_ID),
  );
  const rootMessages = useMemo(() => {
    if (!hasActiveChannel) {
      return [];
    }

    return asArray<MessageRecord>(messagesState.data?.messages);
  }, [hasActiveChannel, messagesState.data]);

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
    return asArray(selectedThreadMessage?.threadReplies);
  }, [selectedThreadMessage]);

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
        navigate(`/workspaces/${workspace.id}/channels/${nextSlug}`);
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

  async function saveEditingMessage() {
    if (!editingMessageId) {
      return;
    }

    const trimmedBody = editingDraft.trim();

    if (!trimmedBody) {
      return;
    }

    try {
      await instantDB.transact(
        updateMessageTx(editingMessageId, {
          body: trimmedBody,
          updatedAt: new Date(),
        }),
      );
      cancelEditingMessage();
    } catch (error) {
      setNotice(toErrorMessage(error, "Could not update the message."));
    }
  }

  async function sendChannelMessage(files?: UploadedFile[]) {
    if (!activeChannel) {
      return;
    }

    const trimmedBody = channelDraft.trim();
    const hasFiles = files && files.length > 0;

    if (!trimmedBody && !hasFiles) {
      return;
    }

    try {
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

      await instantDB.transact([nextMessage.tx, ...attachmentTxs]);
      setChannelDraft("");
    } catch (error) {
      setNotice(toErrorMessage(error, "Could not send the message."));
    }
  }

  async function sendThreadReply(files?: UploadedFile[]) {
    if (!activeChannel || !selectedThreadMessage) {
      return;
    }

    const trimmedBody = threadDraft.trim();
    const hasFiles = files && files.length > 0;

    if (!trimmedBody && !hasFiles) {
      return;
    }

    try {
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

      await instantDB.transact([reply.tx, ...attachmentTxs]);
      setThreadDraft("");
    } catch (error) {
      setNotice(toErrorMessage(error, "Could not send the thread reply."));
    }
  }

  async function deleteMessage(messageId: string) {
    try {
      await instantDB.transact(
        updateMessageTx(messageId, {
          body: undefined,
          deletedAt: new Date(),
          updatedAt: new Date(),
        }),
      );

      if (editingMessageId === messageId) {
        cancelEditingMessage();
      }
    } catch (error) {
      setNotice(toErrorMessage(error, "Could not delete the message."));
    }
  }

  async function toggleReaction(messageId: string, emoji: string) {
    const targetMessage = rootMessages
      .flatMap((message) => [message, ...asArray(message.threadReplies)])
      .find((message) => message.id === messageId);

    if (!targetMessage) {
      return;
    }

    const existingReaction = asArray(targetMessage.reactions).find(
      (reaction) => reaction.$user?.id === props.user.id && reaction.emoji === emoji,
    );

    try {
      await instantDB.transact(
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
      );
    } catch (error) {
      setNotice(toErrorMessage(error, "Could not update the reaction."));
    }
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
      navigate(`/workspaces/${workspace.id}/channels/${slug}`);
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

    if (!channel) {
      return;
    }

    if (channel.visibility === "public") {
      setNotice(
        "Public channels are visible to the whole workspace and cannot be left individually.",
      );
      return;
    }

    const membership = asArray(channel.members).find(
      (member) => member.$user?.id === props.user.id,
    );

    if (!membership) {
      setNotice("You are not a direct member of this private channel.");
      return;
    }

    try {
      await instantDB.transact(deleteChannelMemberTx(membership.id));
    } catch (error) {
      setNotice(toErrorMessage(error, "Could not leave the channel."));
    }
  }

  return {
    activeChannel,
    canManageChannels,
    cancelEditingMessage,
    cancelRenamingChannel,
    channelDraft,
    channelRenameDraft,
    closeThread,
    createChannel,
    currentUserMember,
    deleteChannel,
    deleteMessage,
    editingDraft,
    editingMessageId,
    errorMessage:
      workspaceState.error?.message ?? channelsState.error?.message ?? messagesState.error?.message,
    invites,
    isLoading:
      workspaceState.isLoading ||
      channelsState.isLoading ||
      (hasActiveChannel && messagesState.isLoading),
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
