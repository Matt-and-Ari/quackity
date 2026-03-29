import type { InstaQLEntity } from "@instantdb/core";
import type { User as AuthUser } from "@instantdb/react";
import type { AppSchema } from "@quack/schema";

export type AuthenticatedUser = AuthUser;

export type InstantUserEntity = InstaQLEntity<AppSchema, "$users">;
export type WorkspaceEntity = InstaQLEntity<AppSchema, "workspaces">;
export type WorkspaceMemberEntity = InstaQLEntity<AppSchema, "workspaceMembers">;
export type WorkspaceInviteEntity = InstaQLEntity<AppSchema, "workspaceInvites">;
export type ChannelEntity = InstaQLEntity<AppSchema, "channels">;
export type ChannelMemberEntity = InstaQLEntity<AppSchema, "channelMembers">;
export type MessageEntity = InstaQLEntity<AppSchema, "messages">;
export type MessageAttachmentEntity = InstaQLEntity<AppSchema, "messageAttachments">;
export type ReactionEntity = InstaQLEntity<AppSchema, "reactions">;

export interface WorkspaceSummary extends WorkspaceEntity {
  channels?: ChannelRecord[] | null;
  invites?: WorkspaceInviteRecord[] | null;
  members?: WorkspaceMemberRecord[] | null;
  owner?: InstantUserEntity | null;
}

export interface WorkspaceInviteRecord extends WorkspaceInviteEntity {
  invitedBy?: InstantUserEntity | null;
  workspace?: WorkspaceSummary | null;
}

export interface WorkspaceMemberRecord extends WorkspaceMemberEntity {
  $user?: InstantUserEntity | null;
  workspace?: WorkspaceSummary | null;
}

export interface ChannelRecord extends ChannelEntity {
  createdBy?: InstantUserEntity | null;
  members?: ChannelMemberRecord[] | null;
  workspace?: WorkspaceSummary | null;
}

export interface ChannelMemberRecord extends ChannelMemberEntity {
  $user?: InstantUserEntity | null;
  channel?: ChannelRecord | null;
}

export interface MessageAttachmentRecord extends MessageAttachmentEntity {
  $file?: {
    id: string;
    path?: string;
    url?: string;
  } | null;
}

export interface ReactionRecord extends ReactionEntity {
  $user?: InstantUserEntity | null;
}

export interface MessageRecord extends MessageEntity {
  attachments?: MessageAttachmentRecord[] | null;
  channel?: ChannelRecord | null;
  parentMessage?: MessageRecord | null;
  reactions?: ReactionRecord[] | null;
  sender?: InstantUserEntity | null;
  threadReplies?: MessageRecord[] | null;
}
