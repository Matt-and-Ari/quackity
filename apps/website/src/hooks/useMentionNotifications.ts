import { useEffect, useRef } from "react";

import { instantDB } from "../lib/instant";

interface UseMentionNotificationsProps {
  channelNamesById: Map<string, string>;
  userId: string;
}

const RECENT_WINDOW_MS = 60_000;

export function useMentionNotifications(props: UseMentionNotificationsProps) {
  const notifiedIdsRef = useRef(new Set<string>());
  const isInitialLoadRef = useRef(true);

  const { data } = instantDB.useQuery({
    mentions: {
      $: {
        where: {
          "$user.id": props.userId,
        },
        order: { createdAt: "desc" },
        limit: 50,
      },
      sender: {},
    },
  });

  const mentions = data?.mentions;

  useEffect(() => {
    if (!mentions) return;

    if (isInitialLoadRef.current) {
      for (const mention of mentions) {
        notifiedIdsRef.current.add(mention.id);
      }
      isInitialLoadRef.current = false;
      return;
    }

    const now = Date.now();
    const newMentions = mentions.filter((m) => {
      if (notifiedIdsRef.current.has(m.id)) return false;

      const createdAt =
        typeof m.createdAt === "number" ? m.createdAt : new Date(m.createdAt as string).getTime();
      if (now - createdAt > RECENT_WINDOW_MS) return false;

      return true;
    });

    for (const mention of mentions) {
      notifiedIdsRef.current.add(mention.id);
    }

    if (newMentions.length === 0) return;

    if (Notification.permission === "default") {
      void Notification.requestPermission().then((perm) => {
        if (perm === "granted") {
          fireNotifications(newMentions, props.channelNamesById);
        }
      });
    } else if (Notification.permission === "granted") {
      fireNotifications(newMentions, props.channelNamesById);
    }
  }, [mentions, props.channelNamesById]);
}

interface MentionRecord {
  channelId: string;
  id: string;
  sender?: { email?: string } | null;
}

function fireNotifications(mentions: MentionRecord[], channelNamesById: Map<string, string>) {
  if (mentions.length === 1) {
    const mention = mentions[0];
    const senderName = mention.sender?.email ?? "Someone";
    const channelName = channelNamesById.get(mention.channelId) ?? "a channel";

    new Notification(`${senderName} mentioned you`, {
      body: `in #${channelName}`,
      tag: `mention-${mention.id}`,
    });
    return;
  }

  const channelNames = [
    ...new Set(mentions.map((m) => channelNamesById.get(m.channelId) ?? "a channel")),
  ];

  new Notification(`${mentions.length} new mentions`, {
    body: `in ${channelNames.map((n) => `#${n}`).join(", ")}`,
    tag: `mention-batch-${Date.now()}`,
  });
}
