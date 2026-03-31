// Docs: https://www.instantdb.com/docs/permissions

import type { InstantRules } from "@instantdb/core";

function buildChannelAccessBinds(input: {
  channelId: string;
  visibility: string;
  workspaceId: string;
  workspaceOwnerIds: string;
}) {
  return {
    canViewChannel: `isWorkspaceManager || isChannelMember || (${input.visibility} == 'public' && isWorkspaceViewer)`,
    isChannelMember: `auth.id != null && ${input.channelId} in auth.ref('$user.channelMemberships.channel.id')`,
    isWorkspaceAdmin: `auth.id != null && ${input.workspaceId} + ':admin' in auth.ref('$user.workspaceMemberships.roleKey')`,
    isWorkspaceManager: "isWorkspaceOwner || isWorkspaceAdmin",
    isWorkspaceOwner: `auth.id != null && auth.id in ${input.workspaceOwnerIds}`,
    isWorkspaceViewer:
      `auth.id != null && (` +
      `${input.workspaceId} + ':guest' in auth.ref('$user.workspaceMemberships.roleKey') || ` +
      `${input.workspaceId} + ':member' in auth.ref('$user.workspaceMemberships.roleKey') || ` +
      `${input.workspaceId} + ':admin' in auth.ref('$user.workspaceMemberships.roleKey') || ` +
      `auth.id in ${input.workspaceOwnerIds})`,
  };
}

const rules = {
  $default: {
    allow: {
      $default: "false",
    },
  },
  attrs: {
    allow: {
      create: "false",
    },
  },
  $users: {
    allow: {
      create: "true",
      update: "auth.id != null && auth.id == data.id",
      view: "isSelf || sharesWorkspace",
    },
    bind: {
      isSelf: "auth.id != null && auth.id == data.id",
      sharesWorkspace:
        "auth.id != null && data.id in auth.ref('$user.workspaceMemberships.workspace.members.$user.id')",
    },
    fields: {
      email: "isSelf || sharesWorkspace",
    },
  },
  $files: {
    allow: {
      create: "auth.id != null && data.path.startsWith('quack/workspaces/')",
      delete: "auth.id != null && data.path.startsWith('quack/workspaces/')",
      view: "auth.id != null && data.path.startsWith('quack/workspaces/')",
    },
  },
  $streams: {
    allow: {
      create: "auth.id != null",
      delete: "auth.id != null",
      update: "auth.id != null",
      view: "auth.id != null",
    },
  },
  workspaces: {
    allow: {
      create: "isCreator && isOwner",
      delete: "isOwner",
      update: "isOwner",
      view: "isWorkspaceMember || hasPendingInvite",
    },
    bind: {
      hasPendingInvite:
        "auth.id != null && auth.ref('$user.email')[0] != null && (" +
        "data.id + ':' + auth.ref('$user.email')[0] + ':admin' in data.ref('invites.inviteKey') || " +
        "data.id + ':' + auth.ref('$user.email')[0] + ':member' in data.ref('invites.inviteKey') || " +
        "data.id + ':' + auth.ref('$user.email')[0] + ':guest' in data.ref('invites.inviteKey'))",
      isCreator: "auth.id != null && auth.id in data.ref('createdBy.id')",
      isOwner: "auth.id != null && auth.id in data.ref('owner.id')",
      isWorkspaceAdmin:
        "auth.id != null && data.id + ':admin' in auth.ref('$user.workspaceMemberships.roleKey')",
      isWorkspaceMember: "auth.id != null && auth.id in data.ref('members.$user.id')",
    },
  },
  workspaceMembers: {
    allow: {
      create:
        "(isInitialOwnerMembership || isWorkspaceOwner || (isWorkspaceAdmin && createsNonAdminMembership) || isInviteeCreatingMembership) && validRole",
      delete: "isWorkspaceOwner || (isWorkspaceAdmin && !isTargetManagerOrOwner)",
      update:
        "(isWorkspaceOwner && validUpdatedRole) || (isWorkspaceAdmin && !updatesRole && !isTargetManagerOrOwner)",
      view: "isWorkspaceMember",
    },
    bind: {
      createsNonAdminMembership: "data.role in ['member', 'guest']",
      isInitialOwnerMembership:
        "auth.id != null && auth.id in data.ref('$user.id') && auth.id in data.ref('workspace.owner.id') && data.role == 'admin'",
      isInviteeCreatingMembership:
        "auth.id != null && auth.id in data.ref('$user.id') && auth.ref('$user.email')[0] != null && data.acceptedInviteKey == data.ref('workspace.id')[0] + ':' + auth.ref('$user.email')[0] + ':' + data.role && data.acceptedInviteKey in data.ref('workspace.invites.inviteKey')",
      isTargetManagerOrOwner:
        "data.role == 'admin' || data.ref('workspace.owner.id')[0] in data.ref('$user.id')",
      isWorkspaceAdmin:
        "auth.id != null && data.ref('workspace.id')[0] + ':admin' in auth.ref('$user.workspaceMemberships.roleKey')",
      isWorkspaceOwner: "auth.id != null && auth.id in data.ref('workspace.owner.id')",
      isWorkspaceMember:
        "auth.id != null && data.ref('workspace.id')[0] in auth.ref('$user.workspaceMemberships.workspace.id')",
      updatesRole: "'role' in request.modifiedFields",
      validRole: "data.role in ['admin', 'member', 'guest']",
      validUpdatedRole:
        "!('role' in request.modifiedFields) || newData.role in ['admin', 'member', 'guest']",
    },
  },
  workspaceInvites: {
    allow: {
      create: "(isWorkspaceOwner || (isWorkspaceAdmin && createsNonAdminInvite)) && validRole",
      delete: "isWorkspaceManager || isInvitee",
      update: "false",
      view: "isWorkspaceManager || isInvitee",
    },
    bind: {
      createsNonAdminInvite: "data.role in ['member', 'guest']",
      isInvitee:
        "auth.id != null && auth.ref('$user.email')[0] != null && auth.ref('$user.email')[0] == data.email",
      isWorkspaceAdmin:
        "auth.id != null && data.ref('workspace.id')[0] + ':admin' in auth.ref('$user.workspaceMemberships.roleKey')",
      isWorkspaceManager: "isWorkspaceOwner || isWorkspaceAdmin",
      isWorkspaceOwner: "auth.id != null && auth.id in data.ref('workspace.owner.id')",
      validRole: "data.role in ['admin', 'member', 'guest']",
    },
  },
  channels: {
    allow: {
      create: "isCreator && isWorkspaceManager && validVisibility",
      delete: "isWorkspaceManager",
      update: "isWorkspaceManager && validUpdatedVisibility",
      view: "canViewChannel",
    },
    bind: {
      ...buildChannelAccessBinds({
        channelId: "data.id",
        visibility: "data.visibility",
        workspaceId: "data.ref('workspace.id')[0]",
        workspaceOwnerIds: "data.ref('workspace.owner.id')",
      }),
      isCreator: "auth.id != null && auth.id in data.ref('createdBy.id')",
      validUpdatedVisibility:
        "!('visibility' in request.modifiedFields) || newData.visibility in ['public', 'private']",
      validVisibility: "data.visibility in ['public', 'private']",
    },
  },
  channelDrafts: {
    allow: {
      create: "isOwner && canViewChannel",
      delete: "isOwner",
      update: "isOwner",
      view: "isOwner",
    },
    bind: {
      ...buildChannelAccessBinds({
        channelId: "data.ref('channel.id')[0]",
        visibility: "data.ref('channel.visibility')[0]",
        workspaceId: "data.ref('channel.workspace.id')[0]",
        workspaceOwnerIds: "data.ref('channel.workspace.owner.id')",
      }),
      isOwner: "auth.id != null && auth.id in data.ref('$user.id')",
    },
  },
  channelMembers: {
    allow: {
      create: "isWorkspaceManager || (isSelf && isPublicChannel && isWorkspaceViewer)",
      delete: "isWorkspaceManager || isSelf",
      update: "false",
      view: "canViewChannel",
    },
    bind: {
      ...buildChannelAccessBinds({
        channelId: "data.ref('channel.id')[0]",
        visibility: "data.ref('channel.visibility')[0]",
        workspaceId: "data.ref('channel.workspace.id')[0]",
        workspaceOwnerIds: "data.ref('channel.workspace.owner.id')",
      }),
      isPublicChannel: "data.ref('channel.visibility')[0] == 'public'",
      isSelf: "auth.id != null && auth.id in data.ref('$user.id')",
    },
  },
  channelMeetings: {
    allow: {
      create: "isWorkspaceManager",
      delete: "isWorkspaceManager",
      update: "isWorkspaceManager",
      view: "canViewChannel",
    },
    bind: {
      ...buildChannelAccessBinds({
        channelId: "data.ref('channel.id')[0]",
        visibility: "data.ref('channel.visibility')[0]",
        workspaceId: "data.ref('channel.workspace.id')[0]",
        workspaceOwnerIds: "data.ref('channel.workspace.owner.id')",
      }),
    },
  },
  messages: {
    allow: {
      create: "canViewChannel && isSender && validMessageType && validThreadShape",
      delete: "isSenderOrWorkspaceManager",
      update: "isSenderOrWorkspaceManager && onlyEditableFields",
      view: "canViewChannel",
    },
    bind: {
      ...buildChannelAccessBinds({
        channelId: "data.ref('channel.id')[0]",
        visibility: "data.ref('channel.visibility')[0]",
        workspaceId: "data.ref('channel.workspace.id')[0]",
        workspaceOwnerIds: "data.ref('channel.workspace.owner.id')",
      }),
      isSender: "auth.id != null && auth.id in data.ref('sender.id')",
      isSenderOrWorkspaceManager: "isSender || isWorkspaceManager",
      onlyEditableFields:
        "request.modifiedFields.all(field, field in ['body', 'updatedAt', 'deletedAt'])",
      topLevelMessage: "data.messageType == 'message' && data.ref('parentMessage.id') == []",
      threadReply:
        "data.messageType == 'thread_reply' && data.ref('parentMessage.id') != [] && data.ref('parentMessage.parentMessage.id') == [] && data.ref('channel.id')[0] == data.ref('parentMessage.channel.id')[0]",
      validMessageType: "data.messageType in ['message', 'thread_reply']",
      validThreadShape: "topLevelMessage || threadReply",
    },
  },
  messageAttachments: {
    allow: {
      create: "canViewChannel && isMessageAuthorOrWorkspaceManager && validType",
      delete: "isMessageAuthorOrWorkspaceManager",
      update: "false",
      view: "canViewChannel",
    },
    bind: {
      ...buildChannelAccessBinds({
        channelId: "data.ref('message.channel.id')[0]",
        visibility: "data.ref('message.channel.visibility')[0]",
        workspaceId: "data.ref('message.channel.workspace.id')[0]",
        workspaceOwnerIds: "data.ref('message.channel.workspace.owner.id')",
      }),
      isMessageAuthor: "auth.id != null && auth.id in data.ref('message.sender.id')",
      isMessageAuthorOrWorkspaceManager: "isMessageAuthor || isWorkspaceManager",
      validType: "data.attachmentType in ['image', 'video', 'file']",
    },
  },
  reactions: {
    allow: {
      create: "canViewChannel && isActor",
      delete: "isActorOrWorkspaceManager",
      update: "false",
      view: "canViewChannel",
    },
    bind: {
      ...buildChannelAccessBinds({
        channelId: "data.ref('message.channel.id')[0]",
        visibility: "data.ref('message.channel.visibility')[0]",
        workspaceId: "data.ref('message.channel.workspace.id')[0]",
        workspaceOwnerIds: "data.ref('message.channel.workspace.owner.id')",
      }),
      isActor: "auth.id != null && auth.id in data.ref('$user.id')",
      isActorOrWorkspaceManager: "isActor || isWorkspaceManager",
    },
  },
  mentions: {
    allow: {
      create: "canViewChannel && isSender",
      delete: "isSenderOrMentionedUser",
      update: "isMentionedUser && onlyReadField",
      view: "canViewChannel",
    },
    bind: {
      ...buildChannelAccessBinds({
        channelId: "data.ref('message.channel.id')[0]",
        visibility: "data.ref('message.channel.visibility')[0]",
        workspaceId: "data.ref('message.channel.workspace.id')[0]",
        workspaceOwnerIds: "data.ref('message.channel.workspace.owner.id')",
      }),
      isMentionedUser: "auth.id != null && auth.id in data.ref('$user.id')",
      isSender: "auth.id != null && auth.id in data.ref('sender.id')",
      isSenderOrMentionedUser: "isSender || isMentionedUser",
      onlyReadField: "request.modifiedFields.all(field, field in ['read'])",
    },
  },
} satisfies InstantRules;

export default rules;
