import type { InstaQLEntity } from "@instantdb/core";
import type { AppSchema } from "@quack/schema";
import { createReactionKey } from "@quack/data";

export type User = InstaQLEntity<AppSchema, "$users">;
export type Workspace = InstaQLEntity<AppSchema, "workspaces">;
export type WorkspaceMember = InstaQLEntity<AppSchema, "workspaceMembers">;
export type Channel = InstaQLEntity<AppSchema, "channels">;
export type ChannelMember = InstaQLEntity<AppSchema, "channelMembers">;
export type Message = InstaQLEntity<AppSchema, "messages">;
export type Attachment = InstaQLEntity<AppSchema, "messageAttachments">;
export type Reaction = InstaQLEntity<AppSchema, "reactions">;

export type MockWorkspace = Workspace & { createdByUserId: string; ownerUserId: string };
export type MockWorkspaceMember = WorkspaceMember & { userId: string; workspaceId: string };
export type MockChannel = Channel & { workspaceId: string; createdByUserId: string };
export type MockChannelMember = ChannelMember & { channelId: string; userId: string };
export type MockMessage = Message & {
  channelId: string;
  senderUserId: string;
  parentMessageId?: string;
};
export type MockAttachment = Attachment & { messageId: string };
export type MockReaction = Reaction & { messageId: string; userId: string };

export interface WorkspaceSnapshot {
  currentUserId: string;
  workspace: MockWorkspace;
  users: User[];
  workspaceMembers: MockWorkspaceMember[];
  channels: MockChannel[];
  channelMembers: MockChannelMember[];
  messages: MockMessage[];
  messageAttachments: MockAttachment[];
  reactions: MockReaction[];
}

export const quickReactionEmoji = ["🦆", "👏", "✨"] as const;

export { createReactionKey };

export const mockWorkspace: WorkspaceSnapshot = {
  currentUserId: "user-olive",
  workspace: {
    id: "workspace-quack",
    createdAt: "2026-03-01T08:00:00.000Z",
    name: "Quack",
    slug: "quack",
    createdByUserId: "user-milo",
    ownerUserId: "user-milo",
  },
  users: [
    {
      id: "user-olive",
      email: "olive@quack.so",
      imageURL:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
    },
    {
      id: "user-milo",
      email: "milo@quack.so",
      imageURL:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80",
    },
    {
      id: "user-jules",
      email: "jules@quack.so",
      imageURL:
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80",
    },
    {
      id: "user-noa",
      email: "noa@quack.so",
      imageURL:
        "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=120&q=80",
    },
    {
      id: "user-rio",
      email: "rio@quack.so",
      imageURL:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80",
    },
  ],
  workspaceMembers: [
    {
      id: "member-olive",
      displayName: "Olive",
      joinedAt: "2026-03-01T08:15:00.000Z",
      memberKey: "workspace-quack:user-olive",
      role: "Design engineer",
      roleKey: "design-engineer",
      status: "online",
      userId: "user-olive",
      workspaceId: "workspace-quack",
    },
    {
      id: "member-milo",
      displayName: "Milo",
      joinedAt: "2026-03-01T08:10:00.000Z",
      memberKey: "workspace-quack:user-milo",
      role: "Founder",
      roleKey: "founder",
      status: "online",
      userId: "user-milo",
      workspaceId: "workspace-quack",
    },
    {
      id: "member-jules",
      displayName: "Jules",
      joinedAt: "2026-03-01T08:20:00.000Z",
      memberKey: "workspace-quack:user-jules",
      role: "Product",
      roleKey: "product",
      status: "away",
      userId: "user-jules",
      workspaceId: "workspace-quack",
    },
    {
      id: "member-noa",
      displayName: "Noa",
      joinedAt: "2026-03-01T08:22:00.000Z",
      memberKey: "workspace-quack:user-noa",
      role: "Marketing",
      roleKey: "marketing",
      status: "online",
      userId: "user-noa",
      workspaceId: "workspace-quack",
    },
    {
      id: "member-rio",
      displayName: "Rio",
      joinedAt: "2026-03-01T08:25:00.000Z",
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
      id: "channel-flock-hq",
      createdAt: "2026-03-01T09:00:00.000Z",
      name: "flock-hq",
      scopedSlug: "quack:flock-hq",
      slug: "flock-hq",
      topic: "Daily chatter, decisions, and polished duck energy.",
      visibility: "public",
      workspaceId: "workspace-quack",
      createdByUserId: "user-milo",
    },
    {
      id: "channel-product-pond",
      createdAt: "2026-03-02T09:00:00.000Z",
      name: "product-pond",
      scopedSlug: "quack:product-pond",
      slug: "product-pond",
      topic: "UX flows, experiments, and feature planning.",
      visibility: "public",
      workspaceId: "workspace-quack",
      createdByUserId: "user-jules",
    },
    {
      id: "channel-launch-lane",
      createdAt: "2026-03-03T09:00:00.000Z",
      name: "launch-lane",
      scopedSlug: "quack:launch-lane",
      slug: "launch-lane",
      topic: "Marketing beats, launch prep, and shareable updates.",
      visibility: "public",
      workspaceId: "workspace-quack",
      createdByUserId: "user-noa",
    },
    {
      id: "channel-duck-ops",
      createdAt: "2026-03-04T09:00:00.000Z",
      name: "duck-ops",
      scopedSlug: "quack:duck-ops",
      slug: "duck-ops",
      topic: "Delivery, support, and systems checks.",
      visibility: "private",
      workspaceId: "workspace-quack",
      createdByUserId: "user-rio",
    },
  ],
  channelMembers: [
    {
      id: "cm-olive-flock",
      joinedAt: "2026-03-01T10:00:00.000Z",
      membershipKey: "channel-flock-hq:user-olive",
      channelId: "channel-flock-hq",
      userId: "user-olive",
    },
    {
      id: "cm-milo-flock",
      joinedAt: "2026-03-01T10:00:00.000Z",
      membershipKey: "channel-flock-hq:user-milo",
      channelId: "channel-flock-hq",
      userId: "user-milo",
    },
    {
      id: "cm-jules-flock",
      joinedAt: "2026-03-01T10:00:00.000Z",
      membershipKey: "channel-flock-hq:user-jules",
      channelId: "channel-flock-hq",
      userId: "user-jules",
    },
    {
      id: "cm-noa-flock",
      joinedAt: "2026-03-01T10:00:00.000Z",
      membershipKey: "channel-flock-hq:user-noa",
      channelId: "channel-flock-hq",
      userId: "user-noa",
    },
    {
      id: "cm-rio-flock",
      joinedAt: "2026-03-01T10:00:00.000Z",
      membershipKey: "channel-flock-hq:user-rio",
      channelId: "channel-flock-hq",
      userId: "user-rio",
    },
    {
      id: "cm-olive-product",
      joinedAt: "2026-03-02T10:00:00.000Z",
      membershipKey: "channel-product-pond:user-olive",
      channelId: "channel-product-pond",
      userId: "user-olive",
    },
    {
      id: "cm-jules-product",
      joinedAt: "2026-03-02T10:00:00.000Z",
      membershipKey: "channel-product-pond:user-jules",
      channelId: "channel-product-pond",
      userId: "user-jules",
    },
    {
      id: "cm-milo-product",
      joinedAt: "2026-03-02T10:00:00.000Z",
      membershipKey: "channel-product-pond:user-milo",
      channelId: "channel-product-pond",
      userId: "user-milo",
    },
    {
      id: "cm-noa-launch",
      joinedAt: "2026-03-03T10:00:00.000Z",
      membershipKey: "channel-launch-lane:user-noa",
      channelId: "channel-launch-lane",
      userId: "user-noa",
    },
    {
      id: "cm-milo-launch",
      joinedAt: "2026-03-03T10:00:00.000Z",
      membershipKey: "channel-launch-lane:user-milo",
      channelId: "channel-launch-lane",
      userId: "user-milo",
    },
    {
      id: "cm-rio-ops",
      joinedAt: "2026-03-04T10:00:00.000Z",
      membershipKey: "channel-duck-ops:user-rio",
      channelId: "channel-duck-ops",
      userId: "user-rio",
    },
    {
      id: "cm-olive-ops",
      joinedAt: "2026-03-04T10:00:00.000Z",
      membershipKey: "channel-duck-ops:user-olive",
      channelId: "channel-duck-ops",
      userId: "user-olive",
    },
  ],
  messages: [
    {
      id: "msg-flock-1",
      body: "Morning team. The new Quack shell looks calm, bright, and way more premium already.",
      createdAt: "2026-03-29T08:32:00.000Z",
      messageType: "message",
      channelId: "channel-flock-hq",
      senderUserId: "user-milo",
    },
    {
      id: "msg-flock-2",
      body: "I tightened the spacing and softened the shadows so the yellow feels warm instead of loud.",
      createdAt: "2026-03-29T08:37:00.000Z",
      messageType: "message",
      updatedAt: "2026-03-29T08:41:00.000Z",
      channelId: "channel-flock-hq",
      senderUserId: "user-olive",
    },
    {
      id: "msg-flock-3",
      body: "Replying here with a quick thread idea: let the right panel feel like a tucked-away conversation drawer instead of a hard utility panel.",
      createdAt: "2026-03-29T08:44:00.000Z",
      messageType: "message",
      channelId: "channel-flock-hq",
      senderUserId: "user-jules",
    },
    {
      id: "msg-flock-t1",
      body: "Yes. A softer background and narrower width makes it feel more conversational.",
      createdAt: "2026-03-29T08:46:00.000Z",
      messageType: "message",
      channelId: "channel-flock-hq",
      senderUserId: "user-olive",
      parentMessageId: "msg-flock-3",
    },
    {
      id: "msg-flock-t2",
      body: "Also helpful if reply actions route the attention there immediately.",
      createdAt: "2026-03-29T08:49:00.000Z",
      messageType: "message",
      channelId: "channel-flock-hq",
      senderUserId: "user-noa",
      parentMessageId: "msg-flock-3",
    },
    {
      id: "msg-flock-4",
      body: "I dropped in a tiny launch checklist card so the timeline reads like a real team space.",
      createdAt: "2026-03-29T08:53:00.000Z",
      messageType: "message",
      channelId: "channel-flock-hq",
      senderUserId: "user-noa",
    },
    {
      id: "msg-product-1",
      body: "For product-pond, let's keep the composer generous and airy. Less enterprise chrome, more focused conversation.",
      createdAt: "2026-03-29T09:02:00.000Z",
      messageType: "message",
      channelId: "channel-product-pond",
      senderUserId: "user-jules",
    },
    {
      id: "msg-product-2",
      body: "Agreed. I also want the hover toolbar to feel lightweight, almost like it floats out of the card.",
      createdAt: "2026-03-29T09:07:00.000Z",
      messageType: "message",
      channelId: "channel-product-pond",
      senderUserId: "user-olive",
    },
    {
      id: "msg-product-3",
      body: "Sharing the mini brief for the thread panel treatment below.",
      createdAt: "2026-03-29T09:11:00.000Z",
      messageType: "message",
      channelId: "channel-product-pond",
      senderUserId: "user-milo",
    },
    {
      id: "msg-launch-1",
      body: "Launch copy pass is ready. Need a final tone check before we queue social and the landing update.",
      createdAt: "2026-03-29T09:15:00.000Z",
      messageType: "message",
      channelId: "channel-launch-lane",
      senderUserId: "user-noa",
    },
    {
      id: "msg-launch-2",
      body: "Please keep the announcement calm and confident. More 'crafted team chat' and less hype.",
      createdAt: "2026-03-29T09:21:00.000Z",
      messageType: "message",
      channelId: "channel-launch-lane",
      senderUserId: "user-milo",
    },
    {
      id: "msg-ops-1",
      body: "Duck-ops check: support inbox is clear, QA notes are closed, and the demo workspace is reset.",
      createdAt: "2026-03-29T09:28:00.000Z",
      messageType: "message",
      channelId: "channel-duck-ops",
      senderUserId: "user-rio",
    },
  ],
  messageAttachments: [
    {
      id: "att-launch-checklist",
      attachmentType: "file",
      contentType: "text/markdown",
      createdAt: "2026-03-29T09:15:30.000Z",
      name: "Launch checklist v1",
      sizeBytes: 4200,
      messageId: "msg-launch-1",
    },
    {
      id: "att-thread-brief",
      attachmentType: "file",
      contentType: "application/pdf",
      createdAt: "2026-03-29T09:11:30.000Z",
      name: "Thread-panel-brief.pdf",
      sizeBytes: 182400,
      messageId: "msg-product-3",
    },
  ],
  reactions: [
    {
      id: "reaction-1",
      createdAt: "2026-03-29T08:38:00.000Z",
      emoji: "🦆",
      reactionKey: createReactionKey("msg-flock-2", "user-milo", "🦆"),
      messageId: "msg-flock-2",
      userId: "user-milo",
    },
    {
      id: "reaction-2",
      createdAt: "2026-03-29T08:39:00.000Z",
      emoji: "✨",
      reactionKey: createReactionKey("msg-flock-2", "user-jules", "✨"),
      messageId: "msg-flock-2",
      userId: "user-jules",
    },
    {
      id: "reaction-3",
      createdAt: "2026-03-29T08:54:00.000Z",
      emoji: "👏",
      reactionKey: createReactionKey("msg-flock-4", "user-olive", "👏"),
      messageId: "msg-flock-4",
      userId: "user-olive",
    },
    {
      id: "reaction-4",
      createdAt: "2026-03-29T09:08:00.000Z",
      emoji: "🦆",
      reactionKey: createReactionKey("msg-product-2", "user-jules", "🦆"),
      messageId: "msg-product-2",
      userId: "user-jules",
    },
  ],
};
