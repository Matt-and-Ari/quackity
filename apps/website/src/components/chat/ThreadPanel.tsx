import type { Editor } from "@tiptap/react";
import clsx from "clsx";

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
import { ResizeHandle } from "./ResizeHandle";

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
      usersById: props.usersById,
      workspaceMembersByUserId: props.workspaceMembersByUserId,
    };
  }

  return (
    <aside
      className={clsx(
        "relative flex min-h-0 min-w-0 flex-col overflow-hidden",
        props.isMobile
          ? "h-full w-full"
          : "rounded-[1.45rem] border border-amber-200/60 bg-white/82 shadow-[0_18px_50px_rgba(15,23,42,0.07)]",
      )}
      style={props.isMobile ? undefined : { flexShrink: 0, width: props.threadWidth }}
    >
      {!props.isMobile ? <ResizeHandle onMouseDown={props.startThreadResize} side="left" /> : null}

      <div className="flex select-none items-center justify-between border-b border-amber-100/70 px-4 py-3">
        {props.isMobile ? (
          <button
            className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-slate-500 transition-colors duration-100 hover:bg-amber-50"
            onClick={props.onClose}
            type="button"
          >
            <svg fill="none" height="14" viewBox="0 0 14 14" width="14">
              <path
                d="M9 2.5 4.5 7 9 11.5"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
              />
            </svg>
            Back
          </button>
        ) : null}
        <h3 className="text-sm font-semibold text-slate-900">Thread</h3>
        {!props.isMobile ? (
          <button
            className="rounded-md px-2 py-1 text-xs text-slate-500 transition-colors duration-100 hover:bg-amber-50"
            onClick={props.onClose}
            type="button"
          >
            Close
          </button>
        ) : (
          <div />
        )}
      </div>

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
    </aside>
  );
}
