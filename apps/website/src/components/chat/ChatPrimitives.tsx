import { useEffect, useLayoutEffect, useRef, type KeyboardEvent, type ReactNode } from "react";

import clsx from "clsx";
import { Link } from "wouter";

import { QUICK_REACTION_EMOJI, formatBytes, initials, nameFromEmail } from "../../lib/ui";
import type {
  ChannelRecord,
  InstantUserEntity,
  MessageRecord,
  ReactionRecord,
  WorkspaceMemberRecord,
} from "../../types/quack";
import { HoverTooltip } from "../ui/HoverTooltip";
import { anchorFromElement, type FloatingAnchor } from "../ui/floating";

const MAX_INPUT_HEIGHT = 160;

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

interface ResizeHandleProps {
  onMouseDown: (event: React.MouseEvent) => void;
  side: "left" | "right";
}

interface ChannelLinkProps {
  channel: ChannelRecord;
  href: string;
  isActive: boolean;
  isRenaming: boolean;
  onCancelRename: () => void;
  onContextMenu: (event: React.MouseEvent, channel: ChannelRecord) => void;
  onRenameValueChange: (value: string) => void;
  onSaveRename: () => void;
  renameValue: string;
}

interface MessageCardProps {
  currentUserId: string;
  editingDraft: string;
  isActiveThread: boolean;
  isEditing: boolean;
  isOwnMessage: boolean;
  isSelected?: boolean;
  message: MessageRecord;
  onCancelEdit: () => void;
  onContextMenu: (event: React.MouseEvent, message: MessageRecord) => void;
  onDelete: () => void;
  onEditDraftChange: (value: string) => void;
  onOpenReactionMenu: (anchor: FloatingAnchor) => void;
  onReply: () => void;
  onSaveEdit: () => void;
  onStartEdit: () => void;
  onToggleReaction: (emoji: string) => void;
  usersById: Map<string, InstantUserEntity>;
  workspaceMembersByUserId: Map<string, WorkspaceMemberRecord>;
}

interface MessageInputProps {
  onKeyDown?: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onSubmit: () => void;
  onValueChange: (value: string) => void;
  placeholder: string;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
  value: string;
}

interface ThreadPanelProps {
  currentUser: InstantUserEntity;
  currentUserId: string;
  editingDraft: string;
  editingMessageId: string | null;
  isMobile?: boolean;
  onCancelEdit: () => void;
  onClose: () => void;
  onDeleteMessage: (messageId: string) => void;
  onEditDraftChange: (value: string) => void;
  onMessageContextMenu: (event: React.MouseEvent, message: MessageRecord) => void;
  onReply: () => void;
  onSaveEdit: () => void;
  onStartEdit: (messageId: string) => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onThreadDraftChange: (value: string) => void;
  replies: MessageRecord[];
  rootMessage: MessageRecord | null;
  startThreadResize: (event: React.MouseEvent) => void;
  threadDraft: string;
  threadInputRef?: React.RefObject<HTMLTextAreaElement | null>;
  threadWidth: number;
  usersById: Map<string, InstantUserEntity>;
  workspaceMembersByUserId: Map<string, WorkspaceMemberRecord>;
}

interface ReactionSummary {
  count: number;
  emoji: string;
  reactedByCurrentUser: boolean;
  tooltip: string;
}

export function ResizeHandle(props: ResizeHandleProps) {
  return (
    <div
      className={clsx(
        "group absolute bottom-0 top-0 z-10 flex w-2 cursor-col-resize items-stretch",
        props.side === "right" ? "-right-1" : "-left-1",
      )}
      onMouseDown={props.onMouseDown}
    >
      <div className="mx-auto w-px bg-transparent transition-colors duration-75 group-hover:bg-amber-400 group-active:bg-amber-500" />
    </div>
  );
}

export function ChannelLink(props: ChannelLinkProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!props.isRenaming) {
      return;
    }

    requestAnimationFrame(() => inputRef.current?.select());
  }, [props.isRenaming]);

  function handleRenameKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      props.onSaveRename();
    }

    if (event.key === "Escape") {
      event.preventDefault();
      props.onCancelRename();
    }
  }

  if (props.isRenaming) {
    return (
      <div className="rounded-xl border border-amber-200/80 bg-white/85 px-2 py-1.5 shadow-[0_8px_24px_rgba(217,119,6,0.1)]">
        <div className="flex items-center gap-2">
          <span className="shrink-0 opacity-60">
            {props.channel.visibility === "private" ? "🔒" : "#"}
          </span>
          <input
            className="min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-700 outline-none"
            onBlur={props.onSaveRename}
            onChange={(event) => props.onRenameValueChange(event.target.value)}
            onKeyDown={handleRenameKeyDown}
            ref={inputRef}
            value={props.renameValue}
          />
        </div>
      </div>
    );
  }

  return (
    <Link
      className={clsx(
        "flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-sm transition-colors duration-100",
        props.isActive
          ? "bg-amber-500 font-medium text-white shadow-[0_8px_24px_rgba(245,158,11,0.24)]"
          : "text-slate-600 hover:bg-amber-100/60",
      )}
      href={props.href}
      onContextMenu={(event) => props.onContextMenu(event, props.channel)}
    >
      <HoverTooltip
        content={props.channel.visibility === "private" ? "Private channel" : "Public channel"}
      >
        <span className="shrink-0 opacity-60">
          {props.channel.visibility === "private" ? "🔒" : "#"}
        </span>
      </HoverTooltip>
      <span className="truncate">{props.channel.name}</span>
    </Link>
  );
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
    if (props.isSelected && messageRef.current) {
      messageRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
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
        <span className="mx-0.5 h-5 w-px bg-amber-100" />
        <ToolbarBtn
          disabled={isDeleted}
          icon={<ReactionGlyph />}
          label="Add reaction"
          onClick={handleOpenReactionMenu}
        />
        <ToolbarBtn icon={<ReplyGlyph />} label="Reply in thread" onClick={() => props.onReply()} />
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
        <Avatar user={sender} />
        <div className="min-w-0 flex-1">
          <div className="flex select-none flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-sm font-semibold text-slate-900">
              {senderMember?.displayName ?? nameFromEmail(sender?.email)}
            </span>
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
          ) : (
            <p
              className={clsx(
                "mt-1 whitespace-pre-wrap text-sm leading-relaxed",
                isDeleted ? "italic text-slate-400" : "text-slate-700",
              )}
            >
              {isDeleted ? "This message was deleted." : props.message.body}
            </p>
          )}

          {props.message.attachments && props.message.attachments.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {props.message.attachments.map((attachment) => (
                <div
                  className="inline-flex select-none items-center gap-2 rounded-lg border border-amber-100 bg-amber-50/50 px-3 py-1.5 text-xs text-slate-600"
                  key={attachment.id}
                >
                  <span>📎</span>
                  <span>{attachment.name}</span>
                  {attachment.sizeBytes ? (
                    <span className="text-slate-400">{formatBytes(attachment.sizeBytes)}</span>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          {reactions.length > 0 || (props.message.threadReplies?.length ?? 0) > 0 ? (
            <div className="mt-2 flex select-none flex-wrap items-center gap-1.5">
              <ReactionPills onToggleReaction={props.onToggleReaction} reactions={reactions} />
              {(props.message.threadReplies?.length ?? 0) > 0 ? (
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

export function MessageInput(props: MessageInputProps) {
  const fallbackRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = props.textareaRef ?? fallbackRef;
  const hasContent = props.value.trim().length > 0;

  useLayoutEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    const nextHeight = Math.min(textarea.scrollHeight, MAX_INPUT_HEIGHT);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > MAX_INPUT_HEIGHT ? "auto" : "hidden";
  }, [props.value, textareaRef]);

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    props.onKeyDown?.(event);
    if (event.defaultPrevented) return;

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      props.onSubmit();
    }
  }

  return (
    <div className="relative">
      <textarea
        className="w-full resize-none rounded-xl border border-amber-200/70 bg-white px-4 py-3 pr-12 text-sm leading-6 text-slate-700 outline-none transition-colors duration-100 placeholder:text-slate-400 focus:border-amber-400"
        onChange={(event) => props.onValueChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={props.placeholder}
        ref={textareaRef}
        rows={1}
        value={props.value}
      />
      <button
        aria-label="Send message"
        className={clsx(
          "absolute bottom-3.5 right-3 flex size-7 select-none items-center justify-center rounded-lg transition-colors duration-100",
          hasContent ? "bg-amber-500 text-white hover:bg-amber-600" : "bg-amber-50 text-slate-300",
        )}
        disabled={!hasContent}
        onClick={props.onSubmit}
        type="button"
      >
        <svg fill="none" height="14" viewBox="0 0 16 16" width="14">
          <path d="M3 13V9L11 8L3 7V3L14 8L3 13Z" fill="currentColor" />
        </svg>
      </button>
    </div>
  );
}

export function ThreadPanel(props: ThreadPanelProps) {
  if (!props.rootMessage) {
    return null;
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

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        <div className="flex flex-col gap-3">
          <ThreadMessage
            currentUserId={props.currentUserId}
            editingDraft={props.editingDraft}
            isEditing={props.editingMessageId === props.rootMessage.id}
            isOwnMessage={props.rootMessage.sender?.id === props.currentUserId}
            message={props.rootMessage}
            onCancelEdit={props.onCancelEdit}
            onContextMenu={props.onMessageContextMenu}
            onDelete={() => props.onDeleteMessage(props.rootMessage?.id ?? "")}
            onEditDraftChange={props.onEditDraftChange}
            onSaveEdit={props.onSaveEdit}
            onStartEdit={() => props.onStartEdit(props.rootMessage?.id ?? "")}
            onToggleReaction={(emoji) => props.onToggleReaction(props.rootMessage?.id ?? "", emoji)}
            sender={props.rootMessage.sender ?? props.currentUser}
            usersById={props.usersById}
            workspaceMembersByUserId={props.workspaceMembersByUserId}
          />

          {props.replies.filter((r) => !r.deletedAt).length > 0 ? (
            <div className="relative ml-5 flex flex-col gap-3 border-l-2 border-amber-200/60 pl-4">
              {props.replies
                .filter((r) => !r.deletedAt)
                .map((reply) => (
                  <ThreadMessage
                    currentUserId={props.currentUserId}
                    editingDraft={props.editingDraft}
                    isEditing={props.editingMessageId === reply.id}
                    isOwnMessage={reply.sender?.id === props.currentUserId}
                    key={reply.id}
                    message={reply}
                    onCancelEdit={props.onCancelEdit}
                    onContextMenu={props.onMessageContextMenu}
                    onDelete={() => props.onDeleteMessage(reply.id)}
                    onEditDraftChange={props.onEditDraftChange}
                    onSaveEdit={props.onSaveEdit}
                    onStartEdit={() => props.onStartEdit(reply.id)}
                    onToggleReaction={(emoji) => props.onToggleReaction(reply.id, emoji)}
                    sender={reply.sender ?? props.currentUser}
                    usersById={props.usersById}
                    workspaceMembersByUserId={props.workspaceMembersByUserId}
                  />
                ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="border-t border-amber-100/70 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <MessageInput
          onSubmit={props.onReply}
          onValueChange={props.onThreadDraftChange}
          placeholder="Reply in thread..."
          textareaRef={props.threadInputRef}
          value={props.threadDraft}
        />
      </div>
    </aside>
  );
}

interface ToolbarBtnProps {
  disabled?: boolean;
  icon: ReactNode;
  label: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

function ToolbarBtn(props: ToolbarBtnProps) {
  return (
    <HoverTooltip content={props.label}>
      <button
        className={clsx(
          "rounded-lg p-1.5 text-slate-500 transition-colors duration-100",
          props.disabled ? "cursor-not-allowed text-slate-300" : "hover:bg-amber-50",
        )}
        disabled={props.disabled}
        onClick={props.onClick}
        type="button"
      >
        <span className="block size-4">{props.icon}</span>
      </button>
    </HoverTooltip>
  );
}

interface ThreadMessageProps {
  currentUserId: string;
  editingDraft: string;
  isEditing: boolean;
  isOwnMessage: boolean;
  message: MessageRecord;
  onCancelEdit: () => void;
  onContextMenu: (event: React.MouseEvent, message: MessageRecord) => void;
  onDelete: () => void;
  onEditDraftChange: (value: string) => void;
  onSaveEdit: () => void;
  onStartEdit: () => void;
  onToggleReaction: (emoji: string) => void;
  sender: InstantUserEntity;
  usersById: Map<string, InstantUserEntity>;
  workspaceMembersByUserId: Map<string, WorkspaceMemberRecord>;
}

function ThreadMessage(props: ThreadMessageProps) {
  const reactions = summarizeReactions({
    currentUserId: props.currentUserId,
    reactionRecords: props.message.reactions ?? [],
    usersById: props.usersById,
    workspaceMembersByUserId: props.workspaceMembersByUserId,
  });
  const isDeleted = Boolean(props.message.deletedAt);
  const senderMember = props.sender.id
    ? props.workspaceMembersByUserId.get(props.sender.id)
    : undefined;

  return (
    <div
      className="rounded-xl px-2 py-1.5"
      onContextMenu={(event) => props.onContextMenu(event, props.message)}
    >
      <div className="flex select-none items-baseline gap-2">
        <span className="text-sm font-semibold text-slate-900">
          {senderMember?.displayName ?? nameFromEmail(props.sender.email)}
        </span>
        <time className="text-xs text-slate-400">
          {timeFormatter.format(new Date(props.message.createdAt))}
        </time>
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
      ) : (
        <p
          className={clsx(
            "mt-1 whitespace-pre-wrap text-sm leading-relaxed",
            isDeleted ? "italic text-slate-400" : "text-slate-600",
          )}
        >
          {isDeleted ? "This reply was deleted." : props.message.body}
        </p>
      )}
      {props.message.attachments && props.message.attachments.length > 0 ? (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {props.message.attachments.map((attachment) => (
            <span
              className="inline-flex select-none items-center gap-1 rounded-md border border-amber-100 bg-amber-50/50 px-2 py-1 text-xs text-slate-500"
              key={attachment.id}
            >
              📎 {attachment.name}
            </span>
          ))}
        </div>
      ) : null}
      {reactions.length > 0 ? (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <ReactionPills onToggleReaction={props.onToggleReaction} reactions={reactions} />
        </div>
      ) : null}
      {!props.isEditing ? (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
          {props.isOwnMessage ? (
            <>
              <button
                className={clsx(
                  "transition-colors duration-100",
                  isDeleted ? "cursor-not-allowed text-slate-300" : "hover:text-slate-600",
                )}
                disabled={isDeleted}
                onClick={props.onStartEdit}
                type="button"
              >
                Edit
              </button>
              <span>·</span>
              <button
                className={clsx(
                  "transition-colors duration-100",
                  isDeleted ? "cursor-not-allowed text-slate-300" : "hover:text-rose-500",
                )}
                disabled={isDeleted}
                onClick={props.onDelete}
                type="button"
              >
                Delete
              </button>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

interface MessageEditorProps {
  onCancel: () => void;
  onSave: () => void;
  onValueChange: (value: string) => void;
  value: string;
}

function MessageEditor(props: MessageEditorProps) {
  return (
    <>
      <textarea
        className="w-full resize-none rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm leading-6 text-slate-700 outline-none transition-colors duration-100 focus:border-amber-400"
        onChange={(event) => props.onValueChange(event.target.value)}
        rows={3}
        value={props.value}
      />
      <div className="mt-2 flex select-none gap-2">
        <button
          className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-white transition-colors duration-100 hover:bg-amber-600"
          onClick={props.onSave}
          type="button"
        >
          Save
        </button>
        <button
          className="rounded-lg border border-amber-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors duration-100 hover:bg-amber-50"
          onClick={props.onCancel}
          type="button"
        >
          Cancel
        </button>
      </div>
    </>
  );
}

interface ReactionPillsProps {
  onToggleReaction: (emoji: string) => void;
  reactions: ReactionSummary[];
}

function ReactionPills(props: ReactionPillsProps) {
  return (
    <>
      {props.reactions.map((reaction) => (
        <HoverTooltip content={reaction.tooltip} key={reaction.emoji}>
          <button
            className={clsx(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors duration-100",
              reaction.reactedByCurrentUser
                ? "border-amber-300 bg-amber-50 text-amber-800"
                : "border-amber-100 bg-white text-slate-600 hover:bg-amber-50",
            )}
            onClick={() => props.onToggleReaction(reaction.emoji)}
            type="button"
          >
            <span>{reaction.emoji}</span>
            <span>{reaction.count}</span>
          </button>
        </HoverTooltip>
      ))}
    </>
  );
}

function Avatar(props: { user?: InstantUserEntity | null }) {
  const name = nameFromEmail(props.user?.email);

  return (
    <div className="relative mt-0.5 size-8 shrink-0 select-none overflow-hidden rounded-lg bg-gradient-to-br from-amber-300 to-amber-500">
      {props.user?.imageURL ? (
        <img
          alt={name}
          className="h-full w-full object-cover"
          draggable={false}
          src={props.user.imageURL}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-white">
          {initials(name)}
        </div>
      )}
    </div>
  );
}

function summarizeReactions(props: {
  currentUserId: string;
  reactionRecords: ReactionRecord[];
  usersById: Map<string, InstantUserEntity>;
  workspaceMembersByUserId: Map<string, WorkspaceMemberRecord>;
}) {
  const summaryMap = new Map<string, ReactionSummary>();
  const participantMap = new Map<string, string[]>();

  for (const reaction of props.reactionRecords) {
    const userId = reaction.$user?.id;
    const existing = summaryMap.get(reaction.emoji);
    const participantName = messageParticipantName({
      userId,
      usersById: props.usersById,
      workspaceMembersByUserId: props.workspaceMembersByUserId,
    });
    const participants = participantMap.get(reaction.emoji) ?? [];
    participants.push(participantName);
    participantMap.set(reaction.emoji, participants);

    if (existing) {
      existing.count += 1;
      existing.reactedByCurrentUser ||= userId === props.currentUserId;
      continue;
    }

    summaryMap.set(reaction.emoji, {
      count: 1,
      emoji: reaction.emoji,
      reactedByCurrentUser: userId === props.currentUserId,
      tooltip: "",
    });
  }

  for (const [emoji, summary] of summaryMap) {
    summary.tooltip = reactionTooltipLabel(participantMap.get(emoji) ?? [], emoji);
  }

  return [...summaryMap.values()];
}

function messageParticipantName(props: {
  userId?: string;
  usersById: Map<string, InstantUserEntity>;
  workspaceMembersByUserId: Map<string, WorkspaceMemberRecord>;
}) {
  if (!props.userId) {
    return "Teammate";
  }

  return (
    props.workspaceMembersByUserId.get(props.userId)?.displayName ??
    nameFromEmail(props.usersById.get(props.userId)?.email)
  );
}

function reactionTooltipLabel(names: string[], emoji: string) {
  if (names.length === 0) {
    return `Reacted with ${emoji}`;
  }

  if (names.length === 1) {
    return `${names[0]} reacted with ${emoji}`;
  }

  if (names.length === 2) {
    return `${names[0]} and ${names[1]} reacted with ${emoji}`;
  }

  return `${names[0]}, ${names[1]}, and ${names.length - 2} more reacted with ${emoji}`;
}

export function EditGlyph(props: { className?: string }) {
  return (
    <svg className={clsx("size-4", props.className)} fill="none" viewBox="0 0 16 16">
      <path
        d="M10.77 2.63a1.5 1.5 0 1 1 2.12 2.12L6 11.64 3 12.5l.86-3 6.91-6.87Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.2"
      />
    </svg>
  );
}

export function ReplyGlyph(props: { className?: string }) {
  return (
    <svg className={clsx("size-4", props.className)} fill="none" viewBox="0 0 16 16">
      <path
        d="M6 5 3 8l3 3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.2"
      />
      <path
        d="M3.5 8H9a4 4 0 0 1 4 4v.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.2"
      />
    </svg>
  );
}

export function DeleteGlyph(props: { className?: string }) {
  return (
    <svg className={clsx("size-4", props.className)} fill="none" viewBox="0 0 16 16">
      <path
        d="M2.5 4h11M6.5 2.5h3M5 4v8.5m3-8.5v8.5m3-8.5v8.5M4.5 4l.4 9a1 1 0 0 0 1 .96h4.2a1 1 0 0 0 1-.96l.4-9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.2"
      />
    </svg>
  );
}

export function ReactionGlyph(props: { className?: string }) {
  return (
    <svg className={clsx("size-4", props.className)} fill="none" viewBox="0 0 16 16">
      <circle cx="7" cy="8.5" r="5" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M5.2 7.2h.01M8.8 7.2h.01M5 10.2c.5.7 1.1 1.1 2 1.1s1.5-.4 2-1.1"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.2"
      />
      <path d="M13 2v3M11.5 3.5h3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}

export function LeaveGlyph(props: { className?: string }) {
  return (
    <svg className={clsx("size-4", props.className)} fill="none" viewBox="0 0 16 16">
      <path
        d="M6 3.5H4.75A1.25 1.25 0 0 0 3.5 4.75v6.5A1.25 1.25 0 0 0 4.75 12.5H6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.2"
      />
      <path
        d="M8.5 5.5 11 8m0 0-2.5 2.5M11 8H6.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.2"
      />
    </svg>
  );
}
