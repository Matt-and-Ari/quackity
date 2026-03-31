import { useEffect, useRef } from "react";

import clsx from "clsx";

import { QUICK_REACTION_EMOJI, nameFromEmail } from "../../lib/ui";
import type {
  InstantUserWithAvatar,
  MessageRecord,
  WorkspaceMemberRecord,
} from "../../types/quack";
import { HoverTooltip } from "../ui/HoverTooltip";
import { anchorFromElement, type FloatingAnchor } from "../ui/floating";
import { Avatar } from "./Avatar";
import { MessageBody } from "./MessageBody";
import { MessageEditor } from "./MessageEditor";
import { getEditorPlainText } from "./RichTextEditor";
import { ChannelHashGlyph, DeleteGlyph, EditGlyph, ReactionGlyph, ReplyGlyph } from "./chat-glyphs";
import { timeFormatter, truncateText } from "./chat-date-utils";
import { AttachmentDisplay, ReactionPills, ToolbarBtn, summarizeReactions } from "./message-utils";

interface MessageCardProps {
  currentUserId: string;
  editingDraft: string;
  hideThreadActions?: boolean;
  isActiveThread: boolean;
  isEditing: boolean;
  isOwnMessage: boolean;
  isSelected?: boolean;
  message: MessageRecord;
  onCancelEdit: () => void;
  onClick?: () => void;
  onContextMenu: (event: React.MouseEvent, message: MessageRecord) => void;
  onDelete: () => void;
  onEditDraftChange: (value: string) => void;
  onJumpToChannelPost?: (channelPostMessageId: string) => void;
  onJumpToThreadSource?: (threadReplyId: string, parentMessageId: string) => void;
  onOpenReactionMenu: (anchor: FloatingAnchor) => void;
  onReply: () => void;
  onSaveEdit: () => void;
  onStartEdit: () => void;
  onToggleReaction: (emoji: string) => void;
  onUserClick?: (userId: string) => void;
  usersById: Map<string, InstantUserWithAvatar>;
  workspaceMembersByUserId: Map<string, WorkspaceMemberRecord>;
}

export function MessageCard(props: MessageCardProps) {
  const reactions = summarizeReactions({
    currentUserId: props.currentUserId,
    reactionRecords: props.message.reactions ?? [],
    usersById: props.usersById,
    workspaceMembersByUserId: props.workspaceMembersByUserId,
  });
  const isDeleted = Boolean(props.message.deletedAt);
  const sender = props.message.sender;
  const senderMember = sender?.id ? props.workspaceMembersByUserId.get(sender.id) : undefined;
  const messageRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = messageRef.current;
    if (!props.isSelected || !el) return;

    let parent = el.parentElement;
    while (parent && parent !== document.documentElement) {
      const { overflowY } = getComputedStyle(parent);
      if (overflowY === "auto" || overflowY === "scroll") break;
      parent = parent.parentElement;
    }

    if (parent && parent !== document.documentElement) {
      const elBottom = el.offsetTop + el.offsetHeight;
      const remaining = parent.scrollHeight - elBottom;
      if (remaining < parent.clientHeight / 2) {
        parent.scrollTo({ top: parent.scrollHeight, behavior: "smooth" });
        return;
      }
    }

    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [props.isSelected]);

  function handleOpenReactionMenu(event: React.MouseEvent<HTMLButtonElement>) {
    const anchor = anchorFromElement(event.currentTarget);

    if (!anchor) {
      return;
    }

    props.onOpenReactionMenu(anchor);
  }

  return (
    <article
      className={clsx(
        "group relative rounded-xl px-3 py-2.5 transition-colors duration-100 sm:rounded-2xl sm:px-4 sm:py-3",
        props.isSelected
          ? "bg-amber-50 ring-2 ring-amber-300/70 ring-inset"
          : props.isActiveThread
            ? "bg-amber-50"
            : "hover:bg-slate-50/80",
      )}
      data-message-id={props.message.id}
      onClick={props.onClick}
      onContextMenu={(event) => props.onContextMenu(event, props.message)}
      ref={messageRef}
    >
      <div className="absolute -top-3 right-3 hidden select-none items-center gap-0.5 rounded-xl border border-amber-100 bg-white/96 px-1 py-1 opacity-0 shadow-[0_12px_28px_rgba(15,23,42,0.12)] transition-opacity duration-100 group-focus-within:opacity-100 group-hover:opacity-100 sm:flex">
        {QUICK_REACTION_EMOJI.map((emoji) => (
          <HoverTooltip content={`React with ${emoji}`} key={emoji}>
            <button
              className={clsx(
                "rounded-lg px-2 py-1 text-sm transition-colors duration-100",
                isDeleted ? "cursor-not-allowed text-slate-300" : "hover:bg-amber-50",
              )}
              disabled={isDeleted}
              onClick={() => props.onToggleReaction(emoji)}
              type="button"
            >
              {emoji}
            </button>
          </HoverTooltip>
        ))}
        <ToolbarBtn
          disabled={isDeleted}
          icon={<ReactionGlyph />}
          label="Add reaction"
          onClick={handleOpenReactionMenu}
        />
        {!props.hideThreadActions ? (
          <>
            <span className="mx-0.5 h-5 w-px bg-amber-100" />
            <ToolbarBtn
              icon={<ReplyGlyph />}
              label="Reply in thread"
              onClick={() => props.onReply()}
            />
          </>
        ) : null}
        {props.isOwnMessage ? (
          <>
            <ToolbarBtn
              disabled={isDeleted}
              icon={<EditGlyph />}
              label="Edit message"
              onClick={() => props.onStartEdit()}
            />
            <ToolbarBtn
              disabled={isDeleted}
              icon={<DeleteGlyph />}
              label="Delete message"
              onClick={() => props.onDelete()}
            />
          </>
        ) : null}
      </div>

      <div className="flex gap-3">
        <button
          className="mt-0.5 shrink-0 cursor-pointer"
          onClick={() => sender?.id && props.onUserClick?.(sender.id)}
          type="button"
        >
          <Avatar user={sender} />
        </button>
        <div className="min-w-0 flex-1">
          {props.message.channelPost ? (
            <button
              className="mb-1 flex items-center gap-1 text-xs text-cyan-600 transition-colors duration-100 hover:text-cyan-700 hover:underline"
              onClick={() => {
                if (props.message.channelPost?.id) {
                  props.onJumpToChannelPost?.(props.message.channelPost.id);
                }
              }}
              type="button"
            >
              <ChannelHashGlyph />
              <span>Also sent to #{props.message.channelPost.channel?.name ?? "channel"}</span>
            </button>
          ) : null}

          {props.message.threadSource ? (
            <button
              className="mb-1 flex items-center gap-1 text-xs text-cyan-600 transition-colors duration-100 hover:text-cyan-700 hover:underline"
              onClick={() => {
                const parentId = props.message.threadSource?.parentMessage?.id;
                if (parentId) {
                  props.onJumpToThreadSource?.(props.message.threadSource!.id, parentId);
                }
              }}
              type="button"
            >
              <ReplyGlyph className="size-3" />
              <span className="truncate">
                replied to a thread:{" "}
                {truncateText(
                  getEditorPlainText(props.message.threadSource?.parentMessage?.body ?? ""),
                  60,
                )}
              </span>
            </button>
          ) : null}

          <div className="flex select-none flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <button
              className="text-sm font-semibold text-slate-900 hover:underline"
              onClick={() => sender?.id && props.onUserClick?.(sender.id)}
              type="button"
            >
              {senderMember?.displayName ?? nameFromEmail(sender?.email)}
            </button>
            <time className="text-xs text-slate-400">
              {timeFormatter.format(new Date(props.message.createdAt))}
            </time>
            {props.message.updatedAt ? (
              <span className="text-[0.65rem] text-slate-400">(edited)</span>
            ) : null}
          </div>

          {props.isEditing ? (
            <div className="mt-2">
              <MessageEditor
                onCancel={props.onCancelEdit}
                onSave={props.onSaveEdit}
                onValueChange={props.onEditDraftChange}
                value={props.editingDraft}
              />
            </div>
          ) : isDeleted ? (
            <p className="mt-1 whitespace-pre-wrap break-words text-sm italic leading-relaxed text-slate-400">
              This message was deleted.
            </p>
          ) : (
            <MessageBody
              body={props.message.body ?? ""}
              className="mt-1"
              currentUserId={props.currentUserId}
              onMentionClick={props.onUserClick}
            />
          )}

          {props.message.attachments && props.message.attachments.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {props.message.attachments.map((attachment) => (
                <AttachmentDisplay attachment={attachment} key={attachment.id} />
              ))}
            </div>
          ) : null}

          {reactions.length > 0 ||
          (!props.hideThreadActions && (props.message.threadReplies?.length ?? 0) > 0) ? (
            <div className="mt-2 flex select-none flex-wrap items-center gap-1.5">
              <ReactionPills onToggleReaction={props.onToggleReaction} reactions={reactions} />
              {!props.hideThreadActions && (props.message.threadReplies?.length ?? 0) > 0 ? (
                <HoverTooltip
                  content={
                    props.message.threadReplies?.length === 1
                      ? "Open 1 reply"
                      : `Open ${props.message.threadReplies?.length ?? 0} replies`
                  }
                >
                  <button
                    className="inline-flex items-center gap-1.5 rounded-full border border-amber-100 bg-white px-2.5 py-1 text-xs text-slate-500 transition-colors duration-100 hover:bg-amber-50"
                    onClick={props.onReply}
                    type="button"
                  >
                    <ReplyGlyph className="size-3.5" />
                    <span>
                      {props.message.threadReplies?.length ?? 0}{" "}
                      {(props.message.threadReplies?.length ?? 0) === 1 ? "reply" : "replies"}
                    </span>
                  </button>
                </HoverTooltip>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
