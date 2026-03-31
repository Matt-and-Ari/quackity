import clsx from "clsx";

import type { StagedFile } from "../../hooks/useFileUpload";
import { formatBytes } from "../../lib/ui";
import type {
  InstantUserWithAvatar,
  MessageAttachmentRecord,
  ReactionRecord,
  WorkspaceMemberRecord,
} from "../../types/quack";
import { HoverTooltip } from "../ui/HoverTooltip";
import { DownloadGlyph, FileIconGlyph } from "./chat-glyphs";
import { nameFromEmail } from "../../lib/ui";

export interface ReactionSummary {
  count: number;
  emoji: string;
  reactedByCurrentUser: boolean;
  tooltip: string;
}

export function summarizeReactions(props: {
  currentUserId: string;
  reactionRecords: ReactionRecord[];
  usersById: Map<string, InstantUserWithAvatar>;
  workspaceMembersByUserId: Map<string, WorkspaceMemberRecord>;
}): ReactionSummary[] {
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

interface ReactionPillsProps {
  onToggleReaction: (emoji: string) => void;
  reactions: ReactionSummary[];
}

export function ReactionPills(props: ReactionPillsProps) {
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

export function StagedFileChip(props: { onRemove?: () => void; staged: StagedFile }) {
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

export function AttachmentDisplay(props: {
  attachment: MessageAttachmentRecord;
  size?: "sm" | "md";
}) {
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

interface ToolbarBtnProps {
  disabled?: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export function ToolbarBtn(props: ToolbarBtnProps) {
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

export const MAX_INPUT_HEIGHT = 160;
