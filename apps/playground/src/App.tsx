import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";

import clsx from "clsx";
import { Link } from "wouter";

import {
  quickReactionEmoji,
  type MockAttachment,
  type MockChannel,
  type MockMessage,
  type MockReaction,
  type MockWorkspaceMember,
  type User,
} from "./quack-data";
import { useQuackApp } from "./use-quack-app";

const MAX_INPUT_HEIGHT = 160;

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

/* ── Resize hook ── */

function useResizeHandle(props: {
  defaultWidth: number;
  minWidth: number;
  maxWidth: number;
  side: "right" | "left";
}) {
  const [width, setWidth] = useState(props.defaultWidth);
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      const drag = dragRef.current;

      if (!drag) {
        return;
      }

      const diff = e.clientX - drag.startX;
      const next = props.side === "right" ? drag.startWidth + diff : drag.startWidth - diff;
      setWidth(Math.max(props.minWidth, Math.min(props.maxWidth, next)));
    }

    function onMouseUp() {
      if (!dragRef.current) {
        return;
      }

      dragRef.current = null;
      document.body.style.removeProperty("cursor");
      document.body.style.removeProperty("user-select");
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [props.minWidth, props.maxWidth, props.side]);

  function startResize(e: React.MouseEvent) {
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startWidth: width };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }

  return { width, startResize };
}

/* ── App ── */

export default function App() {
  const app = useQuackApp();
  const currentUserMember = app.workspaceMembersByUserId.get(app.currentUser.id);
  const hasThread = app.selectedThreadMessage !== null;

  const sidebar = useResizeHandle({
    defaultWidth: 248,
    minWidth: 180,
    maxWidth: 360,
    side: "right",
  });
  const thread = useResizeHandle({ defaultWidth: 336, minWidth: 260, maxWidth: 480, side: "left" });

  const channelInputRef = useRef<HTMLTextAreaElement>(null);
  const threadInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    channelInputRef.current?.focus();
  }, [app.activeChannel.id]);

  const prevThreadRef = useRef(app.selectedThreadMessage);

  useEffect(() => {
    const wasOpen = prevThreadRef.current !== null;
    const isOpen = app.selectedThreadMessage !== null;
    prevThreadRef.current = app.selectedThreadMessage;

    if (isOpen && !wasOpen) {
      requestAnimationFrame(() => threadInputRef.current?.focus());
    } else if (!isOpen && wasOpen) {
      channelInputRef.current?.focus();
    }
  }, [app.selectedThreadMessage]);

  return (
    <div className="h-screen overflow-hidden p-2 sm:p-3">
      <div className="flex h-full gap-2 sm:gap-3">
        {/* ── Sidebar ── */}
        <aside
          style={{ width: sidebar.width, flexShrink: 0 }}
          className="relative flex min-h-0 flex-col overflow-hidden rounded-2xl border border-amber-200/60 bg-amber-50/70 select-none"
        >
          <div className="flex items-center gap-3 border-b border-amber-200/50 px-4 py-3.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-base shadow-sm">
              🦆
            </div>
            <h1 className="truncate text-[0.95rem] font-semibold tracking-tight text-slate-900">
              {app.workspace.name}
            </h1>
          </div>

          <div className="flex items-center gap-2.5 border-b border-amber-200/50 px-4 py-3">
            <span className="size-2 shrink-0 rounded-full bg-emerald-500" />
            <span className="truncate text-sm font-medium text-slate-700">
              {currentUserMember?.displayName ?? "You"}
            </span>
            <span className="ml-auto truncate text-xs text-slate-400">
              {currentUserMember?.role}
            </span>
          </div>

          <nav
            className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-3"
            aria-label="Channels"
          >
            <p className="mb-1 px-2 text-[0.65rem] font-semibold uppercase tracking-widest text-slate-400">
              Channels
            </p>
            {app.visibleChannels.map((channel) => (
              <ChannelLink
                key={channel.id}
                channel={channel}
                isActive={channel.id === app.activeChannel.id}
              />
            ))}
          </nav>

          <div className="border-t border-amber-200/50 px-3 py-3">
            <p className="mb-2 px-1 text-[0.65rem] font-semibold uppercase tracking-widest text-slate-400">
              Members
            </p>
            <div className="flex flex-col gap-1">
              {app.onlineMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-600"
                >
                  <span
                    className={clsx(
                      "size-1.5 shrink-0 rounded-full",
                      member.status === "online"
                        ? "bg-emerald-500"
                        : member.status === "away"
                          ? "bg-amber-400"
                          : "bg-sky-500",
                    )}
                  />
                  <span className="truncate">{member.displayName}</span>
                </div>
              ))}
            </div>
          </div>

          <ResizeHandle side="right" onMouseDown={sidebar.startResize} />
        </aside>

        {/* ── Main channel ── */}
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-amber-200/60 bg-white/80">
          <header className="select-none border-b border-amber-100/70 px-5 py-3.5">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
              #{app.activeChannel.name}
            </h2>
            {app.activeChannel.topic ? (
              <p className="mt-0.5 truncate text-sm text-slate-500">{app.activeChannel.topic}</p>
            ) : null}
          </header>

          <section className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            <div className="mx-auto flex max-w-3xl flex-col gap-1">
              {app.messages.map((message) => {
                const sender = app.usersById.get(message.senderUserId) ?? app.currentUser;
                const senderMember = app.workspaceMembersByUserId.get(message.senderUserId);

                return (
                  <MessageCard
                    key={message.id}
                    attachments={app.attachmentsByMessageId.get(message.id) ?? []}
                    currentUserId={app.currentUser.id}
                    editingDraft={app.editingDraft}
                    isActiveThread={message.id === app.selectedThreadMessage?.id}
                    isEditing={app.editingMessageId === message.id}
                    message={message}
                    onCancelEdit={app.cancelEditingMessage}
                    onDelete={() => app.deleteMessage(message.id)}
                    onEditDraftChange={app.setEditingDraft}
                    onReply={() => app.openThread(message.id)}
                    onSaveEdit={app.saveEditingMessage}
                    onStartEdit={() => app.startEditingMessage(message.id)}
                    onToggleReaction={(emoji) => app.toggleReaction(message.id, emoji)}
                    reactionRecords={app.reactionsByMessageId.get(message.id) ?? []}
                    replyCount={app.threadReplyCountByMessageId.get(message.id) ?? 0}
                    sender={sender}
                    senderMember={senderMember}
                  />
                );
              })}
            </div>
          </section>

          <footer className="border-t border-amber-100/70 px-4 py-3">
            <div className="mx-auto max-w-3xl">
              <MessageInput
                placeholder={`Message #${app.activeChannel.name}`}
                value={app.channelDraft}
                onValueChange={app.setChannelDraft}
                onSubmit={app.sendChannelMessage}
                textareaRef={channelInputRef}
              />
            </div>
          </footer>
        </main>

        {/* ── Thread panel (conditional) ── */}
        {hasThread ? (
          <ThreadPanel
            attachmentsByMessageId={app.attachmentsByMessageId}
            currentUser={app.currentUser}
            currentUserMember={currentUserMember}
            onClose={app.closeThread}
            onReply={app.sendThreadReply}
            replies={app.selectedThreadReplies}
            rootMessage={app.selectedThreadMessage}
            threadDraft={app.threadDraft}
            threadWidth={thread.width}
            startThreadResize={thread.startResize}
            usersById={app.usersById}
            workspaceMembersByUserId={app.workspaceMembersByUserId}
            onThreadDraftChange={app.setThreadDraft}
            threadInputRef={threadInputRef}
          />
        ) : null}
      </div>
    </div>
  );
}

/* ── Resize handle ── */

interface ResizeHandleProps {
  side: "right" | "left";
  onMouseDown: (e: React.MouseEvent) => void;
}

function ResizeHandle(props: ResizeHandleProps) {
  return (
    <div
      onMouseDown={props.onMouseDown}
      className={clsx(
        "group absolute top-0 bottom-0 z-10 flex w-2 cursor-col-resize items-stretch",
        props.side === "right" ? "-right-1" : "-left-1",
      )}
    >
      <div className="mx-auto w-px bg-transparent transition-colors duration-75 group-hover:bg-amber-400 group-active:bg-amber-500" />
    </div>
  );
}

/* ── Channel link ── */

interface ChannelLinkProps {
  channel: MockChannel;
  isActive: boolean;
}

function ChannelLink(props: ChannelLinkProps) {
  return (
    <Link
      href={`/channels/${props.channel.slug}`}
      className={clsx(
        "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors duration-100",
        props.isActive
          ? "bg-amber-500 font-medium text-white"
          : "text-slate-600 hover:bg-amber-100/60",
      )}
    >
      <span className="shrink-0 opacity-60">
        {props.channel.visibility === "private" ? "🔒" : "#"}
      </span>
      <span className="truncate">{props.channel.name}</span>
    </Link>
  );
}

/* ── Message card ── */

interface MessageCardProps {
  attachments: MockAttachment[];
  currentUserId: string;
  isActiveThread: boolean;
  isEditing: boolean;
  message: MockMessage;
  onCancelEdit: () => void;
  onDelete: () => void;
  onEditDraftChange: (value: string) => void;
  onReply: () => void;
  onSaveEdit: () => void;
  onStartEdit: () => void;
  onToggleReaction: (emoji: string) => void;
  reactionRecords: MockReaction[];
  replyCount: number;
  sender: User;
  senderMember?: MockWorkspaceMember;
  editingDraft: string;
}

function MessageCard(props: MessageCardProps) {
  const reactions = summarizeReactions(props.reactionRecords, props.currentUserId);
  const isDeleted = Boolean(props.message.deletedAt);

  return (
    <article
      className={clsx(
        "group relative rounded-xl px-4 py-3 transition-colors duration-100",
        props.isActiveThread ? "bg-amber-50" : "hover:bg-slate-50/80",
      )}
    >
      {/* hover toolbar */}
      <div className="absolute -top-3 right-3 flex select-none items-center gap-0.5 rounded-lg border border-slate-200 bg-white px-1 py-0.5 opacity-0 shadow-sm transition-opacity duration-100 group-hover:opacity-100 group-focus-within:opacity-100">
        {quickReactionEmoji.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className="rounded-md px-1.5 py-0.5 text-sm hover:bg-slate-100"
            onClick={() => props.onToggleReaction(emoji)}
          >
            {emoji}
          </button>
        ))}
        <span className="mx-0.5 h-4 w-px bg-slate-200" />
        <ToolbarBtn label="Edit" symbol="✏️" onClick={props.onStartEdit} />
        <ToolbarBtn label="Reply" symbol="↩" onClick={props.onReply} />
        <ToolbarBtn label="Delete" symbol="🗑" onClick={props.onDelete} />
      </div>

      <div className="flex gap-3">
        <Avatar user={props.sender} />
        <div className="min-w-0 flex-1">
          <div className="flex select-none flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-sm font-semibold text-slate-900">
              {props.senderMember?.displayName ?? nameFromEmail(props.sender.email)}
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
              <textarea
                value={props.editingDraft}
                onChange={(e) => props.onEditDraftChange(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm leading-6 text-slate-700 outline-none focus:border-amber-400"
              />
              <div className="mt-2 flex select-none gap-2">
                <button
                  type="button"
                  onClick={props.onSaveEdit}
                  className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={props.onCancelEdit}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
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

          {props.attachments.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {props.attachments.map((att) => (
                <div
                  key={att.id}
                  className="inline-flex select-none items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600"
                >
                  <span>📎</span>
                  <span>{att.name}</span>
                  {att.sizeBytes ? (
                    <span className="text-slate-400">{formatBytes(att.sizeBytes)}</span>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          {reactions.length > 0 || props.replyCount > 0 ? (
            <div className="mt-2 flex select-none flex-wrap items-center gap-1.5">
              {reactions.map((r) => (
                <button
                  key={r.emoji}
                  type="button"
                  className={clsx(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors duration-100",
                    r.reactedByCurrentUser
                      ? "border-amber-300 bg-amber-50 text-amber-800"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                  )}
                  onClick={() => props.onToggleReaction(r.emoji)}
                >
                  <span>{r.emoji}</span>
                  <span>{r.count}</span>
                </button>
              ))}
              {props.replyCount > 0 ? (
                <button
                  type="button"
                  onClick={props.onReply}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-50"
                >
                  <span>↩</span>
                  <span>
                    {props.replyCount} {props.replyCount === 1 ? "reply" : "replies"}
                  </span>
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function ToolbarBtn(props: { label: string; symbol: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className="rounded-md px-1.5 py-0.5 text-sm text-slate-500 hover:bg-slate-100"
      title={props.label}
      onClick={props.onClick}
    >
      {props.symbol}
    </button>
  );
}

/* ── Reusable message input ── */

interface MessageInputProps {
  placeholder: string;
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
}

function MessageInput(props: MessageInputProps) {
  const fallbackRef = useRef<HTMLTextAreaElement>(null);
  const ref = props.textareaRef ?? fallbackRef;
  const hasContent = props.value.trim().length > 0;

  useLayoutEffect(() => {
    const el = ref.current;

    if (!el) {
      return;
    }

    el.style.height = "auto";
    const next = Math.min(el.scrollHeight, MAX_INPUT_HEIGHT);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > MAX_INPUT_HEIGHT ? "auto" : "hidden";
  }, [props.value, ref]);

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      props.onSubmit();
    }
  }

  return (
    <div className="relative">
      <textarea
        ref={ref}
        value={props.value}
        onChange={(e) => props.onValueChange(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
        placeholder={props.placeholder}
        className="w-full resize-none rounded-xl border border-amber-200/70 bg-white px-4 py-3 pr-12 text-sm leading-6 text-slate-700 outline-none transition-colors duration-100 placeholder:text-slate-400 focus:border-amber-400"
      />
      <button
        type="button"
        onClick={props.onSubmit}
        disabled={!hasContent}
        aria-label="Send message"
        className={clsx(
          "absolute bottom-3 right-3 flex size-7 select-none items-center justify-center rounded-lg transition-colors duration-100",
          hasContent ? "bg-amber-500 text-white hover:bg-amber-600" : "bg-slate-100 text-slate-300",
        )}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M3 13V9L11 8L3 7V3L14 8L3 13Z" fill="currentColor" />
        </svg>
      </button>
    </div>
  );
}

/* ── Thread panel ── */

interface ThreadPanelProps {
  attachmentsByMessageId: Map<string, MockAttachment[]>;
  currentUser: User;
  currentUserMember?: MockWorkspaceMember;
  onClose: () => void;
  onReply: () => void;
  replies: MockMessage[];
  rootMessage: MockMessage | null;
  threadDraft: string;
  threadWidth: number;
  startThreadResize: (e: React.MouseEvent) => void;
  usersById: Map<string, User>;
  workspaceMembersByUserId: Map<string, MockWorkspaceMember>;
  onThreadDraftChange: (value: string) => void;
  threadInputRef?: React.RefObject<HTMLTextAreaElement | null>;
}

function ThreadPanel(props: ThreadPanelProps) {
  if (!props.rootMessage) {
    return null;
  }

  return (
    <aside
      style={{ width: props.threadWidth, flexShrink: 0 }}
      className="relative flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-amber-200/60 bg-white/80"
    >
      <ResizeHandle side="left" onMouseDown={props.startThreadResize} />

      <div className="flex select-none items-center justify-between border-b border-amber-100/70 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-900">Thread</h3>
        <button
          type="button"
          onClick={props.onClose}
          className="rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
        >
          Close
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        <div className="flex flex-col gap-3">
          <ThreadMessage
            attachments={props.attachmentsByMessageId.get(props.rootMessage.id) ?? []}
            isRoot
            message={props.rootMessage}
            sender={props.usersById.get(props.rootMessage.senderUserId) ?? props.currentUser}
            senderMember={props.workspaceMembersByUserId.get(props.rootMessage.senderUserId)}
          />

          {props.replies.length > 0 ? (
            <div className="relative ml-5 flex flex-col gap-3 border-l-2 border-amber-200/60 pl-4">
              {props.replies.map((reply) => (
                <ThreadMessage
                  key={reply.id}
                  attachments={props.attachmentsByMessageId.get(reply.id) ?? []}
                  isRoot={false}
                  message={reply}
                  sender={props.usersById.get(reply.senderUserId) ?? props.currentUser}
                  senderMember={props.workspaceMembersByUserId.get(reply.senderUserId)}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="border-t border-amber-100/70 px-3 py-3">
        <MessageInput
          placeholder="Reply in thread…"
          value={props.threadDraft}
          onValueChange={props.onThreadDraftChange}
          onSubmit={props.onReply}
          textareaRef={props.threadInputRef}
        />
      </div>
    </aside>
  );
}

function ThreadMessage(props: {
  attachments: MockAttachment[];
  isRoot: boolean;
  message: MockMessage;
  sender: User;
  senderMember?: MockWorkspaceMember;
}) {
  return (
    <div>
      <div className="flex select-none items-baseline gap-2">
        <span className="text-sm font-semibold text-slate-900">
          {props.senderMember?.displayName ?? nameFromEmail(props.sender.email)}
        </span>
        <time className="text-xs text-slate-400">
          {timeFormatter.format(new Date(props.message.createdAt))}
        </time>
      </div>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
        {props.message.deletedAt ? "This reply was deleted." : props.message.body}
      </p>
      {props.attachments.length > 0 ? (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {props.attachments.map((att) => (
            <span
              key={att.id}
              className="inline-flex select-none items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-500"
            >
              📎 {att.name}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ── Shared components ── */

function Avatar(props: { user: User }) {
  const name = nameFromEmail(props.user.email);

  return (
    <div className="relative mt-0.5 size-8 shrink-0 select-none overflow-hidden rounded-lg bg-gradient-to-br from-amber-300 to-amber-500">
      {props.user.imageURL ? (
        <img
          src={props.user.imageURL}
          alt={name}
          className="h-full w-full object-cover"
          draggable={false}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-white">
          {initials(name)}
        </div>
      )}
    </div>
  );
}

/* ── Helpers ── */

interface ReactionSummary {
  count: number;
  emoji: string;
  reactedByCurrentUser: boolean;
}

function summarizeReactions(records: MockReaction[], currentUserId: string) {
  const map = new Map<string, ReactionSummary>();

  for (const r of records) {
    const existing = map.get(r.emoji);

    if (existing) {
      existing.count += 1;
      existing.reactedByCurrentUser ||= r.userId === currentUserId;
      continue;
    }

    map.set(r.emoji, {
      count: 1,
      emoji: r.emoji,
      reactedByCurrentUser: r.userId === currentUserId,
    });
  }

  return [...map.values()];
}

function nameFromEmail(email?: string) {
  if (!email) {
    return "Teammate";
  }

  const [local] = email.split("@");

  return local
    .split(/[.\-_]/g)
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s.charAt(0).toUpperCase())
    .join("");
}

function formatBytes(bytes: number) {
  if (bytes < 1000) {
    return `${bytes} B`;
  }

  if (bytes < 1_000_000) {
    return `${(bytes / 1000).toFixed(1)} KB`;
  }

  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}
