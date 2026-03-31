import { useCallback, useEffect, useRef, useState } from "react";

import type { Editor } from "@tiptap/react";

import type { MessageRecord } from "../types/quack";

interface UseMessageKeyboardNavProps {
  activeChannelId: string | null;
  canEditOrDelete: (message: MessageRecord) => boolean;
  channelInputRef: React.RefObject<Editor | null>;
  messages: MessageRecord[];
  onDelete: (messageId: string) => void;
  onOpenReactionMenu: (messageId: string) => void;
  onReply: (messageId: string) => void;
  onStartEdit: (messageId: string) => void;
}

export interface UseMessageKeyboardNavResult {
  clearSelection: () => void;
  handleInputFocus: () => void;
  handleInputKeyDown: (event: KeyboardEvent) => boolean | void;
  handleMessageClick: (messageId: string) => void;
  selectedMessageId: string | null;
}

export function useMessageKeyboardNav(
  props: UseMessageKeyboardNavProps,
): UseMessageKeyboardNavResult {
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  const propsRef = useRef(props);
  propsRef.current = props;

  const visibleMessages = props.messages.filter((m) => !m.deletedAt);
  const visibleMessagesRef = useRef(visibleMessages);
  visibleMessagesRef.current = visibleMessages;

  const selectedMessageIdRef = useRef(selectedMessageId);
  selectedMessageIdRef.current = selectedMessageId;

  const clearSelection = useCallback(() => {
    setSelectedMessageId(null);
  }, []);

  useEffect(() => {
    clearSelection();
  }, [props.messages.length, clearSelection]);

  useEffect(() => {
    setSelectedMessageId(null);
  }, [props.activeChannelId]);

  useEffect(() => {
    if (selectedMessageId && !visibleMessages.some((m) => m.id === selectedMessageId)) {
      clearSelection();
    }
  }, [visibleMessages, selectedMessageId, clearSelection]);

  useEffect(() => {
    if (selectedMessageId) {
      props.channelInputRef.current?.commands.blur();
    }
  }, [selectedMessageId, props.channelInputRef]);

  function selectMessage(messageId: string | null) {
    setSelectedMessageId(messageId);
    if (messageId) {
      propsRef.current.channelInputRef.current?.commands.blur();
    }
  }

  function handleInputKeyDown(event: KeyboardEvent): boolean | void {
    if (event.key !== "ArrowUp") return;

    const editor = propsRef.current.channelInputRef.current;
    if (!editor) return;

    const { from, to } = editor.state.selection;
    const isAtDocStart = from <= 1 && to <= 1;
    if (!isAtDocStart) return;

    const msgs = visibleMessagesRef.current;
    const lastMessage = msgs[msgs.length - 1];
    if (!lastMessage) return;

    event.preventDefault();
    selectMessage(lastMessage.id);
    return true;
  }

  function handleMessageClick(messageId: string) {
    selectMessage(messageId);
  }

  useEffect(() => {
    function handleMouseDown(event: MouseEvent) {
      if (!selectedMessageIdRef.current) return;
      const target = event.target as HTMLElement;
      if (target.closest("[data-message-id]")) return;
      setSelectedMessageId(null);
    }

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  function handleInputFocus() {
    if (selectedMessageId) {
      setSelectedMessageId(null);
    }
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const currentId = selectedMessageIdRef.current;
      if (!currentId) return;

      const target = event.target as HTMLElement;
      const isInInput =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      if (isInInput) return;

      const msgs = visibleMessagesRef.current;
      const selectedIndex = msgs.findIndex((m) => m.id === currentId);
      if (selectedIndex === -1) return;

      const selectedMessage = msgs[selectedIndex];
      const p = propsRef.current;
      const hasModifier = event.metaKey || event.ctrlKey || event.altKey;

      switch (event.key) {
        case "ArrowUp": {
          if (hasModifier) break;
          event.preventDefault();
          if (selectedIndex > 0) {
            selectMessage(msgs[selectedIndex - 1].id);
          }
          break;
        }
        case "ArrowDown": {
          if (hasModifier) break;
          event.preventDefault();
          if (selectedIndex < msgs.length - 1) {
            selectMessage(msgs[selectedIndex + 1].id);
          } else {
            setSelectedMessageId(null);
            p.channelInputRef.current?.commands.focus();
          }
          break;
        }
        case "Escape": {
          event.preventDefault();
          setSelectedMessageId(null);
          p.channelInputRef.current?.commands.focus();
          break;
        }
        case "e": {
          if (hasModifier) break;
          if (!selectedMessage || selectedMessage.deletedAt) break;
          if (!p.canEditOrDelete(selectedMessage)) break;
          event.preventDefault();
          p.onStartEdit(selectedMessage.id);
          setSelectedMessageId(null);
          break;
        }
        case "r": {
          if (hasModifier) break;
          if (!selectedMessage || selectedMessage.deletedAt) break;
          event.preventDefault();
          p.onOpenReactionMenu(selectedMessage.id);
          break;
        }
        case "t": {
          if (hasModifier) break;
          if (!selectedMessage) break;
          event.preventDefault();
          p.onReply(selectedMessage.id);
          setSelectedMessageId(null);
          break;
        }
        case "Backspace":
        case "Delete": {
          if (hasModifier) break;
          if (!selectedMessage || selectedMessage.deletedAt) break;
          if (!p.canEditOrDelete(selectedMessage)) break;
          event.preventDefault();
          p.onDelete(selectedMessage.id);
          break;
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return {
    clearSelection,
    handleInputFocus,
    handleInputKeyDown,
    handleMessageClick,
    selectedMessageId,
  };
}
