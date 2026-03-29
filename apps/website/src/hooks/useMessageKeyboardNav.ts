import { useCallback, useEffect, useState } from "react";

import type { MessageRecord } from "../types/quack";

interface UseMessageKeyboardNavProps {
  canEditOrDelete: (message: MessageRecord) => boolean;
  channelInputRef: React.RefObject<HTMLTextAreaElement | null>;
  messages: MessageRecord[];
  onDelete: (messageId: string) => void;
  onOpenReactionMenu: (messageId: string) => void;
  onReply: (messageId: string) => void;
  onStartEdit: (messageId: string) => void;
}

export interface UseMessageKeyboardNavResult {
  clearSelection: () => void;
  handleInputKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  selectedMessageId: string | null;
}

export function useMessageKeyboardNav(
  props: UseMessageKeyboardNavProps,
): UseMessageKeyboardNavResult {
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  const visibleMessages = props.messages.filter((m) => !m.deletedAt);

  const clearSelection = useCallback(() => {
    setSelectedMessageId(null);
  }, []);

  useEffect(() => {
    clearSelection();
  }, [props.messages.length, clearSelection]);

  useEffect(() => {
    if (selectedMessageId && !visibleMessages.some((m) => m.id === selectedMessageId)) {
      clearSelection();
    }
  }, [visibleMessages, selectedMessageId, clearSelection]);

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "ArrowUp") return;

    const textarea = event.currentTarget;
    if (textarea.selectionStart !== 0 || textarea.selectionEnd !== 0) return;

    const lastMessage = visibleMessages[visibleMessages.length - 1];
    if (!lastMessage) return;

    event.preventDefault();
    setSelectedMessageId(lastMessage.id);
  }

  useEffect(() => {
    if (!selectedMessageId) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (!selectedMessageId) return;

      const target = event.target as HTMLElement;
      const isInInput =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      if (isInInput) return;

      const selectedIndex = visibleMessages.findIndex((m) => m.id === selectedMessageId);
      if (selectedIndex === -1) return;

      const selectedMessage = visibleMessages[selectedIndex];

      switch (event.key) {
        case "ArrowUp": {
          event.preventDefault();
          if (selectedIndex > 0) {
            setSelectedMessageId(visibleMessages[selectedIndex - 1].id);
          }
          break;
        }
        case "ArrowDown": {
          event.preventDefault();
          if (selectedIndex < visibleMessages.length - 1) {
            setSelectedMessageId(visibleMessages[selectedIndex + 1].id);
          } else {
            setSelectedMessageId(null);
            props.channelInputRef.current?.focus();
          }
          break;
        }
        case "Escape": {
          event.preventDefault();
          setSelectedMessageId(null);
          props.channelInputRef.current?.focus();
          break;
        }
        case "e": {
          if (!selectedMessage || selectedMessage.deletedAt) break;
          if (!props.canEditOrDelete(selectedMessage)) break;
          event.preventDefault();
          props.onStartEdit(selectedMessage.id);
          setSelectedMessageId(null);
          break;
        }
        case "r": {
          if (!selectedMessage || selectedMessage.deletedAt) break;
          event.preventDefault();
          props.onOpenReactionMenu(selectedMessage.id);
          break;
        }
        case "t": {
          if (!selectedMessage) break;
          event.preventDefault();
          props.onReply(selectedMessage.id);
          setSelectedMessageId(null);
          break;
        }
        case "Backspace":
        case "Delete": {
          if (!selectedMessage || selectedMessage.deletedAt) break;
          if (!props.canEditOrDelete(selectedMessage)) break;
          event.preventDefault();
          props.onDelete(selectedMessage.id);
          break;
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedMessageId, visibleMessages, props]);

  return {
    clearSelection,
    handleInputKeyDown,
    selectedMessageId,
  };
}
