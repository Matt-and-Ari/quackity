import type { Editor } from "@tiptap/react";

import type { StagedFile } from "../../hooks/useFileUpload";
import type {
  InstantUserEntity,
  InstantUserWithAvatar,
  MessageRecord,
  WorkspaceMemberRecord,
} from "../../types/quack";
import type { FloatingAnchor } from "../ui/floating";
import { MessageCard } from "./MessageCard";
import type { MentionSuggestionItem } from "./MentionList";
import { MessageInput } from "./MessageInput";
import { RightPanel } from "./RightPanel";

interface ThreadPanelProps {
  alsoSendToChannel: boolean;
  channelName: string;
  currentUser?: InstantUserEntity;
  currentUserId: string;
  editingDraft: string;
  editingMessageId: string | null;
  isMobile?: boolean;
  members?: MentionSuggestionItem[];
  onAddFiles?: (files: FileList) => void;
  onAlsoSendToChannelChange: (value: boolean) => void;
  onCancelEdit: () => void;
  onClose: () => void;
  onDeleteMessage: (messageId: string) => void;
  onEditDraftChange: (value: string) => void;
  onJumpToChannelPost: (channelPostMessageId: string) => void;
  onJumpToThreadSource: (threadReplyId: string, parentMessageId: string) => void;
  onMessageContextMenu: (event: React.MouseEvent, message: MessageRecord) => void;
  onOpenReactionMenu: (anchor: FloatingAnchor, messageId: string) => void;
  onRemoveFile?: (fileId: string) => void;
  onReply: () => void;
  onSaveEdit: () => void;
  onStartEdit: (messageId: string) => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onThreadDraftChange: (value: string) => void;
  onUserClick?: (userId: string) => void;
  replies: MessageRecord[];
  rootMessage: MessageRecord | null;
  selectedReplyId?: string | null;
  stagedFiles?: StagedFile[];
  startThreadResize: (event: React.MouseEvent) => void;
  threadDraft: string;
  threadInputRef?: React.RefObject<Editor | null>;
  threadScrollRef?: React.RefObject<HTMLDivElement | null>;
  threadWidth: number;
  usersById: Map<string, InstantUserWithAvatar>;
  workspaceMembersByUserId: Map<string, WorkspaceMemberRecord>;
}

export function ThreadPanel(props: ThreadPanelProps) {
  if (!props.rootMessage) {
    return null;
  }

  const rootMessage = props.rootMessage;
  const filteredReplies = props.replies.filter((r) => !r.deletedAt);

  function makeMessageCardProps(message: MessageRecord) {
    return {
      currentUserId: props.currentUserId,
      editingDraft: props.editingDraft,
      hideThreadActions: true,
      isActiveThread: false,
      isEditing: props.editingMessageId === message.id,
      isOwnMessage: message.sender?.id === props.currentUserId,
      isSelected: props.selectedReplyId === message.id,
      message,
      onCancelEdit: props.onCancelEdit,
      onContextMenu: props.onMessageContextMenu,
      onDelete: () => props.onDeleteMessage(message.id),
      onEditDraftChange: props.onEditDraftChange,
      onJumpToChannelPost: props.onJumpToChannelPost,
      onJumpToThreadSource: props.onJumpToThreadSource,
      onOpenReactionMenu: (anchor: FloatingAnchor) => props.onOpenReactionMenu(anchor, message.id),
      onReply: () => {},
      onSaveEdit: () => props.onSaveEdit(),
      onStartEdit: () => props.onStartEdit(message.id),
      onToggleReaction: (emoji: string) => props.onToggleReaction(message.id, emoji),
      onUserClick: props.onUserClick,
      usersById: props.usersById,
      workspaceMembersByUserId: props.workspaceMembersByUserId,
    };
  }

  return (
    <RightPanel
      isMobile={props.isMobile}
      onClose={props.onClose}
      startResize={props.startThreadResize}
      title="Thread"
      width={props.threadWidth}
    >
      <div
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 pt-3 pb-1 sm:px-3"
        ref={props.threadScrollRef}
      >
        <div className="flex flex-col gap-1">
          <MessageCard {...makeMessageCardProps(rootMessage)} />

          {filteredReplies.length > 0 ? (
            <>
              <div className="relative flex items-center py-1.5 select-none">
                <div className="flex-1 border-t border-amber-200/50" />
                <span className="mx-3 shrink-0 text-xs font-medium text-slate-400">
                  {filteredReplies.length} {filteredReplies.length === 1 ? "reply" : "replies"}
                </span>
                <div className="flex-1 border-t border-amber-200/50" />
              </div>

              {filteredReplies.map((reply) => (
                <MessageCard key={reply.id} {...makeMessageCardProps(reply)} />
              ))}
            </>
          ) : null}
        </div>
      </div>

      <div className="border-t border-amber-100/70 px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <label className="mb-2 flex cursor-pointer select-none items-center gap-2 px-1 text-xs text-slate-500">
          <input
            checked={props.alsoSendToChannel}
            className="size-3.5 accent-amber-500"
            onChange={(event) => props.onAlsoSendToChannelChange(event.target.checked)}
            type="checkbox"
          />
          Also send to <span className="font-medium text-slate-700">#{props.channelName}</span>
        </label>
        <MessageInput
          editorRef={props.threadInputRef}
          members={props.members}
          onAddFiles={props.onAddFiles}
          onRemoveFile={props.onRemoveFile}
          onSubmit={props.onReply}
          onValueChange={props.onThreadDraftChange}
          placeholder="Reply in thread..."
          stagedFiles={props.stagedFiles}
          value={props.threadDraft}
        />
      </div>
    </RightPanel>
  );
}
