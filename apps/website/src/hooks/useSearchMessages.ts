import { useMemo, useState } from "react";

import { instantDB } from "../lib/instant";
import { asArray } from "../lib/ui";
import type { ChannelRecord, MessageRecord } from "../types/quack";

export interface SearchResult {
  channel: ChannelRecord;
  message: MessageRecord;
}

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
                messageType: "message",
                deletedAt: { $isNull: true },
              },
              order: { createdAt: "desc" as const },
            },
            sender: { avatar: {} },
            channel: {},
          },
        }
      : null,
  );

  const allMessages = useMemo(() => {
    return asArray(messagesState.data?.messages) as Array<
      MessageRecord & { channel?: { id: string } }
    >;
  }, [messagesState.data]);

  const results = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed || trimmed.length < 2) return [];

    const terms = trimmed.split(/\s+/);
    const matched: SearchResult[] = [];

    for (const message of allMessages) {
      if (!message.body) continue;

      const channelId = message.channel?.id;
      if (!channelId) continue;

      const channel = channelsById.get(channelId);
      if (!channel) continue;

      const bodyLower = message.body.toLowerCase();
      const allMatch = terms.every((term) => bodyLower.includes(term));
      if (!allMatch) continue;

      matched.push({ channel, message });
      if (matched.length >= 50) break;
    }

    return matched;
  }, [query, allMessages, channelsById]);

  return {
    isLoading: messagesState.isLoading,
    query,
    results,
    setQuery,
  };
}
