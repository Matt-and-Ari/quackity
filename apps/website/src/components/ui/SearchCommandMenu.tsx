import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import clsx from "clsx";

import { nameFromEmail } from "../../lib/ui";
import type { SearchResult, UseSearchMessagesResult } from "../../hooks/useSearchMessages";

interface SearchCommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResult: (result: SearchResult) => void;
  search: UseSearchMessagesResult;
}

export function SearchCommandMenu(props: SearchCommandMenuProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (props.isOpen) {
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      props.search.setQuery("");
    }
  }, [props.isOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [props.search.results]);

  useEffect(() => {
    if (!props.isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        props.onClose();
        return;
      }

      const count = props.search.results.length;
      if (count === 0) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((prev) => (prev + 1) % count);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((prev) => (prev - 1 + count) % count);
      } else if (event.key === "Enter") {
        event.preventDefault();
        const result = props.search.results[activeIndex];
        if (result) {
          props.onSelectResult(result);
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [props.isOpen, props.search.results, activeIndex, props.onClose, props.onSelectResult]);

  useEffect(() => {
    const el = listRef.current?.querySelector("[data-active='true']");
    if (el) {
      el.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  if (!props.isOpen) return null;

  const hasQuery = props.search.query.trim().length >= 2;
  const hasResults = props.search.results.length > 0;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/20 px-4 pt-[min(15vh,120px)] backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          props.onClose();
        }
      }}
    >
      <div className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-amber-200/80 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.14)]">
        <div className="flex items-center gap-3.5 border-b border-amber-100/70 px-5 py-4">
          <SearchGlyph />
          <input
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400"
            onChange={(event) => props.search.setQuery(event.target.value)}
            placeholder="Search messages..."
            ref={inputRef}
            spellCheck={false}
            type="text"
            value={props.search.query}
          />
          <kbd className="hidden rounded-md border border-amber-200/60 bg-amber-50/60 px-1.5 py-0.5 text-[0.65rem] font-medium text-slate-400 sm:inline-block">
            esc
          </kbd>
        </div>

        <div className="max-h-[min(60vh,520px)] overflow-y-auto overscroll-contain" ref={listRef}>
          {props.search.isLoading && hasQuery ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-300 border-t-amber-500" />
            </div>
          ) : hasQuery && !hasResults ? (
            <div className="px-5 py-12 text-center text-sm text-slate-400">No messages found</div>
          ) : hasResults ? (
            <div className="py-2">
              {props.search.results.map((result, index) => (
                <SearchResultRow
                  isActive={index === activeIndex}
                  key={result.message.id}
                  onMouseEnter={() => setActiveIndex(index)}
                  onSelect={() => props.onSelectResult(result)}
                  query={props.search.query}
                  result={result}
                />
              ))}
            </div>
          ) : (
            <div className="px-5 py-12 text-center text-sm text-slate-400">
              Type to search across all channels
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

interface SearchResultRowProps {
  isActive: boolean;
  onMouseEnter: () => void;
  onSelect: () => void;
  query: string;
  result: SearchResult;
}

function SearchResultRow(props: SearchResultRowProps) {
  const senderName = props.result.message.sender?.email
    ? nameFromEmail(props.result.message.sender.email)
    : "Unknown";
  const channelName = props.result.channel.name;
  const body = props.result.message.body ?? "";
  const timestamp = props.result.message.createdAt;

  return (
    <button
      className={clsx(
        "flex w-full flex-col gap-1 px-5 py-3 text-left transition-colors duration-75",
        props.isActive ? "bg-amber-50/80" : "hover:bg-amber-50/50",
      )}
      data-active={props.isActive}
      onClick={props.onSelect}
      onMouseEnter={props.onMouseEnter}
      type="button"
    >
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-amber-600">#{channelName}</span>
        <span className="text-xs text-slate-400">{senderName}</span>
        {timestamp ? (
          <span className="ml-auto text-[0.65rem] text-slate-300">
            {formatSearchDate(timestamp)}
          </span>
        ) : null}
      </div>
      <p className="line-clamp-2 text-[0.9rem] leading-relaxed text-slate-700">
        <HighlightedText query={props.query} text={body} />
      </p>
    </button>
  );
}

function HighlightedText(props: { query: string; text: string }) {
  const terms = props.query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 0);

  if (terms.length === 0) {
    return <>{props.text}</>;
  }

  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = props.text.split(pattern);

  return (
    <>
      {parts.map((part, i) => {
        const isMatch = terms.some((t) => part.toLowerCase() === t);
        return isMatch ? (
          <mark className="rounded-sm bg-amber-200/60 text-slate-900" key={i}>
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        );
      })}
    </>
  );
}

function SearchGlyph() {
  return (
    <svg className="shrink-0 text-slate-400" fill="none" height="18" viewBox="0 0 16 16" width="18">
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10.5 10.5 14 14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
    </svg>
  );
}

function formatSearchDate(timestamp: string | number | Date): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }

  if (diffDays === 1) {
    return "Yesterday";
  }

  if (diffDays < 7) {
    return date.toLocaleDateString(undefined, { weekday: "short" });
  }

  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}
