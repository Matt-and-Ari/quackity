import type { AppSchema } from "../../../packages/schema";

type SchemaEntityName = keyof AppSchema["entities"];

interface SchemaBackedRecord<TEntityName extends SchemaEntityName> {
  entity: TEntityName;
  id: string;
}

export interface QuackUserRecord extends SchemaBackedRecord<"$users"> {
  email?: string;
  imageURL?: string;
  type?: string;
}

export interface QuackWorkspaceRecord extends SchemaBackedRecord<"workspaces"> {
  createdAt: Date;
  imageUrl?: string;
  name: string;
  slug: string;
  createdByUserId: string;
  ownerUserId: string;
}

export interface QuackWorkspaceMemberRecord extends SchemaBackedRecord<"workspaceMembers"> {
  displayName?: string;
  joinedAt: Date;
  memberKey: string;
  role: string;
  roleKey: string;
  status?: string;
  userId: string;
  workspaceId: string;
}

export interface QuackChannelRecord extends SchemaBackedRecord<"channels"> {
  archivedAt?: Date;
  createdAt: Date;
  name: string;
  scopedSlug: string;
  slug: string;
  topic?: string;
  visibility: "public" | "private";
  workspaceId: string;
  createdByUserId: string;
}

export interface QuackChannelMemberRecord extends SchemaBackedRecord<"channelMembers"> {
  joinedAt: Date;
  membershipKey: string;
  channelId: string;
  userId: string;
}

export interface QuackMessageRecord extends SchemaBackedRecord<"messages"> {
  body?: string;
  createdAt: Date;
  deletedAt?: Date;
  messageType: "message" | "system";
  updatedAt?: Date;
  channelId: string;
  senderUserId: string;
  parentMessageId?: string;
}

export interface QuackAttachmentRecord extends SchemaBackedRecord<"messageAttachments"> {
  attachmentType: "file" | "link" | "image";
  contentType?: string;
  createdAt: Date;
  name: string;
  sizeBytes?: number;
  messageId: string;
}

export interface QuackReactionRecord extends SchemaBackedRecord<"reactions"> {
  createdAt: Date;
  emoji: string;
  reactionKey: string;
  messageId: string;
  userId: string;
}

export interface QuackWorkspaceSnapshot {
  currentUserId: string;
  workspace: QuackWorkspaceRecord;
  users: QuackUserRecord[];
  workspaceMembers: QuackWorkspaceMemberRecord[];
  channels: QuackChannelRecord[];
  channelMembers: QuackChannelMemberRecord[];
  messages: QuackMessageRecord[];
  messageAttachments: QuackAttachmentRecord[];
  reactions: QuackReactionRecord[];
}

export const quickReactionEmoji = ["🦆", "👏", "✨"] as const;

export const quackWorkspaceSnapshot: QuackWorkspaceSnapshot = {
  currentUserId: "user-olive",
  workspace: {
    entity: "workspaces",
    id: "workspace-quack",
    createdAt: new Date("2026-03-01T08:00:00.000Z"),
    imageUrl:
      "https://images.unsplash.com/photo-1452570053594-1b985d6ea890?auto=format&fit=crop&w=120&q=80",
    name: "Quack",
    slug: "quack",
    createdByUserId: "user-milo",
    ownerUserId: "user-milo",
  },
  users: [
    {
      entity: "$users",
      id: "user-olive",
      email: "olive@quack.so",
      imageURL:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
      type: "member",
    },
    {
      entity: "$users",
      id: "user-milo",
      email: "milo@quack.so",
      imageURL:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80",
      type: "member",
    },
    {
      entity: "$users",
      id: "user-jules",
      email: "jules@quack.so",
      imageURL:
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80",
      type: "member",
    },
    {
      entity: "$users",
      id: "user-noa",
      email: "noa@quack.so",
      imageURL:
        "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=120&q=80",
      type: "member",
    },
    {
      entity: "$users",
      id: "user-rio",
      email: "rio@quack.so",
      imageURL:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80",
      type: "member",
    },
  ],
  workspaceMembers: [
    {
      entity: "workspaceMembers",
      id: "member-olive",
      displayName: "Olive",
      joinedAt: new Date("2026-03-01T08:15:00.000Z"),
      memberKey: "workspace-quack:user-olive",
      role: "Design engineer",
      roleKey: "design-engineer",
      status: "online",
      userId: "user-olive",
      workspaceId: "workspace-quack",
    },
    {
      entity: "workspaceMembers",
      id: "member-milo",
      displayName: "Milo",
      joinedAt: new Date("2026-03-01T08:10:00.000Z"),
      memberKey: "workspace-quack:user-milo",
      role: "Founder",
      roleKey: "founder",
      status: "online",
      userId: "user-milo",
      workspaceId: "workspace-quack",
    },
    {
      entity: "workspaceMembers",
      id: "member-jules",
      displayName: "Jules",
      joinedAt: new Date("2026-03-01T08:20:00.000Z"),
      memberKey: "workspace-quack:user-jules",
      role: "Product",
      roleKey: "product",
      status: "away",
      userId: "user-jules",
      workspaceId: "workspace-quack",
    },
    {
      entity: "workspaceMembers",
      id: "member-noa",
      displayName: "Noa",
      joinedAt: new Date("2026-03-01T08:22:00.000Z"),
      memberKey: "workspace-quack:user-noa",
      role: "Marketing",
      roleKey: "marketing",
      status: "online",
      userId: "user-noa",
      workspaceId: "workspace-quack",
    },
    {
      entity: "workspaceMembers",
      id: "member-rio",
      displayName: "Rio",
      joinedAt: new Date("2026-03-01T08:25:00.000Z"),
      memberKey: "workspace-quack:user-rio",
      role: "Ops",
      roleKey: "ops",
      status: "focus",
      userId: "user-rio",
      workspaceId: "workspace-quack",
    },
  ],
  channels: [
    {
      entity: "channels",
      id: "channel-flock-hq",
      createdAt: new Date("2026-03-01T09:00:00.000Z"),
      name: "flock-hq",
      scopedSlug: "quack-flock-hq",
      slug: "flock-hq",
      topic: "Daily chatter, decisions, and polished duck energy.",
      visibility: "public",
      workspaceId: "workspace-quack",
      createdByUserId: "user-milo",
    },
    {
      entity: "channels",
      id: "channel-product-pond",
      createdAt: new Date("2026-03-02T09:00:00.000Z"),
      name: "product-pond",
      scopedSlug: "quack-product-pond",
      slug: "product-pond",
      topic: "UX flows, experiments, and feature planning.",
      visibility: "public",
      workspaceId: "workspace-quack",
      createdByUserId: "user-jules",
    },
    {
      entity: "channels",
      id: "channel-launch-lane",
      createdAt: new Date("2026-03-03T09:00:00.000Z"),
      name: "launch-lane",
      scopedSlug: "quack-launch-lane",
      slug: "launch-lane",
      topic: "Marketing beats, launch prep, and shareable updates.",
      visibility: "public",
      workspaceId: "workspace-quack",
      createdByUserId: "user-noa",
    },
    {
      entity: "channels",
      id: "channel-duck-ops",
      createdAt: new Date("2026-03-04T09:00:00.000Z"),
      name: "duck-ops",
      scopedSlug: "quack-duck-ops",
      slug: "duck-ops",
      topic: "Delivery, support, and systems checks.",
      visibility: "private",
      workspaceId: "workspace-quack",
      createdByUserId: "user-rio",
    },
  ],
  channelMembers: [
    {
      entity: "channelMembers",
      id: "channel-member-olive-flock",
      joinedAt: new Date("2026-03-01T10:00:00.000Z"),
      membershipKey: "channel-flock-hq:user-olive",
      channelId: "channel-flock-hq",
      userId: "user-olive",
    },
    {
      entity: "channelMembers",
      id: "channel-member-milo-flock",
      joinedAt: new Date("2026-03-01T10:00:00.000Z"),
      membershipKey: "channel-flock-hq:user-milo",
      channelId: "channel-flock-hq",
      userId: "user-milo",
    },
    {
      entity: "channelMembers",
      id: "channel-member-jules-flock",
      joinedAt: new Date("2026-03-01T10:00:00.000Z"),
      membershipKey: "channel-flock-hq:user-jules",
      channelId: "channel-flock-hq",
      userId: "user-jules",
    },
    {
      entity: "channelMembers",
      id: "channel-member-noa-flock",
      joinedAt: new Date("2026-03-01T10:00:00.000Z"),
      membershipKey: "channel-flock-hq:user-noa",
      channelId: "channel-flock-hq",
      userId: "user-noa",
    },
    {
      entity: "channelMembers",
      id: "channel-member-rio-flock",
      joinedAt: new Date("2026-03-01T10:00:00.000Z"),
      membershipKey: "channel-flock-hq:user-rio",
      channelId: "channel-flock-hq",
      userId: "user-rio",
    },
    {
      entity: "channelMembers",
      id: "channel-member-olive-product",
      joinedAt: new Date("2026-03-02T10:00:00.000Z"),
      membershipKey: "channel-product-pond:user-olive",
      channelId: "channel-product-pond",
      userId: "user-olive",
    },
    {
      entity: "channelMembers",
      id: "channel-member-jules-product",
      joinedAt: new Date("2026-03-02T10:00:00.000Z"),
      membershipKey: "channel-product-pond:user-jules",
      channelId: "channel-product-pond",
      userId: "user-jules",
    },
    {
      entity: "channelMembers",
      id: "channel-member-milo-product",
      joinedAt: new Date("2026-03-02T10:00:00.000Z"),
      membershipKey: "channel-product-pond:user-milo",
      channelId: "channel-product-pond",
      userId: "user-milo",
    },
    {
      entity: "channelMembers",
      id: "channel-member-noa-launch",
      joinedAt: new Date("2026-03-03T10:00:00.000Z"),
      membershipKey: "channel-launch-lane:user-noa",
      channelId: "channel-launch-lane",
      userId: "user-noa",
    },
    {
      entity: "channelMembers",
      id: "channel-member-milo-launch",
      joinedAt: new Date("2026-03-03T10:00:00.000Z"),
      membershipKey: "channel-launch-lane:user-milo",
      channelId: "channel-launch-lane",
      userId: "user-milo",
    },
    {
      entity: "channelMembers",
      id: "channel-member-rio-ops",
      joinedAt: new Date("2026-03-04T10:00:00.000Z"),
      membershipKey: "channel-duck-ops:user-rio",
      channelId: "channel-duck-ops",
      userId: "user-rio",
    },
    {
      entity: "channelMembers",
      id: "channel-member-olive-ops",
      joinedAt: new Date("2026-03-04T10:00:00.000Z"),
      membershipKey: "channel-duck-ops:user-olive",
      channelId: "channel-duck-ops",
      userId: "user-olive",
    },
  ],
  messages: [
    {
      entity: "messages",
      id: "message-flock-1",
      body: "Morning team. The new Quack shell looks calm, bright, and way more premium already.",
      createdAt: new Date("2026-03-29T08:32:00.000Z"),
      messageType: "message",
      channelId: "channel-flock-hq",
      senderUserId: "user-milo",
    },
    {
      entity: "messages",
      id: "message-flock-2",
      body: "I tightened the spacing and softened the shadows so the yellow feels warm instead of loud.",
      createdAt: new Date("2026-03-29T08:37:00.000Z"),
      messageType: "message",
      channelId: "channel-flock-hq",
      senderUserId: "user-olive",
      updatedAt: new Date("2026-03-29T08:41:00.000Z"),
    },
    {
      entity: "messages",
      id: "message-flock-3",
      body: "Replying here with a quick thread idea: let the right panel feel like a tucked-away conversation drawer instead of a hard utility panel.",
      createdAt: new Date("2026-03-29T08:44:00.000Z"),
      messageType: "message",
      channelId: "channel-flock-hq",
      senderUserId: "user-jules",
    },
    {
      entity: "messages",
      id: "message-flock-thread-1",
      body: "Yes. A softer background and narrower width makes it feel more conversational.",
      createdAt: new Date("2026-03-29T08:46:00.000Z"),
      messageType: "message",
      channelId: "channel-flock-hq",
      senderUserId: "user-olive",
      parentMessageId: "message-flock-3",
    },
    {
      entity: "messages",
      id: "message-flock-thread-2",
      body: "Also helpful if reply actions route the attention there immediately.",
      createdAt: new Date("2026-03-29T08:49:00.000Z"),
      messageType: "message",
      channelId: "channel-flock-hq",
      senderUserId: "user-noa",
      parentMessageId: "message-flock-3",
    },
    {
      entity: "messages",
      id: "message-flock-4",
      body: "I dropped in a tiny launch checklist card so the timeline reads like a real team space.",
      createdAt: new Date("2026-03-29T08:53:00.000Z"),
      messageType: "message",
      channelId: "channel-flock-hq",
      senderUserId: "user-noa",
    },
    {
      entity: "messages",
      id: "message-product-1",
      body: "For `product-pond`, let's keep the composer generous and airy. Less enterprise chrome, more focused conversation.",
      createdAt: new Date("2026-03-29T09:02:00.000Z"),
      messageType: "message",
      channelId: "channel-product-pond",
      senderUserId: "user-jules",
    },
    {
      entity: "messages",
      id: "message-product-2",
      body: "Agreed. I also want the hover toolbar to feel lightweight, almost like it floats out of the card.",
      createdAt: new Date("2026-03-29T09:07:00.000Z"),
      messageType: "message",
      channelId: "channel-product-pond",
      senderUserId: "user-olive",
    },
    {
      entity: "messages",
      id: "message-product-3",
      body: "Sharing the mini brief for the thread panel treatment below.",
      createdAt: new Date("2026-03-29T09:11:00.000Z"),
      messageType: "message",
      channelId: "channel-product-pond",
      senderUserId: "user-milo",
    },
    {
      entity: "messages",
      id: "message-launch-1",
      body: "Launch copy pass is ready. Need a final tone check before we queue social and the landing update.",
      createdAt: new Date("2026-03-29T09:15:00.000Z"),
      messageType: "message",
      channelId: "channel-launch-lane",
      senderUserId: "user-noa",
    },
    {
      entity: "messages",
      id: "message-launch-2",
      body: "Please keep the announcement calm and confident. More 'crafted team chat' and less hype.",
      createdAt: new Date("2026-03-29T09:21:00.000Z"),
      messageType: "message",
      channelId: "channel-launch-lane",
      senderUserId: "user-milo",
    },
    {
      entity: "messages",
      id: "message-ops-1",
      body: "Duck-ops check: support inbox is clear, QA notes are closed, and the demo workspace is reset.",
      createdAt: new Date("2026-03-29T09:28:00.000Z"),
      messageType: "message",
      channelId: "channel-duck-ops",
      senderUserId: "user-rio",
    },
  ],
  messageAttachments: [
    {
      entity: "messageAttachments",
      id: "attachment-launch-checklist",
      attachmentType: "link",
      contentType: "text/markdown",
      createdAt: new Date("2026-03-29T09:15:30.000Z"),
      name: "Launch checklist v1",
      sizeBytes: 4200,
      messageId: "message-launch-1",
    },
    {
      entity: "messageAttachments",
      id: "attachment-thread-brief",
      attachmentType: "file",
      contentType: "application/pdf",
      createdAt: new Date("2026-03-29T09:11:30.000Z"),
      name: "Thread-panel-brief.pdf",
      sizeBytes: 182400,
      messageId: "message-product-3",
    },
  ],
  reactions: [
    {
      entity: "reactions",
      id: "reaction-1",
      createdAt: new Date("2026-03-29T08:38:00.000Z"),
      emoji: "🦆",
      reactionKey: "message-flock-2:user-milo:🦆",
      messageId: "message-flock-2",
      userId: "user-milo",
    },
    {
      entity: "reactions",
      id: "reaction-2",
      createdAt: new Date("2026-03-29T08:39:00.000Z"),
      emoji: "✨",
      reactionKey: "message-flock-2:user-jules:✨",
      messageId: "message-flock-2",
      userId: "user-jules",
    },
    {
      entity: "reactions",
      id: "reaction-3",
      createdAt: new Date("2026-03-29T08:54:00.000Z"),
      emoji: "👏",
      reactionKey: "message-flock-4:user-olive:👏",
      messageId: "message-flock-4",
      userId: "user-olive",
    },
    {
      entity: "reactions",
      id: "reaction-4",
      createdAt: new Date("2026-03-29T09:08:00.000Z"),
      emoji: "🦆",
      reactionKey: "message-product-2:user-jules:🦆",
      messageId: "message-product-2",
      userId: "user-jules",
    },
  ],
};
