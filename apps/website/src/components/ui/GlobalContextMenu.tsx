import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import clsx from "clsx";

import { anchorFromPoint, resolveFloatingPosition } from "./floating";

export interface ContextMenuItem {
  disabled?: boolean;
  hint?: string;
  hotkey?: string;
  icon?: ReactNode;
  id: string;
  label: string;
  onSelect: () => void;
  tone?: "danger" | "default";
}

export interface ContextMenuSeparator {
  id: string;
  type: "separator";
}

export type ContextMenuEntry = ContextMenuItem | ContextMenuSeparator;

export interface ContextMenuState {
  entries: ContextMenuEntry[];
  subtitle?: string;
  title?: string;
  x: number;
  y: number;
}

const SYMBOL_TO_KEY: Record<string, string> = {
  "⌫": "backspace",
  "⌦": "delete",
  "⏎": "enter",
};

interface ParsedHotkey {
  key: string;
  meta: boolean;
}

function parseHotkey(hotkey: string): ParsedHotkey {
  const meta = hotkey.startsWith("⌘");
  const raw = meta ? hotkey.slice(1) : hotkey;
  const key = SYMBOL_TO_KEY[raw] ?? raw.toLowerCase();
  return { key, meta };
}

function hotkeyMatchesEvent(hotkey: string, event: KeyboardEvent): boolean {
  const parsed = parseHotkey(hotkey);
  const eventKey = event.key.toLowerCase();
  const hasMeta = event.metaKey || event.ctrlKey;
  return parsed.key === eventKey && parsed.meta === hasMeta;
}

interface GlobalContextMenuProps {
  menu: ContextMenuState | null;
  onClose: () => void;
}

export function GlobalContextMenu(props: GlobalContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: 0, maxHeight: 280, top: 0 });

  useEffect(() => {
    if (!props.menu) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current?.contains(event.target as Node)) {
        return;
      }

      props.onClose();
    }

    function handleContextMenu(event: MouseEvent) {
      if (menuRef.current?.contains(event.target as Node)) {
        event.preventDefault();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        props.onClose();
        return;
      }

      if (event.altKey) return;

      const match = props.menu?.entries.find(
        (e): e is ContextMenuItem =>
          !("type" in e) && !e.disabled && !!e.hotkey && hotkeyMatchesEvent(e.hotkey, event),
      );
      if (match) {
        event.preventDefault();
        match.onSelect();
        props.onClose();
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", props.onClose);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", props.onClose);
    };
  }, [props.menu, props.onClose]);

  useLayoutEffect(() => {
    if (!menuRef.current || !props.menu) {
      return;
    }

    const rect = menuRef.current.getBoundingClientRect();
    setPosition(
      resolveFloatingPosition({
        anchor: anchorFromPoint(props.menu.x, props.menu.y),
        floatingHeight: rect.height,
        floatingWidth: rect.width,
        offset: 6,
        preferredX: "start",
        preferredY: "bottom",
      }),
    );
  }, [props.menu]);

  if (!props.menu) {
    return null;
  }

  return createPortal(
    <div
      className="fixed z-50 min-w-64 select-none overflow-hidden rounded-xl border border-amber-200/60 bg-white/95 p-1.5 shadow-lg shadow-slate-900/10 backdrop-blur-xl"
      ref={menuRef}
      role="menu"
      style={{
        left: position.left,
        maxHeight: position.maxHeight,
        top: position.top,
      }}
    >
      {props.menu.title ? (
        <div className="border-b border-amber-100/80 px-3.5 pb-2.5 pt-2">
          <div className="text-sm font-semibold tracking-tight text-slate-900">
            {props.menu.title}
          </div>
          {props.menu.subtitle ? (
            <div className="mt-0.5 text-xs text-slate-400">{props.menu.subtitle}</div>
          ) : null}
        </div>
      ) : null}

      <div className="py-1">
        {props.menu.entries.map((entry) => {
          if ("type" in entry) {
            return <div className="my-1 h-px bg-amber-100/60" key={entry.id} />;
          }

          return (
            <button
              className={clsx(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors duration-75",
                entry.disabled
                  ? "cursor-not-allowed text-slate-300"
                  : entry.tone === "danger"
                    ? "text-rose-600 hover:bg-rose-50"
                    : "text-slate-700 hover:bg-amber-50/80",
              )}
              disabled={entry.disabled}
              key={entry.id}
              onClick={() => {
                if (entry.disabled) {
                  return;
                }

                entry.onSelect();
                props.onClose();
              }}
              role="menuitem"
              type="button"
            >
              <span className="flex size-6 shrink-0 items-center justify-center text-base">
                {entry.icon}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium">{entry.label}</span>
              {entry.hotkey ? (
                <kbd className="ml-auto shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-medium leading-none text-slate-400">
                  {entry.hotkey.toUpperCase()}
                </kbd>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>,
    document.body,
  );
}
