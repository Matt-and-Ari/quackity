import { useState } from "react";

import {
  CopyGlyph,
  DeleteGlyph,
  EditGlyph,
  LeaveGlyph,
  ReactionGlyph,
  ReplyGlyph,
} from "../../../components/chat/chat-glyphs";
import { getEditorPlainText } from "../../../components/chat/RichTextEditor";
import type { ContextMenuEntry, ContextMenuState } from "../../../components/ui/GlobalContextMenu";
import { anchorFromPoint, type FloatingAnchor } from "../../../components/ui/floating";
import { CallGlyph, HangUpGlyph } from "../components/WorkspaceGlyphs";
import type { ChannelRecord, MessageRecord } from "../../../types/quack";

interface UseContextMenusProps {
  activeChannelId: string | undefined;
  canManageChannels: boolean;
  currentUserId: string;
  isInCall: boolean;
  callChannelId: string | null;
  navigate: (to: string) => void;
  onDeleteChannel: (channelId: string) => void;
  onEditChannel: (channelId: string) => void;
  onLeaveCall: () => void;
  onLeaveChannel: (channelId: string) => void;
  onOpenPrejoin: () => void;
  onOpenThread: (messageId: string) => void;
  onSetPendingDeleteMessageId: (messageId: string) => void;
  onStartEditMessage: (messageId: string) => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
  openEmojiMenu: (anchor: FloatingAnchor, messageId: string) => void;
  visibleChannelsCount: number;
  workspaceSlug: string;
}

export function useContextMenus(props: UseContextMenusProps) {
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  function closeContextMenu() {
    setContextMenu(null);
  }

  function isOwnMessage(message: MessageRecord) {
    return message.sender?.id === props.currentUserId;
  }

  function handleChannelContextMenu(event: React.MouseEvent, channel: ChannelRecord) {
    event.preventDefault();

    const canRemoveChannel = props.visibleChannelsCount > 1;
    const hasMembership = Boolean(
      channel.members?.some((member) => member.$user?.id === props.currentUserId),
    );
    const canLeaveChannel = canRemoveChannel && hasMembership;
    const isInCallOnThisChannel = props.isInCall && props.callChannelId === channel.id;

    const entries: ContextMenuEntry[] = [];

    if (!props.isInCall) {
      entries.push({
        disabled: !channel.id,
        hint: "Start a new call in this channel",
        icon: <CallGlyph />,
        id: "start-call",
        label: "Start call",
        onSelect: () => {
          if (channel.id !== props.activeChannelId) {
            props.navigate(`/workspaces/${props.workspaceSlug}/channels/${channel.slug}`);
          }
          requestAnimationFrame(() => props.onOpenPrejoin());
        },
      });
    }

    if (isInCallOnThisChannel) {
      entries.push({
        disabled: false,
        hint: "Leave the active call",
        icon: <HangUpGlyph />,
        id: "leave-call",
        label: "Leave call",
        onSelect: () => props.onLeaveCall(),
        tone: "danger",
      });
    }

    if (entries.length > 0) {
      entries.push({ id: "separator-call-actions", type: "separator" });
    }

    entries.push(
      {
        disabled: !props.canManageChannels,
        hint: props.canManageChannels
          ? "Edit name, description, and visibility"
          : "Only workspace managers can edit channels",
        icon: <EditGlyph />,
        id: "edit-channel",
        label: "Edit channel",
        onSelect: () => props.onEditChannel(channel.id),
      },
      {
        disabled: !canLeaveChannel,
        hint: !canRemoveChannel
          ? "At least one channel must remain"
          : !hasMembership
            ? "You are not a member of this channel"
            : "Remove this channel from your sidebar",
        icon: <LeaveGlyph />,
        id: "leave-channel",
        label: "Leave channel",
        onSelect: () => props.onLeaveChannel(channel.id),
      },
      { id: "separator-channel-actions", type: "separator" },
      {
        disabled: !props.canManageChannels || !canRemoveChannel,
        hint: !canRemoveChannel
          ? "At least one channel must remain"
          : props.canManageChannels
            ? "Permanently delete this channel and all its messages"
            : "Only workspace managers can delete channels",
        icon: <DeleteGlyph />,
        id: "delete-channel",
        label: "Delete channel",
        onSelect: () => props.onDeleteChannel(channel.id),
        tone: "danger",
      },
    );

    setContextMenu({
      entries,
      subtitle: channel.visibility === "private" ? "Private channel" : "Public channel",
      title: `#${channel.name}`,
      x: event.clientX,
      y: event.clientY,
    });
  }

  function buildMessageEntries(
    message: MessageRecord,
    menuX: number,
    menuY: number,
    options?: { includeReplyInThread?: boolean },
  ): ContextMenuEntry[] {
    const isDeleted = Boolean(message.deletedAt);
    const isOwn = isOwnMessage(message);
    const entries: ContextMenuEntry[] = [];

    if (options?.includeReplyInThread) {
      const threadTargetMessageId = message.parentMessage?.id ?? message.id;
      entries.push({
        hint: message.parentMessage ? "Jump back to the thread" : "Open the conversation drawer",
        hotkey: "t",
        icon: <ReplyGlyph />,
        id: "reply-thread",
        label: "Reply in thread",
        onSelect: () => props.onOpenThread(threadTargetMessageId),
      });
    }

    entries.push(
      {
        disabled: isDeleted,
        hint: isDeleted ? "Unavailable for deleted messages" : "Browse the full emoji menu",
        hotkey: "r",
        icon: <ReactionGlyph />,
        id: "add-reaction",
        label: "Add reaction",
        onSelect: () => {
          requestAnimationFrame(() => {
            props.openEmojiMenu(anchorFromPoint(menuX, menuY), message.id);
          });
        },
      },
      {
        disabled: isDeleted || !message.body,
        hint: isDeleted ? "Unavailable for deleted messages" : "Copy the message text",
        hotkey: "⌘C",
        icon: <CopyGlyph />,
        id: "copy-text",
        label: "Copy text",
        onSelect: () => {
          if (message.body) {
            void navigator.clipboard.writeText(getEditorPlainText(message.body));
          }
        },
      },
    );

    if (isOwn) {
      entries.push(
        { id: "separator-message-actions", type: "separator" },
        {
          disabled: isDeleted,
          hint: isDeleted ? "Deleted messages cannot be edited" : "Open the inline editor",
          hotkey: "e",
          icon: <EditGlyph />,
          id: "edit-message",
          label: "Edit message",
          onSelect: () => props.onStartEditMessage(message.id),
        },
        {
          disabled: isDeleted,
          hint: isDeleted
            ? "This message is already deleted"
            : "Replace the body with a deleted state",
          hotkey: "⌫",
          icon: <DeleteGlyph />,
          id: "delete-message",
          label: "Delete message",
          onSelect: () => props.onSetPendingDeleteMessageId(message.id),
          tone: "danger",
        },
      );
    }

    return entries;
  }

  function handleMessageContextMenu(event: React.MouseEvent, message: MessageRecord) {
    event.preventDefault();

    const entries = buildMessageEntries(message, event.clientX, event.clientY, {
      includeReplyInThread: true,
    });

    setContextMenu({
      entries,
      subtitle: "Message actions",
      title: "Conversation menu",
      x: event.clientX,
      y: event.clientY,
    });
  }

  function handleThreadMessageContextMenu(event: React.MouseEvent, message: MessageRecord) {
    event.preventDefault();

    const entries = buildMessageEntries(message, event.clientX, event.clientY, {
      includeReplyInThread: false,
    });

    setContextMenu({
      entries,
      subtitle: "Message actions",
      title: "Thread menu",
      x: event.clientX,
      y: event.clientY,
    });
  }

  return {
    closeContextMenu,
    contextMenu,
    handleChannelContextMenu,
    handleMessageContextMenu,
    handleThreadMessageContextMenu,
    setContextMenu,
  };
}
