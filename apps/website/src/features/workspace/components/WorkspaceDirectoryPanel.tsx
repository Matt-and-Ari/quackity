import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

import clsx from "clsx";

import { UserAvatar } from "./WorkspaceAtoms";
import type { ChannelRecord, WorkspaceMemberRecord } from "../../../types/quack";

type DirectoryTab = "channels" | "members";

interface DirectoryPanelProps {
  allChannels: ChannelRecord[];
  canManageChannels: boolean;
  currentUserId: string;
  members: WorkspaceMemberRecord[];
  onClose: () => void;
  onJoinChannel: (channelId: string) => void;
  onLeaveChannel: (channelId: string) => void;
  visibleChannelIds: Set<string>;
  workspaceSlug: string;
}

interface DirectoryTabButtonProps {
  isActive: boolean;
  label: string;
  onClick: () => void;
}

export function DirectoryPanel(props: DirectoryPanelProps) {
  const [tab, setTab] = useState<DirectoryTab>("channels");
  const [search, setSearch] = useState("");
  const [, navigate] = useLocation();
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, [tab]);

  const query = search.toLowerCase().trim();

  const filteredChannels = props.allChannels.filter((channel) => {
    if (channel.archivedAt) {
      return false;
    }

    if (query && !channel.name.toLowerCase().includes(query)) {
      return false;
    }

    return true;
  });

  const filteredMembers = props.members.filter((member) => {
    if (!member.$user?.id) {
      return false;
    }

    if (!query) {
      return true;
    }

    const name = (member.displayName ?? member.$user.email ?? "").toLowerCase();
    return name.includes(query);
  });

  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-amber-200/60 bg-white/82 shadow-[0_18px_50px_rgba(15,23,42,0.07)] md:rounded-[1.45rem]">
      <header className="select-none border-b border-amber-100/70 px-4 py-3 sm:px-5 sm:py-3.5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
            Browse
          </h2>
          <button
            className="flex size-7 items-center justify-center rounded-lg text-slate-400 transition-colors duration-100 hover:bg-slate-100 hover:text-slate-600"
            onClick={props.onClose}
            type="button"
          >
            <svg fill="none" height="14" viewBox="0 0 14 14" width="14">
              <path
                d="M3 3l8 8M11 3l-8 8"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.5"
              />
            </svg>
          </button>
        </div>

        <div className="mt-3 flex gap-1">
          <DirectoryTabButton
            isActive={tab === "channels"}
            label="Channels"
            onClick={() => {
              setTab("channels");
              setSearch("");
            }}
          />
          <DirectoryTabButton
            isActive={tab === "members"}
            label="Members"
            onClick={() => {
              setTab("members");
              setSearch("");
            }}
          />
        </div>

        <div className="mt-3">
          <input
            ref={searchRef}
            autoFocus
            className="w-full rounded-xl border border-amber-200/70 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors duration-100 placeholder:text-slate-400 focus:border-amber-400"
            onChange={(event) => setSearch(event.target.value)}
            placeholder={tab === "channels" ? "Search channels..." : "Search members..."}
            value={search}
          />
        </div>
      </header>

      <section className="min-h-0 flex-1 overflow-y-auto">
        {tab === "channels" ? (
          <div className="flex flex-col py-1">
            {filteredChannels.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-400">No channels found</p>
            ) : (
              filteredChannels.map((channel) => {
                const isJoined = props.visibleChannelIds.has(channel.id);
                return (
                  <div
                    className="flex select-none items-center gap-3 px-4 py-2.5 transition-colors duration-75 hover:bg-amber-50/50 sm:px-5"
                    key={channel.id}
                  >
                    <span className="shrink-0 text-sm text-slate-400">
                      {channel.visibility === "private" ? "🔒" : "#"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <button
                        className="truncate text-sm font-medium text-slate-800 hover:underline"
                        onClick={() => {
                          if (isJoined) {
                            navigate(`/workspaces/${props.workspaceSlug}/channels/${channel.slug}`);
                          }
                        }}
                        type="button"
                      >
                        {channel.name}
                      </button>
                      {channel.topic ? (
                        <p className="mt-0.5 truncate text-xs text-slate-400">{channel.topic}</p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-xs text-slate-400">
                        {channel.members?.length ?? 0}{" "}
                        {(channel.members?.length ?? 0) === 1 ? "member" : "members"}
                      </span>
                      {isJoined ? (
                        <button
                          className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-500 transition-colors duration-100 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                          onClick={() => props.onLeaveChannel(channel.id)}
                          type="button"
                        >
                          Leave
                        </button>
                      ) : (
                        <button
                          className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 transition-colors duration-100 hover:bg-amber-100"
                          onClick={() => props.onJoinChannel(channel.id)}
                          type="button"
                        >
                          Join
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="flex flex-col py-1">
            {filteredMembers.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-400">No members found</p>
            ) : (
              filteredMembers.map((member) => (
                <div
                  className="flex select-none items-center gap-3 px-4 py-2.5 transition-colors duration-75 hover:bg-amber-50/50 sm:px-5"
                  key={member.id}
                >
                  <UserAvatar
                    imageUrl={member.$user?.avatar?.url ?? member.$user?.imageURL}
                    name={member.displayName ?? member.$user?.email ?? "?"}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {member.displayName ?? member.$user?.email ?? member.id}
                    </p>
                    {member.$user?.email ? (
                      <p className="truncate text-xs text-slate-400">{member.$user.email}</p>
                    ) : null}
                  </div>
                  <span className="shrink-0 rounded-md bg-amber-50 px-2 py-0.5 text-[0.65rem] font-medium text-amber-700">
                    {member.role ?? "member"}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </section>
    </main>
  );
}

function DirectoryTabButton(props: DirectoryTabButtonProps) {
  return (
    <button
      className={clsx(
        "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-100",
        props.isActive
          ? "bg-amber-100/80 text-amber-800"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-700",
      )}
      onClick={props.onClick}
      type="button"
    >
      {props.label}
    </button>
  );
}
