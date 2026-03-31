import { useEffect, useRef, type KeyboardEvent } from "react";

import clsx from "clsx";
import { Link } from "wouter";

import type { ChannelRecord } from "../../types/quack";
import { HoverTooltip } from "../ui/HoverTooltip";

interface ChannelLinkProps {
  channel: ChannelRecord;
  hasDraft?: boolean;
  href: string;
  isActive: boolean;
  isRenaming: boolean;
  mentionCount?: number;
  onCancelRename: () => void;
  onClick?: () => void;
  onContextMenu: (event: React.MouseEvent, channel: ChannelRecord) => void;
  onRenameValueChange: (value: string) => void;
  onSaveRename: () => void;
  renameValue: string;
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
        "flex select-none items-center gap-2 rounded-xl px-2.5 py-1.5 text-sm transition-colors duration-100",
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
      {(props.mentionCount ?? 0) > 0 ? (
        <span
          className={clsx(
            "ml-auto inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[0.6rem] font-bold",
            props.isActive ? "bg-white/25 text-white" : "bg-amber-500 text-white",
          )}
        >
          {props.mentionCount}
        </span>
      ) : props.hasDraft ? (
        <HoverTooltip content="Draft">
          <span
            className={clsx(
              "ml-auto shrink-0",
              props.isActive ? "text-white/60" : "text-slate-400",
            )}
            aria-label="Has draft"
          >
            <svg fill="none" height="12" viewBox="0 0 12 12" width="12">
              <path
                d="M8.5 1.5L10.5 3.5L4 10H2V8L8.5 1.5Z"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.25"
              />
            </svg>
          </span>
        </HoverTooltip>
      ) : null}
    </Link>
  );
}
