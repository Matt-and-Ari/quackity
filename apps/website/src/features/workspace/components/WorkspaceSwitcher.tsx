import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "wouter";

import clsx from "clsx";

import { getWorkspaceGradient, WorkspaceIcon } from "./WorkspaceAtoms";
import { CheckGlyph, ChevronGlyph, PlusGlyph } from "./WorkspaceGlyphs";
import type { WorkspaceMemberRecord } from "../../../types/quack";

interface WorkspaceSwitcherProps {
  currentWorkspaceId: string;
  memberships: WorkspaceMemberRecord[];
  onCreateWorkspace: () => void;
  workspaceImageUrl?: string | null;
  workspaceName: string;
}

interface WorkspaceSwitcherItemProps {
  gradient: string;
  imageUrl?: string | null;
  isActive: boolean;
  label: string;
  onClick: () => void;
  role?: string;
}

export function WorkspaceSwitcher(props: WorkspaceSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();
  const [dropdownPos, setDropdownPos] = useState<{ left: number; top: number } | null>(null);

  const otherWorkspaces = props.memberships.filter(
    (membership) =>
      membership.workspace?.id && membership.workspace.id !== props.currentWorkspaceId,
  );

  function computePosition() {
    if (!triggerRef.current) {
      return null;
    }

    const rect = triggerRef.current.getBoundingClientRect();
    return { left: rect.left, top: rect.bottom + 6 };
  }

  useLayoutEffect(() => {
    if (!isOpen) {
      return;
    }

    function updatePosition() {
      const nextPosition = computePosition();
      if (nextPosition) {
        setDropdownPos(nextPosition);
      }
    }

    function handleClickOutside(event: MouseEvent) {
      if (
        triggerRef.current?.contains(event.target as Node) ||
        dropdownRef.current?.contains(event.target as Node)
      ) {
        return;
      }

      setIsOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    updatePosition();
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen]);

  return (
    <div className="min-w-0 flex-1" ref={triggerRef}>
      <button
        className="group flex min-w-0 max-w-full cursor-pointer items-center gap-3"
        onClick={() => {
          setIsOpen((value) => {
            if (!value) {
              setDropdownPos(computePosition());
            }
            return !value;
          });
        }}
        type="button"
      >
        <WorkspaceIcon
          gradient={getWorkspaceGradient(props.workspaceName)}
          imageUrl={props.workspaceImageUrl}
          label={props.workspaceName}
          size="lg"
        />
        <h1 className="min-w-0 flex-1 truncate text-left text-[0.95rem] font-semibold tracking-tight text-slate-900">
          {props.workspaceName}
        </h1>
        <span
          className={clsx(
            "shrink-0 text-slate-400 transition-transform duration-150",
            isOpen && "rotate-180",
          )}
        >
          <ChevronGlyph direction="down" />
        </span>
      </button>

      {isOpen && dropdownPos
        ? createPortal(
            <div
              className="fixed z-50 w-64 overflow-hidden rounded-2xl border border-amber-200/80 bg-white/95 p-1.5 shadow-[0_16px_48px_rgba(15,23,42,0.14)] backdrop-blur-xl"
              ref={dropdownRef}
              style={{ left: dropdownPos.left, top: dropdownPos.top }}
            >
              <div className="px-3 pb-1.5 pt-2">
                <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-slate-400">
                  Workspaces
                </p>
              </div>

              <div className="flex flex-col gap-0.5">
                <WorkspaceSwitcherItem
                  gradient={getWorkspaceGradient(props.workspaceName)}
                  imageUrl={props.workspaceImageUrl}
                  isActive
                  label={props.workspaceName}
                  onClick={() => setIsOpen(false)}
                />

                {otherWorkspaces.map((membership) => {
                  const workspace = membership.workspace;
                  if (!workspace) {
                    return null;
                  }

                  return (
                    <WorkspaceSwitcherItem
                      gradient={getWorkspaceGradient(workspace.name)}
                      imageUrl={workspace.imageUrl}
                      isActive={false}
                      key={workspace.id}
                      label={workspace.name}
                      onClick={() => {
                        setIsOpen(false);
                        navigate(`/workspaces/${workspace.slug}`);
                      }}
                      role={membership.role}
                    />
                  );
                })}
              </div>

              <div className="mt-1 border-t border-amber-100/80 pt-1">
                <button
                  className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors duration-100 hover:bg-amber-50/80"
                  onClick={() => {
                    setIsOpen(false);
                    props.onCreateWorkspace();
                  }}
                  type="button"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-dashed border-amber-300/80 bg-amber-50/60 text-amber-500">
                    <PlusGlyph size={14} />
                  </div>
                  <p className="text-sm font-medium text-slate-600">New workspace</p>
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function WorkspaceSwitcherItem(props: WorkspaceSwitcherItemProps) {
  return (
    <button
      className={clsx(
        "flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors duration-100",
        props.isActive ? "bg-amber-100/60" : "hover:bg-amber-50/80",
      )}
      onClick={props.onClick}
      type="button"
    >
      <WorkspaceIcon
        gradient={props.gradient}
        imageUrl={props.imageUrl}
        label={props.label}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-800">{props.label}</p>
        {props.role ? <p className="text-[0.65rem] text-slate-400">{props.role}</p> : null}
      </div>
      {props.isActive ? <CheckGlyph /> : null}
    </button>
  );
}
