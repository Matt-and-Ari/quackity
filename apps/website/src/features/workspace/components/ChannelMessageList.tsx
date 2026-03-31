import { forwardRef } from "react";

import { DateHeading, dateDayKey } from "../../../components/chat/chat-date-utils";
import { MessageCard } from "../../../components/chat/MessageCard";
import type { FloatingAnchor } from "../../../components/ui/floating";
import type {
  InstantUserWithAvatar,
  MessageRecord,
  WorkspaceMemberRecord,
} from "../../../types/quack";
import { ChannelEmptyState } from "./WorkspaceGlyphs";

interface ChannelMessageListProps {
  activeThreadMessageId: string | undefined;
  channelName: string;
  currentUserId: string;
  editingDraft: string;
  editingMessageId: string | null;
  isMessagesLoading: boolean;
  messages: MessageRecord[];
  onCancelEdit: () => void;
  onContextMenu: (event: React.MouseEvent, message: MessageRecord) => void;
  onDelete: (messageId: string) => void;
  onEditDraftChange: (value: string) => void;
  onJumpToThreadSource: (threadReplyId: string, parentMessageId: string) => void;
  onMessageClick: (messageId: string) => void;
  onOpenReactionMenu: (anchor: FloatingAnchor, messageId: string) => void;
  onReply: (messageId: string) => void;
  onSaveEdit: () => void;
  onStartEdit: (messageId: string) => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
  selectedMessageId: string | null;
  usersById: Map<string, InstantUserWithAvatar>;
  workspaceMembersByUserId: Map<string, WorkspaceMemberRecord>;
}

export const ChannelMessageList = forwardRef<HTMLElement, ChannelMessageListProps>(
  function ChannelMessageList(props, ref) {
    const visibleMessages = props.messages.filter((m) => !m.deletedAt);

    return (
      <section
        ref={ref}
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden flex flex-col-reverse px-2 pt-3 pb-1 sm:px-4 sm:pt-4 sm:pb-1.5"
      >
        {props.isMessagesLoading ? (
          <div className="flex flex-1 items-center justify-center py-12">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-300 border-t-amber-500" />
          </div>
        ) : visibleMessages.length === 0 ? (
          <ChannelEmptyState channelName={props.channelName} />
        ) : (
          <div className="flex flex-col gap-1">
            {visibleMessages.map((message, index) => {
              const prevMessage = index > 0 ? visibleMessages[index - 1] : null;
              const showDateHeading =
                !prevMessage || dateDayKey(message.createdAt) !== dateDayKey(prevMessage.createdAt);

              return (
                <div key={message.id}>
                  {showDateHeading ? <DateHeading timestamp={message.createdAt} /> : null}
                  <MessageCard
                    currentUserId={props.currentUserId}
                    editingDraft={props.editingDraft}
                    isActiveThread={message.id === props.activeThreadMessageId}
                    isEditing={props.editingMessageId === message.id}
                    isOwnMessage={message.sender?.id === props.currentUserId}
                    isSelected={props.selectedMessageId === message.id}
                    message={message}
                    onCancelEdit={props.onCancelEdit}
                    onClick={() => props.onMessageClick(message.id)}
                    onContextMenu={props.onContextMenu}
                    onDelete={() => props.onDelete(message.id)}
                    onEditDraftChange={props.onEditDraftChange}
                    onJumpToThreadSource={props.onJumpToThreadSource}
                    onOpenReactionMenu={(anchor) => props.onOpenReactionMenu(anchor, message.id)}
                    onReply={() => props.onReply(message.id)}
                    onSaveEdit={props.onSaveEdit}
                    onStartEdit={() => props.onStartEdit(message.id)}
                    onToggleReaction={(emoji) => props.onToggleReaction(message.id, emoji)}
                    usersById={props.usersById}
                    workspaceMembersByUserId={props.workspaceMembersByUserId}
                  />
                </div>
              );
            })}
          </div>
        )}
      </section>
    );
  },
);
