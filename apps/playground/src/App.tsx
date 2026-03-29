import type { KeyboardEvent } from "react";

import clsx from "clsx";
import { Link } from "wouter";

import {
  quickReactionEmoji,
  type QuackAttachmentRecord,
  type QuackChannelRecord,
  type QuackMessageRecord,
  type QuackReactionRecord,
  type QuackUserRecord,
  type QuackWorkspaceMemberRecord,
} from "./quack-data";
import { useQuackApp } from "./use-quack-app";

interface ChannelLinkProps {
  channel: QuackChannelRecord;
  isActive: boolean;
}

interface MessageCardProps {
  attachments: QuackAttachmentRecord[];
  currentUserId: string;
  isActiveThread: boolean;
  isEditing: boolean;
  message: QuackMessageRecord;
  onCancelEdit: () => void;
  onDelete: () => void;
  onEditDraftChange: (value: string) => void;
  onReply: () => void;
  onSaveEdit: () => void;
  onStartEdit: () => void;
  onToggleReaction: (emoji: string) => void;
  reactionRecords: QuackReactionRecord[];
  replyCount: number;
  sender: QuackUserRecord;
  senderMember?: QuackWorkspaceMemberRecord;
  editingDraft: string;
}

interface MessageComposerProps {
  buttonLabel: string;
  helperText: string;
  onSubmit: () => void;
  placeholder: string;
  title: string;
  value: string;
  onValueChange: (value: string) => void;
}

interface ThreadPanelProps {
  attachmentsByMessageId: Map<string, QuackAttachmentRecord[]>;
  currentUser: QuackUserRecord;
  currentUserMember?: QuackWorkspaceMemberRecord;
  onClose: () => void;
  onReply: () => void;
  replies: QuackMessageRecord[];
  rootMessage: QuackMessageRecord | null;
  threadDraft: string;
  usersById: Map<string, QuackUserRecord>;
  workspaceMembersByUserId: Map<string, QuackWorkspaceMemberRecord>;
  onThreadDraftChange: (value: string) => void;
}

interface ReactionSummary {
  count: number;
  emoji: string;
  reactedByCurrentUser: boolean;
}

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

export default function App() {
  const app = useQuackApp();
  const currentUserMember = app.workspaceMembersByUserId.get(app.currentUser.id);

  return (
    <div className="min-h-screen px-3 py-3 sm:px-5 sm:py-5">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-[1800px] gap-3 xl:grid-cols-[18.5rem_minmax(0,1fr)_23rem]">
        <aside className="quack-shell flex flex-col gap-6 overflow-hidden px-5 py-5 sm:px-6">
          <section className="rounded-[28px] border border-white/45 bg-white/75 p-4 shadow-[0_16px_40px_rgba(120,86,5,0.08)]">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#facc15,#f59e0b)] text-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
                🦆
              </div>
              <div className="min-w-0">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-amber-600/80">
                  Quack Workspace
                </p>
                <h1 className="truncate text-xl font-semibold tracking-[-0.04em] text-slate-900">
                  {app.workspace.name}
                </h1>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Duck-themed team chat playground with channels, hover actions, and threads.
            </p>
          </section>

          <section className="rounded-[28px] border border-white/40 bg-white/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-amber-600/80">
                  Current perch
                </p>
                <p className="mt-1 text-base font-semibold text-slate-900">
                  {currentUserMember?.displayName ?? getNameFromEmail(app.currentUser.email)}
                </p>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                Online
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-600">{currentUserMember?.role ?? "Member"}</p>
          </section>

          <section className="min-h-0 flex-1 rounded-[32px] border border-white/40 bg-[linear-gradient(180deg,rgba(255,251,235,0.94),rgba(255,244,198,0.74))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-amber-600/85">
                  Channels
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {app.visibleChannels.length} active ponds
                </p>
              </div>
              <div className="rounded-full border border-amber-200 bg-white/70 px-3 py-1 text-xs font-medium text-amber-700">
                Wouter
              </div>
            </div>

            <nav className="grid gap-2" aria-label="Channels">
              {app.visibleChannels.map((channel) => {
                return (
                  <ChannelLink
                    key={channel.id}
                    channel={channel}
                    isActive={channel.id === app.activeChannel.id}
                  />
                );
              })}
            </nav>
          </section>

          <section className="rounded-[28px] border border-white/40 bg-white/65 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-amber-600/80">
                  In this channel
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {app.onlineMembers.length} ducks around
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {app.onlineMembers.map((member) => {
                return (
                  <div
                    key={member.id}
                    className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-3 py-2 text-sm text-slate-700"
                  >
                    <span
                      className={clsx("size-2.5 rounded-full", getPresenceClasses(member.status))}
                    />
                    <span>{member.displayName ?? "Teammate"}</span>
                  </div>
                );
              })}
            </div>
          </section>
        </aside>

        <main className="quack-shell flex min-w-0 flex-col overflow-hidden">
          <header className="border-b border-amber-100/80 px-5 py-5 sm:px-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/80 bg-amber-50/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-amber-700">
                  <span>Channel</span>
                  <span className="text-slate-400">/</span>
                  <span>{app.activeChannel.visibility}</span>
                </div>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-4xl">
                  #{app.activeChannel.name}
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600 sm:text-[0.95rem]">
                  {app.activeChannel.topic}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="rounded-full border border-amber-200/80 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-amber-50"
                >
                  Duck search
                </button>
                <div className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)]">
                  {app.selectedThreadMessage ? "Thread open" : "Inbox calm"}
                </div>
              </div>
            </div>
          </header>

          <section className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5 sm:py-5">
            <div className="mx-auto flex max-w-4xl flex-col gap-3">
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

          <footer className="border-t border-amber-100/80 px-4 py-4 sm:px-6">
            <div className="mx-auto max-w-4xl">
              <MessageComposer
                buttonLabel="Send to channel"
                helperText="Use Enter for line breaks. This stays frontend-only and updates local state."
                onSubmit={app.sendChannelMessage}
                placeholder={`Message #${app.activeChannel.name}`}
                title="Channel composer"
                value={app.channelDraft}
                onValueChange={app.setChannelDraft}
              />
            </div>
          </footer>
        </main>

        <ThreadPanel
          attachmentsByMessageId={app.attachmentsByMessageId}
          currentUser={app.currentUser}
          currentUserMember={currentUserMember}
          onClose={app.closeThread}
          onReply={app.sendThreadReply}
          replies={app.selectedThreadReplies}
          rootMessage={app.selectedThreadMessage}
          threadDraft={app.threadDraft}
          usersById={app.usersById}
          workspaceMembersByUserId={app.workspaceMembersByUserId}
          onThreadDraftChange={app.setThreadDraft}
        />
      </div>
    </div>
  );
}

function ChannelLink(props: ChannelLinkProps) {
  return (
    <Link
      href={`/channels/${props.channel.slug}`}
      className={clsx(
        "group flex items-center justify-between gap-3 rounded-[22px] border px-4 py-3 text-left transition-colors duration-150",
        props.isActive
          ? "border-amber-300/90 bg-slate-950 text-white shadow-[0_14px_28px_rgba(15,23,42,0.16)]"
          : "border-transparent bg-white/75 text-slate-700 hover:border-amber-200 hover:bg-white",
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm opacity-70">
            {props.channel.visibility === "private" ? "🔒" : "#"}
          </span>
          <span className="truncate font-medium">{props.channel.name}</span>
        </div>
        <p
          className={clsx(
            "mt-1 truncate text-sm",
            props.isActive ? "text-white/70" : "text-slate-500",
          )}
        >
          {props.channel.topic}
        </p>
      </div>
      <span
        className={clsx(
          "rounded-full px-2.5 py-1 text-xs font-medium",
          props.isActive ? "bg-white/12 text-white" : "bg-amber-50 text-amber-700",
        )}
      >
        {props.channel.visibility}
      </span>
    </Link>
  );
}

function MessageCard(props: MessageCardProps) {
  const reactionSummary = summarizeReactions(props.reactionRecords, props.currentUserId);
  const isDeleted = Boolean(props.message.deletedAt);

  return (
    <article
      className={clsx(
        "group relative rounded-[28px] border p-4 shadow-[0_18px_40px_rgba(148,103,13,0.08)] transition-colors duration-150 sm:p-5",
        props.isActiveThread
          ? "border-amber-300 bg-amber-50/90"
          : "border-white/60 bg-white/78 hover:bg-white/88",
      )}
    >
      <div className="absolute right-4 top-3 flex items-center gap-1 rounded-2xl border border-amber-200/90 bg-white/95 p-1.5 opacity-0 shadow-[0_14px_30px_rgba(148,103,13,0.12)] transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
        {quickReactionEmoji.map((emoji) => {
          return (
            <button
              key={emoji}
              type="button"
              className="rounded-xl px-2 py-1 text-sm transition-colors duration-150 hover:bg-amber-50"
              title={`React with ${emoji}`}
              onClick={() => props.onToggleReaction(emoji)}
            >
              {emoji}
            </button>
          );
        })}
        <ToolbarButton label="Edit" onClick={props.onStartEdit} symbol="✏️" />
        <ToolbarButton label="Reply" onClick={props.onReply} symbol="↪" />
        <ToolbarButton label="Delete" onClick={props.onDelete} symbol="🗑" />
      </div>

      <div className="flex gap-3">
        <Avatar user={props.sender} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-semibold text-slate-900">
              {props.senderMember?.displayName ?? getNameFromEmail(props.sender.email)}
            </span>
            <span className="rounded-full bg-slate-950/6 px-2 py-1 text-xs font-medium text-slate-500">
              {props.senderMember?.role ?? "Teammate"}
            </span>
            <time className="text-sm text-slate-500">
              {timeFormatter.format(props.message.createdAt)}
            </time>
            {props.message.updatedAt ? (
              <span className="text-xs font-medium uppercase tracking-[0.18em] text-amber-700">
                edited
              </span>
            ) : null}
          </div>

          {props.isEditing ? (
            <div className="mt-3 rounded-[22px] border border-amber-200 bg-white/95 p-3">
              <textarea
                value={props.editingDraft}
                onChange={(event) => props.onEditDraftChange(event.target.value)}
                rows={4}
                className="min-h-28 w-full resize-none bg-transparent text-sm leading-7 text-slate-700 outline-none"
              />
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={props.onSaveEdit}
                  className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-slate-800"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={props.onCancelEdit}
                  className="rounded-full border border-amber-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-amber-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p
              className={clsx(
                "mt-3 whitespace-pre-wrap text-[0.96rem] leading-8",
                isDeleted ? "italic text-slate-400" : "text-slate-700",
              )}
            >
              {isDeleted ? "This message was removed from the pond." : props.message.body}
            </p>
          )}

          {props.attachments.length > 0 ? (
            <div className="mt-4 grid gap-2">
              {props.attachments.map((attachment) => {
                return (
                  <div
                    key={attachment.id}
                    className={clsx(
                      "flex items-center justify-between gap-3 rounded-[20px] border px-4 py-3",
                      getAttachmentClasses(attachment),
                    )}
                  >
                    <div>
                      <p className="font-medium text-slate-900">{attachment.name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {attachment.attachmentType}{" "}
                        {attachment.sizeBytes ? `· ${formatBytes(attachment.sizeBytes)}` : ""}
                      </p>
                    </div>
                    <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-slate-700">
                      Open
                    </span>
                  </div>
                );
              })}
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {reactionSummary.map((reaction) => {
              return (
                <button
                  key={reaction.emoji}
                  type="button"
                  className={clsx(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors duration-150",
                    reaction.reactedByCurrentUser
                      ? "border-amber-300 bg-amber-100 text-amber-900"
                      : "border-amber-100 bg-white/90 text-slate-600 hover:bg-amber-50",
                  )}
                  onClick={() => props.onToggleReaction(reaction.emoji)}
                >
                  <span>{reaction.emoji}</span>
                  <span>{reaction.count}</span>
                </button>
              );
            })}

            {props.replyCount > 0 ? (
              <button
                type="button"
                onClick={props.onReply}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-600 transition-colors duration-150 hover:bg-slate-100"
              >
                <span>Thread</span>
                <span>{props.replyCount} replies</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

function ToolbarButton(props: { label: string; onClick: () => void; symbol: string }) {
  return (
    <button
      type="button"
      className="rounded-xl px-2 py-1 text-sm text-slate-600 transition-colors duration-150 hover:bg-amber-50"
      title={props.label}
      onClick={props.onClick}
    >
      {props.symbol}
    </button>
  );
}

function MessageComposer(props: MessageComposerProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      props.onSubmit();
    }
  }

  return (
    <section className="rounded-[30px] border border-white/65 bg-white/88 p-4 shadow-[0_14px_40px_rgba(148,103,13,0.08)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-amber-600/85">
            {props.title}
          </p>
          <p className="mt-1 text-sm text-slate-500">{props.helperText}</p>
        </div>
        <button
          type="button"
          onClick={props.onSubmit}
          className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-slate-800"
        >
          {props.buttonLabel}
        </button>
      </div>

      <textarea
        value={props.value}
        onChange={(event) => props.onValueChange(event.target.value)}
        onKeyDown={handleKeyDown}
        rows={4}
        placeholder={props.placeholder}
        className="mt-4 min-h-32 w-full resize-none rounded-[24px] border border-amber-100 bg-[linear-gradient(180deg,#fffdf4,#fff8dd)] px-4 py-4 text-[0.96rem] leading-7 text-slate-700 outline-none transition-colors duration-150 placeholder:text-slate-400 focus:border-amber-300"
      />
    </section>
  );
}

function ThreadPanel(props: ThreadPanelProps) {
  return (
    <aside className="quack-shell flex min-w-0 flex-col overflow-hidden">
      <div className="border-b border-amber-100/80 px-5 py-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-amber-600/85">
              Thread drawer
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
              {props.rootMessage ? "Reply in thread" : "No thread selected"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {props.rootMessage
                ? "Thread replies stay anchored here while the main channel remains readable."
                : "Hit reply on any message to open a focused conversation on the right."}
            </p>
          </div>

          {props.rootMessage ? (
            <button
              type="button"
              onClick={props.onClose}
              className="rounded-full border border-amber-200 bg-white/80 px-3 py-2 text-sm font-medium text-slate-600 transition-colors duration-150 hover:bg-amber-50"
            >
              Close
            </button>
          ) : null}
        </div>
      </div>

      {props.rootMessage ? (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            <div className="grid gap-3">
              <ThreadMessage
                attachments={props.attachmentsByMessageId.get(props.rootMessage.id) ?? []}
                label="Original message"
                message={props.rootMessage}
                sender={props.usersById.get(props.rootMessage.senderUserId) ?? props.currentUser}
                senderMember={props.workspaceMembersByUserId.get(props.rootMessage.senderUserId)}
              />

              {props.replies.map((reply) => {
                return (
                  <ThreadMessage
                    key={reply.id}
                    attachments={props.attachmentsByMessageId.get(reply.id) ?? []}
                    label="Reply"
                    message={reply}
                    sender={props.usersById.get(reply.senderUserId) ?? props.currentUser}
                    senderMember={props.workspaceMembersByUserId.get(reply.senderUserId)}
                  />
                );
              })}
            </div>
          </div>

          <div className="border-t border-amber-100/80 px-4 py-4">
            <MessageComposer
              buttonLabel="Send reply"
              helperText={`Replying as ${props.currentUserMember?.displayName ?? getNameFromEmail(props.currentUser.email)}.`}
              onSubmit={props.onReply}
              placeholder="Add a thread reply"
              title="Thread composer"
              value={props.threadDraft}
              onValueChange={props.onThreadDraftChange}
            />
          </div>
        </>
      ) : (
        <div className="flex flex-1 items-center justify-center p-5">
          <div className="max-w-xs rounded-[32px] border border-dashed border-amber-200 bg-[linear-gradient(180deg,#fffdf4,#fff7d1)] p-6 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-3xl bg-white/90 text-2xl shadow-[0_12px_26px_rgba(148,103,13,0.08)]">
              🪶
            </div>
            <h4 className="mt-4 text-lg font-semibold tracking-[-0.03em] text-slate-900">
              Thread-ready layout
            </h4>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Hover any message in the main panel and use the reply action to open the drawer.
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}

function ThreadMessage(props: {
  attachments: QuackAttachmentRecord[];
  label: string;
  message: QuackMessageRecord;
  sender: QuackUserRecord;
  senderMember?: QuackWorkspaceMemberRecord;
}) {
  return (
    <article className="rounded-[26px] border border-white/70 bg-white/84 p-4 shadow-[0_16px_34px_rgba(148,103,13,0.06)]">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-amber-700/90">
        {props.label}
      </p>
      <div className="mt-3 flex gap-3">
        <Avatar user={props.sender} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-900">
              {props.senderMember?.displayName ?? getNameFromEmail(props.sender.email)}
            </span>
            <time className="text-sm text-slate-500">
              {timeFormatter.format(props.message.createdAt)}
            </time>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600">
            {props.message.deletedAt ? "This reply was removed." : props.message.body}
          </p>
          {props.attachments.length > 0 ? (
            <div className="mt-3 grid gap-2">
              {props.attachments.map((attachment) => {
                return (
                  <div
                    key={attachment.id}
                    className={clsx(
                      "rounded-[18px] border px-3 py-2 text-sm",
                      getAttachmentClasses(attachment),
                    )}
                  >
                    {attachment.name}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function Avatar(props: { user: QuackUserRecord }) {
  const name = getNameFromEmail(props.user.email);

  return (
    <div className="relative mt-0.5 size-11 shrink-0 overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#fde047,#f59e0b)] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
      {props.user.imageURL ? (
        <img src={props.user.imageURL} alt={name} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-amber-950">
          {getInitials(name)}
        </div>
      )}
    </div>
  );
}

function summarizeReactions(reactions: QuackReactionRecord[], currentUserId: string) {
  const groupedReactions = new Map<string, ReactionSummary>();

  for (const reaction of reactions) {
    const currentSummary = groupedReactions.get(reaction.emoji);

    if (currentSummary) {
      currentSummary.count += 1;
      currentSummary.reactedByCurrentUser ||= reaction.userId === currentUserId;
      continue;
    }

    groupedReactions.set(reaction.emoji, {
      count: 1,
      emoji: reaction.emoji,
      reactedByCurrentUser: reaction.userId === currentUserId,
    });
  }

  return [...groupedReactions.values()];
}

function getNameFromEmail(email?: string) {
  if (!email) {
    return "Teammate";
  }

  const [name] = email.split("@");

  return name
    .split(/[.\-_]/g)
    .filter(Boolean)
    .map((part) => {
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function getPresenceClasses(status?: string) {
  if (status === "online") {
    return "bg-emerald-500";
  }

  if (status === "away") {
    return "bg-amber-400";
  }

  return "bg-sky-500";
}

function getAttachmentClasses(attachment: QuackAttachmentRecord) {
  if (attachment.attachmentType === "file") {
    return "border-sky-100 bg-sky-50/70";
  }

  if (attachment.attachmentType === "link") {
    return "border-emerald-100 bg-emerald-50/70";
  }

  return "border-amber-100 bg-amber-50/70";
}

function formatBytes(sizeBytes: number) {
  if (sizeBytes < 1000) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1000 * 1000) {
    return `${(sizeBytes / 1000).toFixed(1)} KB`;
  }

  return `${(sizeBytes / (1000 * 1000)).toFixed(1)} MB`;
}
