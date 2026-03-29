import type { InstaQLParams } from "@instantdb/core";
import type { AppSchema } from "@quack/schema";

export type QuackQuery = InstaQLParams<AppSchema>;

const workspaceMemberFields = {
  $user: {},
} as const;

const channelMemberFields = {
  $user: {},
} as const;

const messageAttachmentFields = {
  $file: {},
} as const;

const reactionFields = {
  $user: {},
} as const;

const messageFields = {
  attachments: messageAttachmentFields,
  parentMessage: {
    sender: {},
  },
  reactions: reactionFields,
  sender: {},
} as const;

export function listWorkspacesQuery() {
  return {
    workspaces: {
      $: {
        order: {
          createdAt: "desc",
        },
      },
      channels: {},
      members: workspaceMemberFields,
      owner: {},
    },
  } satisfies QuackQuery;
}

export function workspaceByIdQuery(workspaceId: string) {
  return {
    workspaces: {
      $: {
        where: {
          id: workspaceId,
        },
      },
      channels: {
        $: {
          order: {
            createdAt: "asc",
          },
        },
      },
      members: workspaceMemberFields,
      owner: {},
    },
  } satisfies QuackQuery;
}

export function workspaceBySlugQuery(slug: string) {
  return {
    workspaces: {
      $: {
        where: {
          slug,
        },
      },
      channels: {
        $: {
          order: {
            createdAt: "asc",
          },
        },
      },
      members: workspaceMemberFields,
      owner: {},
    },
  } satisfies QuackQuery;
}

export function workspaceMembersQuery(workspaceId: string) {
  return {
    workspaceMembers: {
      $: {
        order: {
          joinedAt: "asc",
        },
        where: {
          "workspace.id": workspaceId,
        },
      },
      $user: {},
      workspace: {
        owner: {},
      },
    },
  } satisfies QuackQuery;
}

export function channelsByWorkspaceQuery(workspaceId: string) {
  return {
    channels: {
      $: {
        order: {
          createdAt: "asc",
        },
        where: {
          "workspace.id": workspaceId,
        },
      },
      createdBy: {},
      members: channelMemberFields,
      workspace: {
        owner: {},
      },
    },
  } satisfies QuackQuery;
}

export function channelByIdQuery(channelId: string) {
  return {
    channels: {
      $: {
        where: {
          id: channelId,
        },
      },
      createdBy: {},
      members: channelMemberFields,
      workspace: {
        members: workspaceMemberFields,
        owner: {},
      },
    },
  } satisfies QuackQuery;
}

export function channelByScopedSlugQuery(scopedSlug: string) {
  return {
    channels: {
      $: {
        where: {
          scopedSlug,
        },
      },
      createdBy: {},
      members: channelMemberFields,
      workspace: {
        members: workspaceMemberFields,
        owner: {},
      },
    },
  } satisfies QuackQuery;
}

export function channelMembersQuery(channelId: string) {
  return {
    channelMembers: {
      $: {
        order: {
          joinedAt: "asc",
        },
        where: {
          "channel.id": channelId,
        },
      },
      $user: {},
      channel: {
        workspace: {
          owner: {},
        },
      },
    },
  } satisfies QuackQuery;
}

export function messagesByChannelQuery(
  channelId: string,
  options?: {
    limit?: number;
  },
) {
  return {
    messages: {
      $: {
        limit: options?.limit,
        order: {
          createdAt: "asc",
        },
        where: {
          "channel.id": channelId,
          messageType: "message",
        },
      },
      ...messageFields,
      channel: {
        workspace: {
          owner: {},
        },
      },
      threadReplies: {
        $: {
          order: {
            createdAt: "asc",
          },
        },
        attachments: messageAttachmentFields,
        reactions: reactionFields,
        sender: {},
      },
    },
  } satisfies QuackQuery;
}

export function messageByIdQuery(messageId: string) {
  return {
    messages: {
      $: {
        where: {
          id: messageId,
        },
      },
      ...messageFields,
      channel: {
        workspace: {
          owner: {},
        },
      },
      threadReplies: {
        $: {
          order: {
            createdAt: "asc",
          },
        },
        attachments: messageAttachmentFields,
        reactions: reactionFields,
        sender: {},
      },
    },
  } satisfies QuackQuery;
}

export function threadRepliesQuery(
  parentMessageId: string,
  options?: {
    limit?: number;
  },
) {
  return {
    messages: {
      $: {
        limit: options?.limit,
        order: {
          createdAt: "asc",
        },
        where: {
          "parentMessage.id": parentMessageId,
          messageType: "thread_reply",
        },
      },
      ...messageFields,
      channel: {
        workspace: {
          owner: {},
        },
      },
    },
  } satisfies QuackQuery;
}

export function messageAttachmentsByMessageQuery(messageId: string) {
  return {
    messageAttachments: {
      $: {
        order: {
          createdAt: "asc",
        },
        where: {
          "message.id": messageId,
        },
      },
      $file: {},
      message: {
        sender: {},
      },
    },
  } satisfies QuackQuery;
}

export function reactionsByMessageQuery(messageId: string) {
  return {
    reactions: {
      $: {
        order: {
          createdAt: "asc",
        },
        where: {
          "message.id": messageId,
        },
      },
      $user: {},
      message: {
        sender: {},
      },
    },
  } satisfies QuackQuery;
}
