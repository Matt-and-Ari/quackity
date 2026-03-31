import { useMemo } from "react";

import { instantDB } from "../lib/instant";

interface UseMentionCountsProps {
  userId: string;
}

export function useMentionCounts(props: UseMentionCountsProps): Map<string, number> {
  const { data } = instantDB.useQuery({
    mentions: {
      $: {
        where: {
          "$user.id": props.userId,
          read: false,
        },
      },
    },
  });

  return useMemo(() => {
    const counts = new Map<string, number>();
    const mentions = data?.mentions ?? [];
    for (const mention of mentions) {
      const channelId = mention.channelId;
      counts.set(channelId, (counts.get(channelId) ?? 0) + 1);
    }
    return counts;
  }, [data?.mentions]);
}
