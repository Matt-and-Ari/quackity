import { useEffect, useLayoutEffect, useRef, type KeyboardEvent, type ReactNode } from "react";

import clsx from "clsx";
import { Link } from "wouter";

import type { StagedFile } from "../../hooks/useFileUpload";
import { QUICK_REACTION_EMOJI, formatBytes, initials, nameFromEmail } from "../../lib/ui";
import type {
  ChannelRecord,
  InstantUserEntity,
  InstantUserWithAvatar,
  MessageAttachmentRecord,
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
  hasActiveCall: boolean;
  href: string;
  isActive: boolean;
  isRenaming: boolean;
  onCancelRename: () => void;
  onClick?: () => void;
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
  onClick?: () => void;
  onContextMenu: (event: React.MouseEvent, message: MessageRecord) => void;
  onDelete: () => void;
  onEditDraftChange: (value: string) => void;
  onOpenReactionMenu: (anchor: FloatingAnchor) => void;
  onReply: () => void;
  onSaveEdit: () => void;
  onStartEdit: () => void;
  onToggleReaction: (emoji: string) => void;
  usersById: Map<string, InstantUserWithAvatar>;
  workspaceMembersByUserId: Map<string, WorkspaceMemberRecord>;
}

interface MessageInputProps {
  onAddFiles?: (files: FileList) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onRemoveFile?: (fileId: string) => void;
  onSubmit: () => void;
  onValueChange: (value: string) => void;
  placeholder: string;
  stagedFiles?: StagedFile[];
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
  value: string;
}

interface ThreadPanelProps {
  currentUser: InstantUserEntity;
  currentUserId: string;
  editingDraft: string;
  editingMessageId: string | null;
  isMobile?: boolean;
  onAddFiles?: (files: FileList) => void;
  onCancelEdit: () => void;
  onClose: () => void;
  onDeleteMessage: (messageId: string) => void;
  onEditDraftChange: (value: string) => void;
  onMessageContextMenu: (event: React.MouseEvent, message: MessageRecord) => void;
  onRemoveFile?: (fileId: string) => void;
  onReply: () => void;
  onSaveEdit: () => void;
  onStartEdit: (messageId: string) => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onThreadDraftChange: (value: string) => void;
  replies: MessageRecord[];
  rootMessage: MessageRecord | null;
  stagedFiles?: StagedFile[];
  startThreadResize: (event: React.MouseEvent) => void;
  threadDraft: string;
  threadInputRef?: React.RefObject<HTMLTextAreaElement | null>;
  threadWidth: number;
  usersById: Map<string, InstantUserWithAvatar>;
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
      onClick={props.onClick}
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
      {props.hasActiveCall ? (
        <HoverTooltip content="Call in progress">
          <span
            className={clsx(
              "ml-auto flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[0.6rem] font-semibold",
              props.isActive ? "bg-white/20 text-white" : "bg-emerald-500/15 text-emerald-600",
            )}
          >
            <span
              className={clsx(
                "size-1.5 animate-pulse rounded-full",
                props.isActive ? "bg-white" : "bg-emerald-500",
              )}
            />
            Live
          </span>
        </HoverTooltip>
      ) : null}
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
                <AttachmentDisplay attachment={attachment} key={attachment.id} />
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasContent = props.value.trim().length > 0 || (props.stagedFiles ?? []).length > 0;
  const isDraggingRef = useRef(false);
  const dragCounterRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

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

  function handleFileInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (files && files.length > 0 && props.onAddFiles) {
      props.onAddFiles(files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleDragEnter(event: React.DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    dragCounterRef.current++;
    if (!isDraggingRef.current) {
      isDraggingRef.current = true;
      containerRef.current?.classList.add("ring-2", "ring-amber-400", "ring-inset");
    }
  }

  function handleDragLeave(event: React.DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      isDraggingRef.current = false;
      containerRef.current?.classList.remove("ring-2", "ring-amber-400", "ring-inset");
    }
  }

  function handleDragOver(event: React.DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    dragCounterRef.current = 0;
    isDraggingRef.current = false;
    containerRef.current?.classList.remove("ring-2", "ring-amber-400", "ring-inset");

    const files = event.dataTransfer.files;
    if (files.length > 0 && props.onAddFiles) {
      props.onAddFiles(files);
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = event.clipboardData.items;
    const files: File[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }

    if (files.length > 0 && props.onAddFiles) {
      props.onAddFiles(createFileList(files));
    }
  }

  const stagedFiles = props.stagedFiles ?? [];

  return (
    <div
      className="relative rounded-xl border border-amber-200/70 bg-white transition-colors duration-100 focus-within:border-amber-400"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      ref={containerRef}
    >
      {stagedFiles.length > 0 ? (
        <div className="flex flex-wrap gap-2 px-3 pt-3">
          {stagedFiles.map((staged) => (
            <StagedFileChip
              key={staged.id}
              onRemove={props.onRemoveFile ? () => props.onRemoveFile!(staged.id) : undefined}
              staged={staged}
            />
          ))}
        </div>
      ) : null}

      <div className="flex items-end">
        {props.onAddFiles ? (
          <>
            <input
              accept="*/*"
              className="hidden"
              multiple
              onChange={handleFileInputChange}
              ref={fileInputRef}
              type="file"
            />
            <HoverTooltip content="Attach a file">
              <button
                aria-label="Attach file"
                className="mb-2.5 ml-2 flex size-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors duration-100 hover:bg-amber-50 hover:text-slate-600"
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                <AttachGlyph />
              </button>
            </HoverTooltip>
          </>
        ) : null}

        <textarea
          className={clsx(
            "w-full resize-none bg-transparent px-3 py-3 pr-12 text-sm leading-6 text-slate-700 outline-none placeholder:text-slate-400",
            !props.onAddFiles && "pl-4",
          )}
          onChange={(event) => props.onValueChange(event.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={props.placeholder}
          ref={textareaRef}
          rows={1}
          value={props.value}
        />

        <button
          aria-label="Send message"
          className={clsx(
            "absolute bottom-2.5 right-3 flex size-7 select-none items-center justify-center rounded-lg transition-colors duration-100",
            hasContent
              ? "bg-amber-500 text-white hover:bg-amber-600"
              : "bg-amber-50 text-slate-300",
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
          onAddFiles={props.onAddFiles}
          onRemoveFile={props.onRemoveFile}
          onSubmit={props.onReply}
          onValueChange={props.onThreadDraftChange}
          placeholder="Reply in thread..."
          stagedFiles={props.stagedFiles}
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
  usersById: Map<string, InstantUserWithAvatar>;
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
            <AttachmentDisplay attachment={attachment} key={attachment.id} size="sm" />
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  }, []);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const nextHeight = Math.min(textarea.scrollHeight, MAX_INPUT_HEIGHT);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > MAX_INPUT_HEIGHT ? "auto" : "hidden";
  }, [props.value]);

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      props.onCancel();
      return;
    }
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      props.onSave();
    }
  }

  return (
    <>
      <textarea
        className="w-full resize-none rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm leading-6 text-slate-700 outline-none transition-colors duration-100 focus:border-amber-400"
        onChange={(event) => props.onValueChange(event.target.value)}
        onKeyDown={handleKeyDown}
        ref={textareaRef}
        rows={1}
        value={props.value}
      />
      <div className="mt-1.5 flex select-none items-center gap-2">
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
        <span className="ml-auto text-[0.6rem] text-slate-400">enter to save · esc to cancel</span>
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

function Avatar(props: { user?: InstantUserWithAvatar | null }) {
  const name = nameFromEmail(props.user?.email);
  const avatarUrl = props.user?.avatar?.url ?? props.user?.imageURL;

  return (
    <div className="relative mt-0.5 size-8 shrink-0 select-none overflow-hidden rounded-lg bg-gradient-to-br from-amber-300 to-amber-500">
      {avatarUrl ? (
        <img alt={name} className="h-full w-full object-cover" draggable={false} src={avatarUrl} />
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
  usersById: Map<string, InstantUserWithAvatar>;
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
  usersById: Map<string, InstantUserWithAvatar>;
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

function StagedFileChip(props: { onRemove?: () => void; staged: StagedFile }) {
  const isImage = props.staged.attachmentType === "image";

  return (
    <div
      className={clsx(
        "group relative inline-flex select-none items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs",
        props.staged.status === "error"
          ? "border-rose-200 bg-rose-50/60 text-rose-600"
          : props.staged.status === "uploading"
            ? "border-amber-200 bg-amber-50/60 text-amber-700"
            : "border-amber-100 bg-amber-50/50 text-slate-600",
      )}
    >
      {isImage && props.staged.previewUrl ? (
        <img
          alt={props.staged.name}
          className="size-8 rounded object-cover"
          draggable={false}
          src={props.staged.previewUrl}
        />
      ) : (
        <FileIconGlyph />
      )}
      <span className="max-w-[120px] truncate">{props.staged.name}</span>
      <span className="text-slate-400">{formatBytes(props.staged.sizeBytes)}</span>
      {props.staged.status === "uploading" ? (
        <span className="size-3 animate-spin rounded-full border-2 border-amber-300 border-t-amber-600" />
      ) : null}
      {props.onRemove && props.staged.status !== "uploading" ? (
        <button
          className="flex size-4 items-center justify-center rounded-full text-slate-400 opacity-0 transition-opacity duration-100 hover:bg-slate-200 hover:text-slate-600 group-hover:opacity-100"
          onClick={props.onRemove}
          type="button"
        >
          <svg fill="none" height="8" viewBox="0 0 8 8" width="8">
            <path
              d="M1 1l6 6M7 1l-6 6"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="1.5"
            />
          </svg>
        </button>
      ) : null}
    </div>
  );
}

function AttachmentDisplay(props: { attachment: MessageAttachmentRecord; size?: "sm" | "md" }) {
  const isImage = props.attachment.attachmentType === "image";
  const fileUrl = props.attachment.$file?.url;
  const small = props.size === "sm";

  if (isImage && fileUrl) {
    return (
      <a
        className={clsx(
          "block overflow-hidden rounded-lg border border-amber-100 transition-shadow duration-100 hover:shadow-md",
          small ? "max-w-[180px]" : "max-w-[280px]",
        )}
        href={fileUrl}
        rel="noopener noreferrer"
        target="_blank"
      >
        <img
          alt={props.attachment.name}
          className={clsx("w-full object-cover", small ? "max-h-[120px]" : "max-h-[200px]")}
          draggable={false}
          loading="lazy"
          src={fileUrl}
        />
        <div className="flex items-center gap-1.5 bg-amber-50/50 px-2.5 py-1.5">
          <span className="truncate text-xs text-slate-600">{props.attachment.name}</span>
          {props.attachment.sizeBytes ? (
            <span className="shrink-0 text-[0.65rem] text-slate-400">
              {formatBytes(props.attachment.sizeBytes)}
            </span>
          ) : null}
        </div>
      </a>
    );
  }

  return (
    <a
      className={clsx(
        "inline-flex select-none items-center gap-2 rounded-lg border border-amber-100 bg-amber-50/50 text-xs text-slate-600 transition-colors duration-100 hover:border-amber-200 hover:bg-amber-50",
        small ? "px-2 py-1" : "px-3 py-1.5",
      )}
      download={props.attachment.name}
      href={fileUrl ?? "#"}
      rel="noopener noreferrer"
      target="_blank"
    >
      <FileIconGlyph />
      <span className="max-w-[180px] truncate">{props.attachment.name}</span>
      {props.attachment.sizeBytes ? (
        <span className="text-slate-400">{formatBytes(props.attachment.sizeBytes)}</span>
      ) : null}
      <DownloadGlyph />
    </a>
  );
}

function createFileList(files: File[]): FileList {
  const dt = new DataTransfer();
  for (const file of files) {
    dt.items.add(file);
  }
  return dt.files;
}

function AttachGlyph() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 16 16">
      <path
        d="M13.5 7.5l-5.8 5.8a3.2 3.2 0 0 1-4.5-4.5l5.8-5.8a2 2 0 0 1 2.8 2.8L6 11.6a.8.8 0 0 1-1.1-1.1L10.1 5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.2"
      />
    </svg>
  );
}

function FileIconGlyph() {
  return (
    <svg className="size-4 shrink-0 text-amber-500" fill="none" viewBox="0 0 16 16">
      <path
        d="M9 1.5H4.5a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V5L9 1.5Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.1"
      />
      <path d="M9 1.5V5h3.5" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.1" />
    </svg>
  );
}

function DownloadGlyph() {
  return (
    <svg className="size-3.5 shrink-0 text-slate-400" fill="none" viewBox="0 0 14 14">
      <path
        d="M7 1.5v8M4 7l3 3 3-3M2.5 12h9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.2"
      />
    </svg>
  );
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
