import { useEffect, useRef, useState } from "react";

import clsx from "clsx";

import { MenuRow, UserAvatar } from "./WorkspaceAtoms";
import { ChevronGlyph } from "./WorkspaceGlyphs";
import { nameFromEmail } from "../../../lib/ui";
import type { AuthenticatedUser, WorkspaceMemberRecord } from "../../../types/quack";

interface SidebarUserCardProps {
  currentUserMember?: WorkspaceMemberRecord;
  onSettings: () => void;
  onSignOut: () => void;
  user: AuthenticatedUser;
}

export function SidebarUserCard(props: SidebarUserCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const displayName =
    props.currentUserMember?.displayName ??
    nameFromEmail(props.user.email) ??
    props.user.email ??
    "Teammate";
  const avatarUrl =
    props.currentUserMember?.$user?.avatar?.url ??
    props.currentUserMember?.$user?.imageURL ??
    props.user.imageURL;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div className="relative border-t border-amber-200/50" ref={ref}>
      <button
        className={clsx(
          "flex w-full items-center gap-3 px-4 py-3 transition-colors duration-100",
          isOpen ? "bg-amber-100/50" : "hover:bg-amber-100/40",
        )}
        onClick={() => setIsOpen((v) => !v)}
        type="button"
      >
        <UserAvatar imageUrl={avatarUrl} name={displayName} size="sm" />
        <div className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-medium text-slate-800">{displayName}</p>
          <p className="truncate text-[0.7rem] leading-tight text-slate-400">
            {props.user.email ?? "No email"}
          </p>
        </div>
        <span
          className={clsx(
            "shrink-0 text-slate-400 transition-transform duration-150",
            isOpen && "rotate-180",
          )}
        >
          <ChevronGlyph direction="up" />
        </span>
      </button>

      {isOpen ? (
        <div className="absolute bottom-full left-2 right-2 z-30 mb-1 overflow-hidden rounded-xl border border-amber-200/80 bg-white/95 py-1 shadow-[0_-8px_24px_rgba(15,23,42,0.10)] backdrop-blur-xl">
          <MenuRow
            label="Profile settings"
            onClick={() => {
              setIsOpen(false);
              props.onSettings();
            }}
          />
          <div className="mx-2.5 my-0.5 h-px bg-amber-100" />
          <MenuRow
            label="Sign out"
            onClick={() => {
              setIsOpen(false);
              props.onSignOut();
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
