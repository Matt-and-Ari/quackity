export const workspaceRoles = ["admin", "member", "guest"] as const;
export type WorkspaceRole = (typeof workspaceRoles)[number];

export const channelVisibilities = ["public", "private"] as const;
export type ChannelVisibility = (typeof channelVisibilities)[number];

export const messageTypes = ["message", "thread_reply"] as const;
export type MessageType = (typeof messageTypes)[number];

export const attachmentTypes = ["image", "video", "file"] as const;
export type AttachmentType = (typeof attachmentTypes)[number];
