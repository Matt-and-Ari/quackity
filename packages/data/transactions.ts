import { id, tx } from "@instantdb/core";

import {
  type AttachmentType,
  type ChannelMeetingStatus,
  type ChannelVisibility,
  type WorkspaceRole,
} from "./constants";
import {
  createChannelMembershipKey,
  createChannelMeetingKey,
  createChannelScopedSlug,
  createReactionKey,
  createWorkspaceInviteKey,
  createWorkspaceMemberKey,
  createWorkspaceRoleKey,
} from "./keys";

type InstantDate = Date | number | string;

function toInstantDate(value?: InstantDate) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return value ?? new Date().toISOString();
}

export function createWorkspaceTx(input: {
  createdAt?: InstantDate;
  displayName?: string;
  imageUrl?: string;
  name: string;
  ownerId: string;
  ownerMembershipId?: string;
  slug: string;
  status?: string;
  workspaceId?: string;
}) {
  const workspaceId = input.workspaceId ?? id();
  const ownerMembershipId = input.ownerMembershipId ?? id();
  const createdAt = toInstantDate(input.createdAt);

  return {
    workspaceId,
    ownerMembershipId,
    tx: [
      tx.workspaces[workspaceId]
        .create({
          createdAt,
          imageUrl: input.imageUrl,
          name: input.name,
          slug: input.slug,
        })
        .link({
          createdBy: input.ownerId,
          owner: input.ownerId,
        }),
      tx.workspaceMembers[ownerMembershipId]
        .create({
          displayName: input.displayName,
          joinedAt: createdAt,
          memberKey: createWorkspaceMemberKey(workspaceId, input.ownerId),
          role: "admin",
          roleKey: createWorkspaceRoleKey(workspaceId, "admin"),
          status: input.status,
        })
        .link({
          workspace: workspaceId,
          $user: input.ownerId,
        }),
    ],
  };
}

export function updateWorkspaceTx(
  workspaceId: string,
  patch: {
    imageUrl?: string;
    name?: string;
    slug?: string;
  },
) {
  return tx.workspaces[workspaceId].update(patch);
}

export function deleteWorkspaceTx(workspaceId: string) {
  return tx.workspaces[workspaceId].delete();
}

export function createWorkspaceMemberTx(input: {
  acceptedInviteKey?: string;
  displayName?: string;
  joinedAt?: InstantDate;
  membershipId?: string;
  role: WorkspaceRole;
  status?: string;
  userId: string;
  workspaceId: string;
}) {
  const membershipId = input.membershipId ?? id();

  return {
    membershipId,
    tx: tx.workspaceMembers[membershipId]
      .create({
        acceptedInviteKey: input.acceptedInviteKey,
        displayName: input.displayName,
        joinedAt: toInstantDate(input.joinedAt),
        memberKey: createWorkspaceMemberKey(input.workspaceId, input.userId),
        role: input.role,
        roleKey: createWorkspaceRoleKey(input.workspaceId, input.role),
        status: input.status,
      })
      .link({
        workspace: input.workspaceId,
        $user: input.userId,
      }),
  };
}

export function createWorkspaceInviteTx(input: {
  createdAt?: InstantDate;
  email: string;
  inviteId?: string;
  invitedById: string;
  role: WorkspaceRole;
  workspaceId: string;
}) {
  const inviteId = input.inviteId ?? id();
  const createdAt = toInstantDate(input.createdAt);

  return {
    inviteId,
    tx: tx.workspaceInvites[inviteId]
      .create({
        createdAt,
        email: input.email.trim().toLowerCase(),
        inviteKey: createWorkspaceInviteKey(input.workspaceId, input.email, input.role),
        role: input.role,
      })
      .link({
        invitedBy: input.invitedById,
        workspace: input.workspaceId,
      }),
  };
}

export function deleteWorkspaceInviteTx(inviteId: string) {
  return tx.workspaceInvites[inviteId].delete();
}

export function deleteWorkspaceInviteByKeyTx(input: {
  email: string;
  role: WorkspaceRole;
  workspaceId: string;
}) {
  return tx.workspaceInvites
    .lookup("inviteKey", createWorkspaceInviteKey(input.workspaceId, input.email, input.role))
    .delete();
}

export function updateWorkspaceMemberTx(
  membershipId: string,
  patch: {
    displayName?: string;
    status?: string;
  },
) {
  return tx.workspaceMembers[membershipId].update(patch);
}

export function setWorkspaceMemberRoleTx(input: {
  membershipId: string;
  role: WorkspaceRole;
  workspaceId: string;
}) {
  return tx.workspaceMembers[input.membershipId].update({
    role: input.role,
    roleKey: createWorkspaceRoleKey(input.workspaceId, input.role),
  });
}

export function deleteWorkspaceMemberTx(membershipId: string) {
  return tx.workspaceMembers[membershipId].delete();
}

export function createChannelTx(input: {
  addCreatorMembership?: boolean;
  channelId?: string;
  createdAt?: InstantDate;
  creatorChannelMembershipId?: string;
  creatorId: string;
  name: string;
  slug: string;
  topic?: string;
  visibility: ChannelVisibility;
  workspaceId: string;
}) {
  const channelId = input.channelId ?? id();
  const createdAt = toInstantDate(input.createdAt);
  const creatorChannelMembershipId = input.creatorChannelMembershipId ?? id();
  const shouldAddCreatorMembership = input.addCreatorMembership ?? input.visibility === "private";

  const transactions = [
    tx.channels[channelId]
      .create({
        archivedAt: undefined,
        createdAt,
        name: input.name,
        scopedSlug: createChannelScopedSlug(input.workspaceId, input.slug),
        slug: input.slug,
        topic: input.topic,
        visibility: input.visibility,
      })
      .link({
        createdBy: input.creatorId,
        workspace: input.workspaceId,
      }),
  ];

  if (shouldAddCreatorMembership) {
    transactions.push(
      tx.channelMembers[creatorChannelMembershipId]
        .create({
          joinedAt: createdAt,
          membershipKey: createChannelMembershipKey(channelId, input.creatorId),
        })
        .link({
          channel: channelId,
          $user: input.creatorId,
        }),
    );
  }

  return {
    channelId,
    creatorChannelMembershipId,
    tx: transactions,
  };
}

export function updateChannelTx(
  channelId: string,
  input: {
    name?: string;
    slug?: string;
    topic?: string;
    visibility?: ChannelVisibility;
    workspaceId?: string;
  },
) {
  const patch: {
    name?: string;
    scopedSlug?: string;
    slug?: string;
    topic?: string;
    visibility?: ChannelVisibility;
  } = {
    name: input.name,
    topic: input.topic,
    visibility: input.visibility,
  };

  if (input.slug) {
    patch.slug = input.slug;

    if (input.workspaceId) {
      patch.scopedSlug = createChannelScopedSlug(input.workspaceId, input.slug);
    }
  }

  return tx.channels[channelId].update(patch);
}

export function archiveChannelTx(channelId: string, archivedAt?: InstantDate) {
  return tx.channels[channelId].update({
    archivedAt: toInstantDate(archivedAt),
  });
}

export function deleteChannelTx(channelId: string) {
  return tx.channels[channelId].delete();
}

export function createChannelMemberTx(input: {
  channelId: string;
  joinedAt?: InstantDate;
  membershipId?: string;
  userId: string;
}) {
  const membershipId = input.membershipId ?? id();

  return {
    membershipId,
    tx: tx.channelMembers[membershipId]
      .create({
        joinedAt: toInstantDate(input.joinedAt),
        membershipKey: createChannelMembershipKey(input.channelId, input.userId),
      })
      .link({
        channel: input.channelId,
        $user: input.userId,
      }),
  };
}

export function deleteChannelMemberTx(membershipId: string) {
  return tx.channelMembers[membershipId].delete();
}

export function createChannelMeetingTx(input: {
  channelId: string;
  cloudflareMeetingId: string;
  createdAt?: InstantDate;
  creatorId: string;
  lastJoinedAt?: InstantDate;
  meetingId?: string;
  status?: ChannelMeetingStatus;
}) {
  const meetingId = input.meetingId ?? id();
  const createdAt = toInstantDate(input.createdAt);

  return {
    meetingId,
    tx: tx.channelMeetings[meetingId]
      .create({
        channelMeetingKey: createChannelMeetingKey(input.channelId),
        cloudflareMeetingId: input.cloudflareMeetingId,
        createdAt,
        endedAt: undefined,
        lastJoinedAt:
          input.lastJoinedAt === undefined ? undefined : toInstantDate(input.lastJoinedAt),
        status: input.status ?? "active",
      })
      .link({
        channel: input.channelId,
        createdBy: input.creatorId,
      }),
  };
}

export function updateChannelMeetingTx(
  meetingId: string,
  patch: {
    cloudflareMeetingId?: string;
    endedAt?: InstantDate;
    lastJoinedAt?: InstantDate;
    status?: ChannelMeetingStatus;
  },
) {
  return tx.channelMeetings[meetingId].update({
    cloudflareMeetingId: patch.cloudflareMeetingId,
    endedAt: patch.endedAt === undefined ? undefined : toInstantDate(patch.endedAt),
    lastJoinedAt: patch.lastJoinedAt === undefined ? undefined : toInstantDate(patch.lastJoinedAt),
    status: patch.status,
  });
}

export function deleteChannelMeetingTx(meetingId: string) {
  return tx.channelMeetings[meetingId].delete();
}

export function createMessageTx(input: {
  body?: string;
  channelId: string;
  createdAt?: InstantDate;
  messageId?: string;
  parentMessageId?: string;
  senderId: string;
}) {
  const messageId = input.messageId ?? id();
  const linkArgs: {
    channel: string;
    parentMessage?: string;
    sender: string;
  } = {
    channel: input.channelId,
    sender: input.senderId,
  };

  if (input.parentMessageId) {
    linkArgs.parentMessage = input.parentMessageId;
  }

  return {
    messageId,
    tx: tx.messages[messageId]
      .create({
        body: input.body,
        createdAt: toInstantDate(input.createdAt),
        deletedAt: undefined,
        messageType: input.parentMessageId ? "thread_reply" : "message",
        updatedAt: undefined,
      })
      .link(linkArgs),
  };
}

export function updateMessageTx(
  messageId: string,
  patch: {
    body?: string;
    deletedAt?: InstantDate;
    updatedAt?: InstantDate;
  },
) {
  return tx.messages[messageId].update({
    body: patch.body,
    deletedAt: patch.deletedAt === undefined ? undefined : toInstantDate(patch.deletedAt),
    updatedAt: patch.updatedAt === undefined ? undefined : toInstantDate(patch.updatedAt),
  });
}

export function softDeleteMessageTx(messageId: string, deletedAt?: InstantDate) {
  const timestamp = toInstantDate(deletedAt);

  return tx.messages[messageId].update({
    deletedAt: timestamp,
    updatedAt: timestamp,
  });
}

export function deleteMessageTx(messageId: string) {
  return tx.messages[messageId].delete();
}

export function createMessageAttachmentTx(input: {
  attachmentId?: string;
  attachmentType: AttachmentType;
  contentType?: string;
  createdAt?: InstantDate;
  fileId: string;
  messageId: string;
  name: string;
  sizeBytes?: number;
}) {
  const attachmentId = input.attachmentId ?? id();

  return {
    attachmentId,
    tx: tx.messageAttachments[attachmentId]
      .create({
        attachmentType: input.attachmentType,
        contentType: input.contentType,
        createdAt: toInstantDate(input.createdAt),
        name: input.name,
        sizeBytes: input.sizeBytes,
      })
      .link({
        $file: input.fileId,
        message: input.messageId,
      }),
  };
}

export function updateMessageAttachmentTx(
  attachmentId: string,
  patch: {
    attachmentType?: AttachmentType;
    contentType?: string;
    name?: string;
    sizeBytes?: number;
  },
) {
  return tx.messageAttachments[attachmentId].update(patch);
}

export function deleteMessageAttachmentTx(attachmentId: string) {
  return tx.messageAttachments[attachmentId].delete();
}

export function createReactionTx(input: {
  createdAt?: InstantDate;
  emoji: string;
  messageId: string;
  reactionId?: string;
  userId: string;
}) {
  const reactionId = input.reactionId ?? id();

  return {
    reactionId,
    tx: tx.reactions[reactionId]
      .create({
        createdAt: toInstantDate(input.createdAt),
        emoji: input.emoji,
        reactionKey: createReactionKey(input.messageId, input.userId, input.emoji),
      })
      .link({
        $user: input.userId,
        message: input.messageId,
      }),
  };
}

export function deleteReactionTx(reactionId: string) {
  return tx.reactions[reactionId].delete();
}

export function updateUserProfileTx(
  userId: string,
  patch: {
    imageURL?: string;
  },
) {
  return tx.$users[userId].update(patch);
}

export function deleteReactionByKeyTx(input: { emoji: string; messageId: string; userId: string }) {
  return tx.reactions
    .lookup("reactionKey", createReactionKey(input.messageId, input.userId, input.emoji))
    .delete();
}
