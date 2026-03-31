import { useState } from "react";

import type { FloatingAnchor } from "../../../components/ui/floating";

interface EmojiMenuState {
  anchor: FloatingAnchor | null;
  messageId: string | null;
}

export function useEmojiMenuState() {
  const [emojiMenuState, setEmojiMenuState] = useState<EmojiMenuState>({
    anchor: null,
    messageId: null,
  });

  function openEmojiMenu(anchor: FloatingAnchor, messageId: string) {
    setEmojiMenuState({ anchor, messageId });
  }

  function closeEmojiMenu() {
    setEmojiMenuState({ anchor: null, messageId: null });
  }

  return {
    anchor: emojiMenuState.anchor,
    closeEmojiMenu,
    isOpen: emojiMenuState.messageId !== null,
    messageId: emojiMenuState.messageId,
    openEmojiMenu,
  };
}
