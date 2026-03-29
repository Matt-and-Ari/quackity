import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import clsx from "clsx";

import { anchorFromPoint, resolveFloatingPosition } from "./floating";

export interface ContextMenuItem {
  disabled?: boolean;
  hint?: string;
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

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        props.onClose();
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("resize", props.onClose);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("resize", props.onClose);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [props.menu, props.onClose]);

  useLayoutEffect(() => {
    if (!props.menu || !menuRef.current) {
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
      ref={menuRef}
      role="menu"
      className="fixed z-50 min-w-60 overflow-hidden rounded-2xl border border-white/80 bg-white/95 p-1.5 shadow-[0_24px_80px_rgba(15,23,42,0.16)] backdrop-blur-xl"
      style={{
        left: position.left,
        maxHeight: position.maxHeight,
        top: position.top,
      }}
    >
      {props.menu.title ? (
        <div className="border-b border-slate-100 px-3.5 pb-2.5 pt-2">
          <div className="text-sm font-semibold tracking-tight text-slate-900">
            {props.menu.title}
          </div>
          {props.menu.subtitle ? (
            <div className="mt-0.5 text-xs text-slate-500">{props.menu.subtitle}</div>
          ) : null}
        </div>
      ) : null}

      <div className="py-1">
        {props.menu.entries.map((entry) => {
          if ("type" in entry) {
            return <div key={entry.id} className="my-1 h-px bg-slate-100" />;
          }

          return (
            <button
              key={entry.id}
              type="button"
              role="menuitem"
              disabled={entry.disabled}
              onClick={() => {
                if (entry.disabled) {
                  return;
                }

                entry.onSelect();
                props.onClose();
              }}
              className={clsx(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors duration-100",
                entry.disabled
                  ? "cursor-not-allowed text-slate-300"
                  : entry.tone === "danger"
                    ? "text-rose-600 hover:bg-rose-50"
                    : "text-slate-700 hover:bg-slate-100/80",
              )}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100/80 text-base">
                {entry.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{entry.label}</span>
                {entry.hint ? (
                  <span className="block text-xs text-slate-400">{entry.hint}</span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </div>,
    document.body,
  );
}
