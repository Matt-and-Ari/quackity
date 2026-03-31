import type {
  AttachmentType,
  ChannelMeetingStatus,
  ChannelVisibility,
  MessageType,
  WorkspaceRole,
} from "./constants";

export function createWorkspaceRoleKey(workspaceId: string, role: WorkspaceRole) {
  return `${workspaceId}:${role}`;
}

export function createWorkspaceMemberKey(workspaceId: string, userId: string) {
  return `${workspaceId}:${userId}`;
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function createWorkspaceInviteKey(workspaceId: string, email: string, role: WorkspaceRole) {
  return `${workspaceId}:${normalizeEmail(email)}:${role}`;
}

export function createChannelScopedSlug(workspaceId: string, slug: string) {
  return `${workspaceId}:${slug}`;
}

export function createChannelMembershipKey(channelId: string, userId: string) {
  return `${channelId}:${userId}`;
}

export function createChannelMeetingKey(channelId: string) {
  return `${channelId}:meeting`;
}

export function createReactionKey(messageId: string, userId: string, emoji: string) {
  return `${messageId}:${userId}:${emoji}`;
}

export function createChannelDraftKey(channelId: string, userId: string) {
  return `${channelId}:${userId}`;
}

export function createWorkspaceFilePath(workspaceId: string, fileId: string, filename: string) {
  return `quack/workspaces/${workspaceId}/${fileId}/${filename}`;
}

export type DomainValueSets = {
  attachmentType: AttachmentType;
  channelMeetingStatus: ChannelMeetingStatus;
  channelVisibility: ChannelVisibility;
  messageType: MessageType;
  workspaceRole: WorkspaceRole;
};
