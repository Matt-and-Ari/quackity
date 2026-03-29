import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import clsx from "clsx";
import { Link } from "wouter";

import { EmojiMenu } from "./components/EmojiMenu";
import {
  GlobalContextMenu,
  type ContextMenuEntry,
  type ContextMenuState,
} from "./components/GlobalContextMenu";
import { HoverTooltip } from "./components/HoverTooltip";
import { anchorFromElement, anchorFromPoint, type FloatingAnchor } from "./components/floating";
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
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [emojiMenuState, setEmojiMenuState] = useState<{
    anchor: FloatingAnchor | null;
    messageId: string | null;
  }>({
    anchor: null,
    messageId: null,
  });

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

  useEffect(() => {
    setContextMenu(null);
  }, [
    app.activeChannel.id,
    app.editingMessageId,
    app.renamingChannelId,
    app.selectedThreadMessage?.id,
  ]);

  function closeContextMenu() {
    setContextMenu(null);
  }

  function closeEmojiMenu() {
    setEmojiMenuState({
      anchor: null,
      messageId: null,
    });
  }

  function openEmojiMenu(props: { anchor: FloatingAnchor; messageId: string }) {
    setContextMenu(null);
    setEmojiMenuState({
      anchor: props.anchor,
      messageId: props.messageId,
    });
  }

  function handleEmojiSelect(emoji: string) {
    if (!emojiMenuState.messageId) {
      return;
    }

    app.toggleReaction(emojiMenuState.messageId, emoji);
    closeEmojiMenu();
  }

  function handleChannelContextMenu(event: React.MouseEvent, channel: MockChannel) {
    event.preventDefault();
    closeEmojiMenu();

    const canRemoveChannel = app.visibleChannels.length > 1;
    const entries: ContextMenuEntry[] = [
      {
        id: "rename-channel",
        icon: <EditGlyph />,
        label: "Rename channel",
        hint: "Update the visible name and slug",
        onSelect: () => app.startRenamingChannel(channel.id),
      },
      {
        id: "separator-channel-actions",
        type: "separator",
      },
      {
        id: "delete-channel",
        icon: <DeleteGlyph />,
        label: "Delete channel",
        hint: canRemoveChannel ? "Archive it from the sidebar" : "At least one channel must remain",
        disabled: !canRemoveChannel,
        onSelect: () => app.deleteChannel(channel.id),
        tone: "danger",
      },
      {
        id: "leave-channel",
        icon: <LeaveGlyph />,
        label: "Leave channel",
        hint: canRemoveChannel
          ? "Remove it from your channel list"
          : "At least one channel must remain",
        disabled: !canRemoveChannel,
        onSelect: () => app.leaveChannel(channel.id),
      },
    ];

    setContextMenu({
      entries,
      subtitle: channel.visibility === "private" ? "Private channel" : "Public channel",
      title: `#${channel.name}`,
      x: event.clientX,
      y: event.clientY,
    });
  }

  function handleMessageContextMenu(event: React.MouseEvent, message: MockMessage) {
    event.preventDefault();
    closeEmojiMenu();

    const menuX = event.clientX;
    const menuY = event.clientY;
    const threadTargetMessageId = message.parentMessageId ?? message.id;
    const isDeleted = Boolean(message.deletedAt);
    const entries: ContextMenuEntry[] = [
      {
        id: "reply-thread",
        icon: <ReplyGlyph />,
        label: "Reply in thread",
        hint: message.parentMessageId ? "Jump back to the thread" : "Open the conversation drawer",
        onSelect: () => app.openThread(threadTargetMessageId),
      },
      {
        id: "add-reaction",
        icon: <ReactionGlyph />,
        label: "Add reaction",
        hint: isDeleted ? "Unavailable for deleted messages" : "Browse the full emoji menu",
        disabled: isDeleted,
        onSelect: () => {
          requestAnimationFrame(() => {
            openEmojiMenu({
              anchor: anchorFromPoint(menuX, menuY),
              messageId: message.id,
            });
          });
        },
      },
      {
        id: "separator-message-actions",
        type: "separator",
      },
      {
        id: "edit-message",
        icon: <EditGlyph />,
        label: "Edit message",
        hint: isDeleted ? "Deleted messages cannot be edited" : "Open the inline editor",
        disabled: isDeleted,
        onSelect: () => app.startEditingMessage(message.id),
      },
      {
        id: "delete-message",
        icon: <DeleteGlyph />,
        label: "Delete message",
        hint: isDeleted
          ? "This message is already deleted"
          : "Replace the body with a deleted state",
        disabled: isDeleted,
        onSelect: () => app.deleteMessage(message.id),
        tone: "danger",
      },
    ];

    setContextMenu({
      entries,
      subtitle: "Message actions",
      title: "Conversation menu",
      x: menuX,
      y: menuY,
    });
  }

  return (
    <>
      <div className="h-screen overflow-hidden p-2 sm:p-3">
        <div className="flex h-full gap-2 sm:gap-3">
          {/* ── Sidebar ── */}
          <aside
            style={{ width: sidebar.width, flexShrink: 0 }}
            className="relative flex min-h-0 flex-col overflow-hidden rounded-[1.45rem] border border-amber-200/60 bg-amber-50/75 shadow-[0_18px_50px_rgba(217,119,6,0.08)] select-none"
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
                  isRenaming={channel.id === app.renamingChannelId}
                  onCancelRename={app.cancelRenamingChannel}
                  onContextMenu={handleChannelContextMenu}
                  onRenameValueChange={app.setChannelRenameDraft}
                  onSaveRename={app.saveRenamingChannel}
                  renameValue={app.channelRenameDraft}
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
          <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[1.45rem] border border-amber-200/60 bg-white/82 shadow-[0_18px_50px_rgba(15,23,42,0.07)]">
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
                      onContextMenu={handleMessageContextMenu}
                      onDelete={() => app.deleteMessage(message.id)}
                      onEditDraftChange={app.setEditingDraft}
                      onOpenReactionMenu={(anchor) =>
                        openEmojiMenu({ anchor, messageId: message.id })
                      }
                      onReply={() => app.openThread(message.id)}
                      onSaveEdit={app.saveEditingMessage}
                      onStartEdit={() => app.startEditingMessage(message.id)}
                      onToggleReaction={(emoji) => app.toggleReaction(message.id, emoji)}
                      reactionRecords={app.reactionsByMessageId.get(message.id) ?? []}
                      replyCount={app.threadReplyCountByMessageId.get(message.id) ?? 0}
                      sender={sender}
                      senderMember={senderMember}
                      usersById={app.usersById}
                      workspaceMembersByUserId={app.workspaceMembersByUserId}
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
              currentUserId={app.currentUser.id}
              editingDraft={app.editingDraft}
              editingMessageId={app.editingMessageId}
              onCancelEdit={app.cancelEditingMessage}
              onClose={app.closeThread}
              onDeleteMessage={app.deleteMessage}
              onEditDraftChange={app.setEditingDraft}
              onMessageContextMenu={handleMessageContextMenu}
              onReply={app.sendThreadReply}
              onSaveEdit={app.saveEditingMessage}
              onStartEdit={app.startEditingMessage}
              onToggleReaction={app.toggleReaction}
              reactionsByMessageId={app.reactionsByMessageId}
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
      <GlobalContextMenu menu={contextMenu} onClose={closeContextMenu} />
      <EmojiMenu
        anchor={emojiMenuState.anchor}
        isOpen={emojiMenuState.messageId !== null}
        onClose={closeEmojiMenu}
        onSelect={handleEmojiSelect}
      />
    </>
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
  isRenaming: boolean;
  onCancelRename: () => void;
  onContextMenu: (event: React.MouseEvent, channel: MockChannel) => void;
  onRenameValueChange: (value: string) => void;
  onSaveRename: () => void;
  renameValue: string;
}

function ChannelLink(props: ChannelLinkProps) {
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
            ref={inputRef}
            value={props.renameValue}
            onBlur={props.onSaveRename}
            onChange={(event) => props.onRenameValueChange(event.target.value)}
            onKeyDown={handleRenameKeyDown}
            className="min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-700 outline-none"
          />
        </div>
      </div>
    );
  }

  return (
    <Link
      href={`/channels/${props.channel.slug}`}
      onContextMenu={(event) => props.onContextMenu(event, props.channel)}
      className={clsx(
        "flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-sm transition-colors duration-100",
        props.isActive
          ? "bg-amber-500 font-medium text-white shadow-[0_8px_24px_rgba(245,158,11,0.24)]"
          : "text-slate-600 hover:bg-amber-100/60",
      )}
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

/* ── Message card ── */

interface MessageCardProps {
  attachments: MockAttachment[];
  currentUserId: string;
  isActiveThread: boolean;
  isEditing: boolean;
  message: MockMessage;
  onCancelEdit: () => void;
  onContextMenu: (event: React.MouseEvent, message: MockMessage) => void;
  onDelete: () => void;
  onEditDraftChange: (value: string) => void;
  onOpenReactionMenu: (anchor: FloatingAnchor) => void;
  onReply: () => void;
  onSaveEdit: () => void;
  onStartEdit: () => void;
  onToggleReaction: (emoji: string) => void;
  reactionRecords: MockReaction[];
  replyCount: number;
  sender: User;
  senderMember?: MockWorkspaceMember;
  usersById: Map<string, User>;
  workspaceMembersByUserId: Map<string, MockWorkspaceMember>;
  editingDraft: string;
}

function MessageCard(props: MessageCardProps) {
  const reactions = summarizeReactions({
    currentUserId: props.currentUserId,
    reactionRecords: props.reactionRecords,
    usersById: props.usersById,
    workspaceMembersByUserId: props.workspaceMembersByUserId,
  });
  const isDeleted = Boolean(props.message.deletedAt);

  function handleOpenReactionMenu(event: React.MouseEvent<HTMLButtonElement>) {
    const anchor = anchorFromElement(event.currentTarget);

    if (!anchor) {
      return;
    }

    props.onOpenReactionMenu(anchor);
  }

  return (
    <article
      onContextMenu={(event) => props.onContextMenu(event, props.message)}
      className={clsx(
        "group relative rounded-2xl px-4 py-3 transition-colors duration-100",
        props.isActiveThread ? "bg-amber-50" : "hover:bg-slate-50/80",
      )}
    >
      {/* hover toolbar */}
      <div className="absolute -top-3 right-3 flex select-none items-center gap-0.5 rounded-xl border border-slate-200/90 bg-white/96 px-1 py-1 opacity-0 shadow-[0_12px_28px_rgba(15,23,42,0.12)] transition-opacity duration-100 group-hover:opacity-100 group-focus-within:opacity-100">
        {quickReactionEmoji.map((emoji) => (
          <HoverTooltip key={emoji} content={`React with ${emoji}`}>
            <button
              type="button"
              disabled={isDeleted}
              className={clsx(
                "rounded-lg px-2 py-1 text-sm transition-colors duration-100",
                isDeleted ? "cursor-not-allowed text-slate-300" : "hover:bg-slate-100",
              )}
              onClick={() => props.onToggleReaction(emoji)}
            >
              {emoji}
            </button>
          </HoverTooltip>
        ))}
        <span className="mx-0.5 h-5 w-px bg-slate-200" />
        <ToolbarBtn
          disabled={isDeleted}
          icon={<ReactionGlyph />}
          label="Add reaction"
          onClick={handleOpenReactionMenu}
        />
        <ToolbarBtn icon={<ReplyGlyph />} label="Reply in thread" onClick={() => props.onReply()} />
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
              <MessageEditor
                value={props.editingDraft}
                onCancel={props.onCancelEdit}
                onSave={props.onSaveEdit}
                onValueChange={props.onEditDraftChange}
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
              <ReactionPills reactions={reactions} onToggleReaction={props.onToggleReaction} />
              {props.replyCount > 0 ? (
                <HoverTooltip
                  content={
                    props.replyCount === 1 ? "Open 1 reply" : `Open ${props.replyCount} replies`
                  }
                >
                  <button
                    type="button"
                    onClick={props.onReply}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-500 transition-colors duration-100 hover:bg-slate-50"
                  >
                    <ReplyGlyph className="size-3.5" />
                    <span>
                      {props.replyCount} {props.replyCount === 1 ? "reply" : "replies"}
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
        type="button"
        disabled={props.disabled}
        className={clsx(
          "rounded-lg p-1.5 text-slate-500 transition-colors duration-100",
          props.disabled ? "cursor-not-allowed text-slate-300" : "hover:bg-slate-100",
        )}
        onClick={props.onClick}
      >
        <span className="block size-4">{props.icon}</span>
      </button>
    </HoverTooltip>
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
          "absolute bottom-3.5 right-3 flex size-7 select-none items-center justify-center rounded-lg transition-colors duration-100",
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
  currentUserId: string;
  editingDraft: string;
  editingMessageId: string | null;
  onCancelEdit: () => void;
  onClose: () => void;
  onDeleteMessage: (messageId: string) => void;
  onEditDraftChange: (value: string) => void;
  onMessageContextMenu: (event: React.MouseEvent, message: MockMessage) => void;
  onReply: () => void;
  onSaveEdit: () => void;
  onStartEdit: (messageId: string) => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
  reactionsByMessageId: Map<string, MockReaction[]>;
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

  const rootMessage = props.rootMessage;

  return (
    <aside
      style={{ width: props.threadWidth, flexShrink: 0 }}
      className="relative flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[1.45rem] border border-amber-200/60 bg-white/82 shadow-[0_18px_50px_rgba(15,23,42,0.07)]"
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
            attachments={props.attachmentsByMessageId.get(rootMessage.id) ?? []}
            currentUserId={props.currentUserId}
            editingDraft={props.editingDraft}
            isEditing={props.editingMessageId === rootMessage.id}
            message={rootMessage}
            onCancelEdit={props.onCancelEdit}
            onContextMenu={props.onMessageContextMenu}
            onDelete={() => props.onDeleteMessage(rootMessage.id)}
            onEditDraftChange={props.onEditDraftChange}
            onSaveEdit={props.onSaveEdit}
            onStartEdit={() => props.onStartEdit(rootMessage.id)}
            onToggleReaction={(emoji) => props.onToggleReaction(rootMessage.id, emoji)}
            reactionRecords={props.reactionsByMessageId.get(rootMessage.id) ?? []}
            sender={props.usersById.get(rootMessage.senderUserId) ?? props.currentUser}
            senderMember={props.workspaceMembersByUserId.get(rootMessage.senderUserId)}
            usersById={props.usersById}
            workspaceMembersByUserId={props.workspaceMembersByUserId}
          />

          {props.replies.length > 0 ? (
            <div className="relative ml-5 flex flex-col gap-3 border-l-2 border-amber-200/60 pl-4">
              {props.replies.map((reply) => (
                <ThreadMessage
                  key={reply.id}
                  attachments={props.attachmentsByMessageId.get(reply.id) ?? []}
                  currentUserId={props.currentUserId}
                  editingDraft={props.editingDraft}
                  isEditing={props.editingMessageId === reply.id}
                  message={reply}
                  onCancelEdit={props.onCancelEdit}
                  onContextMenu={props.onMessageContextMenu}
                  onDelete={() => props.onDeleteMessage(reply.id)}
                  onEditDraftChange={props.onEditDraftChange}
                  onSaveEdit={props.onSaveEdit}
                  onStartEdit={() => props.onStartEdit(reply.id)}
                  onToggleReaction={(emoji) => props.onToggleReaction(reply.id, emoji)}
                  reactionRecords={props.reactionsByMessageId.get(reply.id) ?? []}
                  sender={props.usersById.get(reply.senderUserId) ?? props.currentUser}
                  senderMember={props.workspaceMembersByUserId.get(reply.senderUserId)}
                  usersById={props.usersById}
                  workspaceMembersByUserId={props.workspaceMembersByUserId}
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
  currentUserId: string;
  editingDraft: string;
  isEditing: boolean;
  message: MockMessage;
  onCancelEdit: () => void;
  onContextMenu: (event: React.MouseEvent, message: MockMessage) => void;
  onDelete: () => void;
  onEditDraftChange: (value: string) => void;
  onSaveEdit: () => void;
  onStartEdit: () => void;
  onToggleReaction: (emoji: string) => void;
  reactionRecords: MockReaction[];
  sender: User;
  senderMember?: MockWorkspaceMember;
  usersById: Map<string, User>;
  workspaceMembersByUserId: Map<string, MockWorkspaceMember>;
}) {
  const reactions = summarizeReactions({
    currentUserId: props.currentUserId,
    reactionRecords: props.reactionRecords,
    usersById: props.usersById,
    workspaceMembersByUserId: props.workspaceMembersByUserId,
  });
  const isDeleted = Boolean(props.message.deletedAt);

  return (
    <div
      onContextMenu={(event) => props.onContextMenu(event, props.message)}
      className="rounded-xl px-2 py-1.5"
    >
      <div className="flex select-none items-baseline gap-2">
        <span className="text-sm font-semibold text-slate-900">
          {props.senderMember?.displayName ?? nameFromEmail(props.sender.email)}
        </span>
        <time className="text-xs text-slate-400">
          {timeFormatter.format(new Date(props.message.createdAt))}
        </time>
      </div>
      {props.isEditing ? (
        <div className="mt-2">
          <MessageEditor
            value={props.editingDraft}
            onCancel={props.onCancelEdit}
            onSave={props.onSaveEdit}
            onValueChange={props.onEditDraftChange}
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
      {reactions.length > 0 ? (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <ReactionPills reactions={reactions} onToggleReaction={props.onToggleReaction} />
        </div>
      ) : null}
      {!props.isEditing ? (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
          <button
            type="button"
            disabled={isDeleted}
            onClick={props.onStartEdit}
            className={clsx(
              "transition-colors duration-100",
              isDeleted ? "cursor-not-allowed text-slate-300" : "hover:text-slate-600",
            )}
          >
            Edit
          </button>
          <span>·</span>
          <button
            type="button"
            disabled={isDeleted}
            onClick={props.onDelete}
            className={clsx(
              "transition-colors duration-100",
              isDeleted ? "cursor-not-allowed text-slate-300" : "hover:text-rose-500",
            )}
          >
            Delete
          </button>
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
        value={props.value}
        onChange={(event) => props.onValueChange(event.target.value)}
        rows={3}
        className="w-full resize-none rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm leading-6 text-slate-700 outline-none transition-colors duration-100 focus:border-amber-400"
      />
      <div className="mt-2 flex select-none gap-2">
        <button
          type="button"
          onClick={props.onSave}
          className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-white transition-colors duration-100 hover:bg-amber-600"
        >
          Save
        </button>
        <button
          type="button"
          onClick={props.onCancel}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors duration-100 hover:bg-slate-50"
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
        <HoverTooltip key={reaction.emoji} content={reaction.tooltip}>
          <button
            type="button"
            className={clsx(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors duration-100",
              reaction.reactedByCurrentUser
                ? "border-amber-300 bg-amber-50 text-amber-800"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
            )}
            onClick={() => props.onToggleReaction(reaction.emoji)}
          >
            <span>{reaction.emoji}</span>
            <span>{reaction.count}</span>
          </button>
        </HoverTooltip>
      ))}
    </>
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
  tooltip: string;
}

function summarizeReactions(props: {
  currentUserId: string;
  reactionRecords: MockReaction[];
  usersById: Map<string, User>;
  workspaceMembersByUserId: Map<string, MockWorkspaceMember>;
}) {
  const map = new Map<string, ReactionSummary>();
  const participantMap = new Map<string, string[]>();

  for (const reaction of props.reactionRecords) {
    const existing = map.get(reaction.emoji);
    const participantName = messageParticipantName({
      userId: reaction.userId,
      usersById: props.usersById,
      workspaceMembersByUserId: props.workspaceMembersByUserId,
    });
    const participants = participantMap.get(reaction.emoji) ?? [];
    participants.push(participantName);
    participantMap.set(reaction.emoji, participants);

    if (existing) {
      existing.count += 1;
      existing.reactedByCurrentUser ||= reaction.userId === props.currentUserId;
      continue;
    }

    map.set(reaction.emoji, {
      count: 1,
      emoji: reaction.emoji,
      reactedByCurrentUser: reaction.userId === props.currentUserId,
      tooltip: "",
    });
  }

  for (const [emoji, summary] of map) {
    summary.tooltip = reactionTooltipLabel(participantMap.get(emoji) ?? [], emoji);
  }

  return [...map.values()];
}

function messageParticipantName(props: {
  userId: string;
  usersById: Map<string, User>;
  workspaceMembersByUserId: Map<string, MockWorkspaceMember>;
}) {
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

function EditGlyph(props: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={clsx("size-4", props.className)}>
      <path
        d="M10.77 2.63a1.5 1.5 0 1 1 2.12 2.12L6 11.64 3 12.5l.86-3 6.91-6.87Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ReplyGlyph(props: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={clsx("size-4", props.className)}>
      <path
        d="M6 5 3 8l3 3"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.5 8H9a4 4 0 0 1 4 4v.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DeleteGlyph(props: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={clsx("size-4", props.className)}>
      <path
        d="M2.5 4h11M6.5 2.5h3M5 4v8.5m3-8.5v8.5m3-8.5v8.5M4.5 4l.4 9a1 1 0 0 0 1 .96h4.2a1 1 0 0 0 1-.96l.4-9"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ReactionGlyph(props: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={clsx("size-4", props.className)}>
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M6 6.4h.01M10 6.4h.01M5.8 9.6c.58.8 1.29 1.2 2.2 1.2.91 0 1.62-.4 2.2-1.2"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M12.6 2.4v2.1m-1.05-1.05h2.1"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LeaveGlyph(props: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={clsx("size-4", props.className)}>
      <path
        d="M6 3.5H4.75A1.25 1.25 0 0 0 3.5 4.75v6.5A1.25 1.25 0 0 0 4.75 12.5H6"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M8.5 5.5 11 8m0 0-2.5 2.5M11 8H6.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
