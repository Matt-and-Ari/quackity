import { useEffect, useRef, useState } from "react";

import clsx from "clsx";

import { MenuRow } from "./WorkspaceAtoms";

interface SidebarMenuButtonProps {
  onCreateChannel?: () => void;
  onInvite: () => void;
  onSettings: () => void;
}

export function SidebarMenuButton(props: SidebarMenuButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={ref}>
      <button
        className={clsx(
          "flex size-7 items-center justify-center rounded-lg transition-colors duration-100",
          isOpen
            ? "bg-amber-200/60 text-slate-700"
            : "text-slate-400 hover:bg-amber-100/60 hover:text-slate-600",
        )}
        onClick={() => setIsOpen((value) => !value)}
        type="button"
      >
        <svg fill="none" height="16" viewBox="0 0 16 16" width="16">
          <circle cx="8" cy="3" fill="currentColor" r="1.2" />
          <circle cx="8" cy="8" fill="currentColor" r="1.2" />
          <circle cx="8" cy="13" fill="currentColor" r="1.2" />
        </svg>
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-full z-30 mt-1 w-44 overflow-hidden rounded-xl border border-amber-200/80 bg-white/95 py-1 shadow-[0_12px_32px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          {props.onCreateChannel ? (
            <MenuRow
              label="New channel"
              onClick={() => {
                setIsOpen(false);
                props.onCreateChannel?.();
              }}
            />
          ) : null}
          <MenuRow
            label="Invite people"
            onClick={() => {
              setIsOpen(false);
              props.onInvite();
            }}
          />
          <MenuRow
            label="Settings"
            onClick={() => {
              setIsOpen(false);
              props.onSettings();
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
