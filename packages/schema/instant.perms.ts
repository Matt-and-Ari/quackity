// Docs: https://www.instantdb.com/docs/permissions

import type { InstantRules } from "@instantdb/core";

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
      view: "isWorkspaceMember",
    },
    bind: {
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
        "(isInitialOwnerMembership || isWorkspaceOwner || (isWorkspaceAdmin && createsNonAdminMembership)) && validRole",
      delete: "isWorkspaceOwner || (isWorkspaceAdmin && !isTargetManagerOrOwner)",
      update:
        "(isWorkspaceOwner && validUpdatedRole) || (isWorkspaceAdmin && !updatesRole && !isTargetManagerOrOwner)",
      view: "isWorkspaceMember",
    },
    bind: {
      createsNonAdminMembership: "data.role in ['member', 'guest']",
      isInitialOwnerMembership:
        "auth.id != null && auth.id in data.ref('$user.id') && auth.id in data.ref('workspace.owner.id') && data.role == 'admin'",
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
  channels: {
    allow: {
      create: "isCreator && isWorkspaceManager && validVisibility",
      delete: "isWorkspaceManager",
      update: "isWorkspaceManager && validUpdatedVisibility",
      view: "canViewChannel",
    },
    bind: {
      canViewChannel:
        "isWorkspaceManager || isChannelMember || (data.visibility == 'public' && isMemberRole)",
      isChannelMember:
        "auth.id != null && data.id in auth.ref('$user.channelMemberships.channel.id')",
      isCreator: "auth.id != null && auth.id in data.ref('createdBy.id')",
      isMemberRole:
        "auth.id != null && (data.ref('workspace.id')[0] + ':member' in auth.ref('$user.workspaceMemberships.roleKey') || data.ref('workspace.id')[0] + ':admin' in auth.ref('$user.workspaceMemberships.roleKey') || auth.id in data.ref('workspace.owner.id'))",
      isWorkspaceManager: "isWorkspaceOwner || isWorkspaceAdmin",
      isWorkspaceAdmin:
        "auth.id != null && data.ref('workspace.id')[0] + ':admin' in auth.ref('$user.workspaceMemberships.roleKey')",
      isWorkspaceOwner: "auth.id != null && auth.id in data.ref('workspace.owner.id')",
      validUpdatedVisibility:
        "!('visibility' in request.modifiedFields) || newData.visibility in ['public', 'private']",
      validVisibility: "data.visibility in ['public', 'private']",
    },
  },
  channelMembers: {
    allow: {
      create: "isWorkspaceManager",
      delete: "isWorkspaceManager",
      update: "false",
      view: "canViewChannel",
    },
    bind: {
      canViewChannel:
        "isWorkspaceManager || isChannelMember || (data.ref('channel.visibility')[0] == 'public' && isMemberRole)",
      isChannelMember:
        "auth.id != null && data.ref('channel.id')[0] in auth.ref('$user.channelMemberships.channel.id')",
      isMemberRole:
        "auth.id != null && (data.ref('channel.workspace.id')[0] + ':member' in auth.ref('$user.workspaceMemberships.roleKey') || data.ref('channel.workspace.id')[0] + ':admin' in auth.ref('$user.workspaceMemberships.roleKey') || auth.id in data.ref('channel.workspace.owner.id'))",
      isWorkspaceManager: "isWorkspaceOwner || isWorkspaceAdmin",
      isWorkspaceAdmin:
        "auth.id != null && data.ref('channel.workspace.id')[0] + ':admin' in auth.ref('$user.workspaceMemberships.roleKey')",
      isWorkspaceOwner: "auth.id != null && auth.id in data.ref('channel.workspace.owner.id')",
    },
  },
  messages: {
    allow: {
      create: "canViewChannel && isSender && validMessageType && validThreadShape",
      delete: "isSenderOrWorkspaceAdmin",
      update: "isSenderOrWorkspaceAdmin && onlyEditableFields",
      view: "canViewChannel",
    },
    bind: {
      canViewChannel:
        "isWorkspaceManager || isChannelMember || (data.ref('channel.visibility')[0] == 'public' && isMemberRole)",
      isChannelMember:
        "auth.id != null && data.ref('channel.id')[0] in auth.ref('$user.channelMemberships.channel.id')",
      isMemberRole:
        "auth.id != null && (data.ref('channel.workspace.id')[0] + ':member' in auth.ref('$user.workspaceMemberships.roleKey') || data.ref('channel.workspace.id')[0] + ':admin' in auth.ref('$user.workspaceMemberships.roleKey') || auth.id in data.ref('channel.workspace.owner.id'))",
      isSender: "auth.id != null && auth.id in data.ref('sender.id')",
      isSenderOrWorkspaceManager: "isSender || isWorkspaceManager",
      isWorkspaceManager: "isWorkspaceOwner || isWorkspaceAdmin",
      isWorkspaceAdmin:
        "auth.id != null && data.ref('channel.workspace.id')[0] + ':admin' in auth.ref('$user.workspaceMemberships.roleKey')",
      isWorkspaceOwner: "auth.id != null && auth.id in data.ref('channel.workspace.owner.id')",
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
      create: "canViewMessage && isMessageAuthorOrWorkspaceManager && validType",
      delete: "isMessageAuthorOrWorkspaceManager",
      update: "false",
      view: "canViewMessage",
    },
    bind: {
      canViewMessage:
        "isWorkspaceManager || isChannelMember || (data.ref('message.channel.visibility')[0] == 'public' && isMemberRole)",
      isChannelMember:
        "auth.id != null && data.ref('message.channel.id')[0] in auth.ref('$user.channelMemberships.channel.id')",
      isMessageAuthor: "auth.id != null && auth.id in data.ref('message.sender.id')",
      isMessageAuthorOrWorkspaceManager: "isMessageAuthor || isWorkspaceManager",
      isMemberRole:
        "auth.id != null && (data.ref('message.channel.workspace.id')[0] + ':member' in auth.ref('$user.workspaceMemberships.roleKey') || data.ref('message.channel.workspace.id')[0] + ':admin' in auth.ref('$user.workspaceMemberships.roleKey') || auth.id in data.ref('message.channel.workspace.owner.id'))",
      isWorkspaceManager: "isWorkspaceOwner || isWorkspaceAdmin",
      isWorkspaceAdmin:
        "auth.id != null && data.ref('message.channel.workspace.id')[0] + ':admin' in auth.ref('$user.workspaceMemberships.roleKey')",
      isWorkspaceOwner:
        "auth.id != null && auth.id in data.ref('message.channel.workspace.owner.id')",
      validType: "data.attachmentType in ['image', 'video', 'file']",
    },
  },
  reactions: {
    allow: {
      create: "canViewMessage && isActor",
      delete: "isActorOrWorkspaceManager",
      update: "false",
      view: "canViewMessage",
    },
    bind: {
      canViewMessage:
        "isWorkspaceManager || isChannelMember || (data.ref('message.channel.visibility')[0] == 'public' && isMemberRole)",
      isActor: "auth.id != null && auth.id in data.ref('$user.id')",
      isActorOrWorkspaceManager: "isActor || isWorkspaceManager",
      isChannelMember:
        "auth.id != null && data.ref('message.channel.id')[0] in auth.ref('$user.channelMemberships.channel.id')",
      isMemberRole:
        "auth.id != null && (data.ref('message.channel.workspace.id')[0] + ':member' in auth.ref('$user.workspaceMemberships.roleKey') || data.ref('message.channel.workspace.id')[0] + ':admin' in auth.ref('$user.workspaceMemberships.roleKey') || auth.id in data.ref('message.channel.workspace.owner.id'))",
      isWorkspaceManager: "isWorkspaceOwner || isWorkspaceAdmin",
      isWorkspaceAdmin:
        "auth.id != null && data.ref('message.channel.workspace.id')[0] + ':admin' in auth.ref('$user.workspaceMemberships.roleKey')",
      isWorkspaceOwner:
        "auth.id != null && auth.id in data.ref('message.channel.workspace.owner.id')",
    },
  },
} satisfies InstantRules;

export default rules;
