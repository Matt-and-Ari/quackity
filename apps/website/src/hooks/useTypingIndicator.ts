import { useCallback, useRef } from "react";

import { instantDB } from "../lib/instant";

interface UseTypingIndicatorProps {
  channelId: string | null;
  displayName: string;
  userId: string;
}

export interface TypingPeer {
  displayName: string;
  peerId: string;
  userId: string;
}

export function useTypingIndicator(props: UseTypingIndicatorProps) {
  const room = props.channelId
    ? instantDB.room("channel", props.channelId)
    : instantDB.room("channel", "__none__");

  const hasChannel = Boolean(props.channelId);

  instantDB.rooms.useSyncPresence(room, { displayName: props.displayName, userId: props.userId });

  const typing = instantDB.rooms.useTypingIndicator(room, "chat");

  const lastKeyDownRef = useRef(0);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!hasChannel) return;

      if (event.key === "Enter" && !event.shiftKey) return;

      const now = Date.now();
      if (now - lastKeyDownRef.current < 500) return;
      lastKeyDownRef.current = now;

      typing.inputProps.onKeyDown(event as unknown as React.KeyboardEvent);
    },
    [hasChannel, typing.inputProps],
  );

  const handleBlur = useCallback(() => {
    if (!hasChannel) return;
    typing.inputProps.onBlur();
  }, [hasChannel, typing.inputProps]);

  const activeTypers: TypingPeer[] = typing.active
    .filter((peer) => "userId" in peer && (peer as { userId?: string }).userId !== props.userId)
    .map((peer) => {
      const p = peer as { displayName?: string; userId?: string; peerId?: string };
      return {
        displayName: p.displayName ?? "Someone",
        peerId: p.peerId ?? String(Object.values(peer)[0] ?? ""),
        userId: p.userId ?? "",
      };
    });

  return {
    activeTypers,
    handleBlur,
    handleKeyDown,
  };
}
