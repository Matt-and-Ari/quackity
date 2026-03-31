import { useMemo, useState } from "react";

import { instantDB } from "../lib/instant";
import { asArray } from "../lib/ui";
import type { ChannelRecord, MessageRecord } from "../types/quack";

export type SearchResult =
  | { type: "message"; channel: ChannelRecord; message: MessageRecord }
  | { type: "thread"; channel: ChannelRecord; message: MessageRecord; parentMessageId: string }
  | { type: "channel"; channel: ChannelRecord };

interface UseSearchMessagesProps {
  visibleChannels: ChannelRecord[];
  workspaceId: string;
}

export interface UseSearchMessagesResult {
  isLoading: boolean;
  query: string;
  results: SearchResult[];
  setQuery: (value: string) => void;
}

export function useSearchMessages(props: UseSearchMessagesProps): UseSearchMessagesResult {
  const [query, setQuery] = useState("");

  const channelIds = props.visibleChannels.map((c) => c.id);
  const channelsById = useMemo(() => {
    return new Map(props.visibleChannels.map((c) => [c.id, c]));
  }, [props.visibleChannels]);

  const messagesState = instantDB.useQuery(
    channelIds.length > 0
      ? {
          messages: {
            $: {
              where: {
                "channel.workspace.id": props.workspaceId,
                deletedAt: { $isNull: true },
              },
              order: { createdAt: "desc" as const },
            },
            sender: { avatar: {} },
            channel: {},
            parentMessage: {},
          },
        }
      : null,
  );

  const allMessages = useMemo(() => {
    return asArray(messagesState.data?.messages) as Array<
      MessageRecord & { channel?: { id: string }; parentMessage?: { id: string } | null }
    >;
  }, [messagesState.data]);

  const results = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed || trimmed.length < 2) return [];

    const terms = trimmed.split(/\s+/);
    const matched: SearchResult[] = [];

    const matchedChannelIds = new Set<string>();
    for (const channel of props.visibleChannels) {
      const nameLower = channel.name.toLowerCase();
      const allMatch = terms.every((term) => nameLower.includes(term));
      if (allMatch) {
        matched.push({ type: "channel", channel });
        matchedChannelIds.add(channel.id);
      }
    }

    for (const message of allMessages) {
      if (!message.body) continue;

      const channelId = message.channel?.id;
      if (!channelId) continue;

      const channel = channelsById.get(channelId);
      if (!channel) continue;

      const bodyLower = message.body.toLowerCase();
      const allMatch = terms.every((term) => bodyLower.includes(term));
      if (!allMatch) continue;

      const parentId = message.parentMessage?.id ?? null;
      if (parentId) {
        matched.push({ type: "thread", channel, message, parentMessageId: parentId });
      } else {
        matched.push({ type: "message", channel, message });
      }

      if (matched.length >= 50) break;
    }

    return matched;
  }, [query, allMessages, channelsById, props.visibleChannels]);

  return {
    isLoading: messagesState.isLoading,
    query,
    results,
    setQuery,
  };
}
