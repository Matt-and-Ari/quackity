import { useEffect, useRef } from "react";

import { instantDB } from "../lib/instant";
import { getPreferences } from "./usePreferences";
import { playQuackSound } from "../lib/quack-sound";

interface UseMentionNotificationsProps {
  channelNamesById: Map<string, string>;
  dmChannelIds: Set<string>;
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
      message: {},
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

    const prefs = getPreferences();

    if (prefs.soundEffects) {
      playQuackSound();
    }

    if (prefs.desktopNotifications) {
      if (Notification.permission === "default") {
        void Notification.requestPermission().then((perm) => {
          if (perm === "granted") {
            fireNotifications(newMentions, props.channelNamesById, props.dmChannelIds);
          }
        });
      } else if (Notification.permission === "granted") {
        fireNotifications(newMentions, props.channelNamesById, props.dmChannelIds);
      }
    }
  }, [mentions, props.channelNamesById, props.dmChannelIds]);
}

interface MentionRecord {
  channelId: string;
  id: string;
  message?: { body?: string } | null;
  sender?: { email?: string } | null;
}

function fireNotifications(
  mentions: MentionRecord[],
  channelNamesById: Map<string, string>,
  dmChannelIds: Set<string>,
) {
  for (const mention of mentions) {
    const senderName = mention.sender?.email ?? "Someone";
    const isDm = dmChannelIds.has(mention.channelId);
    const bodyPreview = extractPlainText(mention.message?.body);

    if (isDm) {
      new Notification(senderName, {
        body: bodyPreview || "Sent you a message",
        tag: `mention-${mention.id}`,
      });
    } else {
      const channelName = channelNamesById.get(mention.channelId) ?? "a channel";
      new Notification(`${senderName} in #${channelName}`, {
        body: bodyPreview || "Mentioned you",
        tag: `mention-${mention.id}`,
      });
    }
  }
}

interface TiptapNode {
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  text?: string;
  type?: string;
}

function extractPlainText(body: string | undefined | null): string {
  if (!body) return "";

  if (!body.startsWith("{")) return body.slice(0, 200);

  try {
    const doc = JSON.parse(body) as TiptapNode;
    const parts: string[] = [];
    collectText(doc, parts);
    return parts.join("").slice(0, 200);
  } catch {
    return body.slice(0, 200);
  }
}

function collectText(node: TiptapNode, parts: string[]) {
  if (node.type === "mention" && node.attrs?.label) {
    parts.push(`@${node.attrs.label}`);
    return;
  }
  if (node.text) {
    parts.push(node.text);
    return;
  }
  if (node.content) {
    for (const child of node.content) {
      collectText(child, parts);
    }
  }
}
