// Docs: https://www.instantdb.com/docs/modeling-data

import { i } from "@instantdb/core";

const _schema = i.schema({
  entities: {
    $files: i.entity({
      path: i.string().unique().indexed(),
      url: i.string(),
    }),
    $streams: i.entity({
      abortReason: i.string().optional(),
      clientId: i.string().unique().indexed(),
      done: i.boolean().optional(),
      size: i.number().optional(),
    }),
    $users: i.entity({
      email: i.string().unique().indexed().optional(),
      imageURL: i.string().optional(),
      type: i.string().optional(),
    }),
    workspaces: i.entity({
      createdAt: i.date().indexed(),
      imageUrl: i.string().optional(),
      name: i.string(),
      slug: i.string().unique().indexed(),
    }),
    workspaceMembers: i.entity({
      acceptedInviteKey: i.string().optional().indexed(),
      displayName: i.string().optional(),
      joinedAt: i.date().indexed(),
      memberKey: i.string().unique().indexed(),
      role: i.string().indexed(),
      roleKey: i.string().indexed(),
      status: i.string().optional(),
    }),
    workspaceInvites: i.entity({
      createdAt: i.date().indexed(),
      email: i.string().indexed(),
      inviteKey: i.string().unique().indexed(),
      role: i.string().indexed(),
    }),
    channels: i.entity({
      archivedAt: i.date().optional().indexed(),
      createdAt: i.date().indexed(),
      dmKey: i.string().optional().unique().indexed(),
      name: i.string(),
      scopedSlug: i.string().unique().indexed(),
      slug: i.string().indexed(),
      topic: i.string().optional(),
      visibility: i.string().indexed(),
    }),
    channelDrafts: i.entity({
      body: i.string().optional(),
      draftKey: i.string().unique().indexed(),
      updatedAt: i.date().indexed(),
    }),
    channelMembers: i.entity({
      joinedAt: i.date().indexed(),
      membershipKey: i.string().unique().indexed(),
    }),
    channelMeetings: i.entity({
      channelMeetingKey: i.string().unique().indexed(),
      cloudflareMeetingId: i.string().unique().indexed(),
      createdAt: i.date().indexed(),
      endedAt: i.date().optional().indexed(),
      lastJoinedAt: i.date().optional().indexed(),
      status: i.string().indexed(),
    }),
    messages: i.entity({
      body: i.string().optional(),
      createdAt: i.date().indexed(),
      deletedAt: i.date().optional().indexed(),
      messageType: i.string().indexed(),
      updatedAt: i.date().optional().indexed(),
    }),
    messageAttachments: i.entity({
      attachmentType: i.string().indexed(),
      contentType: i.string().optional(),
      createdAt: i.date().indexed(),
      name: i.string(),
      sizeBytes: i.number().optional(),
    }),
    reactions: i.entity({
      createdAt: i.date().indexed(),
      emoji: i.string().indexed(),
      reactionKey: i.string().unique().indexed(),
    }),
    mentions: i.entity({
      channelId: i.string().indexed(),
      createdAt: i.date().indexed(),
      mentionKey: i.string().unique().indexed(),
      read: i.boolean().indexed(),
    }),
  },
  links: {
    $streams$files: {
      forward: {
        on: "$streams",
        has: "many",
        label: "$files",
      },
      reverse: {
        on: "$files",
        has: "one",
        label: "$stream",
        onDelete: "cascade",
      },
    },
    $usersLinkedPrimaryUser: {
      forward: {
        on: "$users",
        has: "one",
        label: "linkedPrimaryUser",
        onDelete: "cascade",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "linkedGuestUsers",
      },
    },
    $usersAvatar: {
      forward: {
        on: "$users",
        has: "one",
        label: "avatar",
      },
      reverse: {
        on: "$files",
        has: "many",
        label: "$usersWithAvatar",
      },
    },
    workspaceCreatedBy: {
      forward: {
        on: "workspaces",
        has: "one",
        label: "createdBy",
        required: true,
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "createdWorkspaces",
      },
    },
    workspaceOwner: {
      forward: {
        on: "workspaces",
        has: "one",
        label: "owner",
        required: true,
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "ownedWorkspaces",
      },
    },
    workspaceMemberWorkspace: {
      forward: {
        on: "workspaceMembers",
        has: "one",
        label: "workspace",
        required: true,
      },
      reverse: {
        on: "workspaces",
        has: "many",
        label: "members",
      },
    },
    workspaceMemberUser: {
      forward: {
        on: "workspaceMembers",
        has: "one",
        label: "$user",
        required: true,
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "workspaceMemberships",
      },
    },
    workspaceInviteWorkspace: {
      forward: {
        on: "workspaceInvites",
        has: "one",
        label: "workspace",
        required: true,
      },
      reverse: {
        on: "workspaces",
        has: "many",
        label: "invites",
      },
    },
    workspaceInviteInvitedBy: {
      forward: {
        on: "workspaceInvites",
        has: "one",
        label: "invitedBy",
        required: true,
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "sentWorkspaceInvites",
      },
    },
    channelWorkspace: {
      forward: {
        on: "channels",
        has: "one",
        label: "workspace",
        required: true,
      },
      reverse: {
        on: "workspaces",
        has: "many",
        label: "channels",
      },
    },
    channelCreatedBy: {
      forward: {
        on: "channels",
        has: "one",
        label: "createdBy",
        required: true,
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "createdChannels",
      },
    },
    channelDraftChannel: {
      forward: {
        on: "channelDrafts",
        has: "one",
        label: "channel",
        required: true,
      },
      reverse: {
        on: "channels",
        has: "many",
        label: "drafts",
      },
    },
    channelDraftUser: {
      forward: {
        on: "channelDrafts",
        has: "one",
        label: "$user",
        required: true,
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "channelDrafts",
      },
    },
    channelDraftAttachmentFile: {
      forward: {
        on: "channelDrafts",
        has: "many",
        label: "attachments",
      },
      reverse: {
        on: "$files",
        has: "many",
        label: "channelDrafts",
      },
    },
    channelMemberChannel: {
      forward: {
        on: "channelMembers",
        has: "one",
        label: "channel",
        required: true,
      },
      reverse: {
        on: "channels",
        has: "many",
        label: "members",
      },
    },
    channelMemberUser: {
      forward: {
        on: "channelMembers",
        has: "one",
        label: "$user",
        required: true,
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "channelMemberships",
      },
    },
    channelMeetingChannel: {
      forward: {
        on: "channelMeetings",
        has: "one",
        label: "channel",
        required: true,
      },
      reverse: {
        on: "channels",
        has: "one",
        label: "meeting",
      },
    },
    channelMeetingCreatedBy: {
      forward: {
        on: "channelMeetings",
        has: "one",
        label: "createdBy",
        required: true,
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "createdChannelMeetings",
      },
    },
    messageChannel: {
      forward: {
        on: "messages",
        has: "one",
        label: "channel",
        required: true,
      },
      reverse: {
        on: "channels",
        has: "many",
        label: "messages",
      },
    },
    messageSender: {
      forward: {
        on: "messages",
        has: "one",
        label: "sender",
        required: true,
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "sentMessages",
      },
    },
    messageParentMessage: {
      forward: {
        on: "messages",
        has: "one",
        label: "parentMessage",
      },
      reverse: {
        on: "messages",
        has: "many",
        label: "threadReplies",
      },
    },
    messageChannelPost: {
      forward: {
        on: "messages",
        has: "one",
        label: "channelPost",
      },
      reverse: {
        on: "messages",
        has: "one",
        label: "threadSource",
      },
    },
    messageAttachmentMessage: {
      forward: {
        on: "messageAttachments",
        has: "one",
        label: "message",
        required: true,
      },
      reverse: {
        on: "messages",
        has: "many",
        label: "attachments",
      },
    },
    messageAttachmentFile: {
      forward: {
        on: "messageAttachments",
        has: "one",
        label: "$file",
        required: true,
      },
      reverse: {
        on: "$files",
        has: "many",
        label: "messageAttachments",
      },
    },
    reactionMessage: {
      forward: {
        on: "reactions",
        has: "one",
        label: "message",
        required: true,
      },
      reverse: {
        on: "messages",
        has: "many",
        label: "reactions",
      },
    },
    reactionUser: {
      forward: {
        on: "reactions",
        has: "one",
        label: "$user",
        required: true,
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "reactions",
      },
    },
    mentionMessage: {
      forward: {
        on: "mentions",
        has: "one",
        label: "message",
        required: true,
      },
      reverse: {
        on: "messages",
        has: "many",
        label: "mentions",
      },
    },
    mentionUser: {
      forward: {
        on: "mentions",
        has: "one",
        label: "$user",
        required: true,
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "mentions",
      },
    },
    mentionSender: {
      forward: {
        on: "mentions",
        has: "one",
        label: "sender",
        required: true,
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "sentMentions",
      },
    },
  },
  rooms: {
    channel: {
      presence: i.entity({
        displayName: i.string(),
        userId: i.string(),
      }),
    },
  },
});

// This helps TypeScript display nicer intellisense
type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
