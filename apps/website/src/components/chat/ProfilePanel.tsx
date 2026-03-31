import { initials, nameFromEmail } from "../../lib/ui";
import type {
  ChannelRecord,
  InstantUserWithAvatar,
  WorkspaceMemberRecord,
} from "../../types/quack";
import { RightPanel } from "./RightPanel";

interface ProfilePanelProps {
  channels?: ChannelRecord[];
  currentUserId?: string;
  isMobile?: boolean;
  onClose: () => void;
  onMessage?: (userId: string) => void;
  startResize: (event: React.MouseEvent) => void;
  user: InstantUserWithAvatar;
  width: number;
  workspaceMember?: WorkspaceMemberRecord;
}

export function ProfilePanel(props: ProfilePanelProps) {
  const avatarUrl = props.user.avatar?.url ?? props.user.imageURL;
  const displayName = props.workspaceMember?.displayName ?? nameFromEmail(props.user.email);
  const role = props.workspaceMember?.role ?? "member";
  const joinedAt = props.workspaceMember?.joinedAt;

  return (
    <RightPanel
      isMobile={props.isMobile}
      onClose={props.onClose}
      startResize={props.startResize}
      title="Profile"
      width={props.width}
    >
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-5 pb-6">
        <div className="flex select-none flex-col items-center">
          <div className="size-24 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 shadow-[0_8px_24px_rgba(217,119,6,0.18)]">
            {avatarUrl ? (
              <img
                alt={displayName}
                className="h-full w-full object-cover"
                draggable={false}
                src={avatarUrl}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-white">
                {initials(displayName)}
              </div>
            )}
          </div>

          <h2 className="mt-3 text-lg font-bold text-slate-900">{displayName}</h2>

          <span className="mt-0.5 rounded-full bg-amber-100/70 px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-amber-700">
            {role}
          </span>

          {props.onMessage && props.user.id !== props.currentUserId ? (
            <button
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors duration-100 hover:bg-amber-600"
              onClick={() => props.onMessage!(props.user.id)}
              type="button"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24">
                <path
                  d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
              Message
            </button>
          ) : null}
        </div>

        <div className="mt-6 flex flex-col gap-4">
          <ProfileField label="Display name" value={displayName} />

          {props.user.email ? (
            <ProfileField label="Email address" value={props.user.email} />
          ) : null}

          {props.workspaceMember?.status ? (
            <ProfileField label="Status" value={props.workspaceMember.status} />
          ) : null}

          {joinedAt ? (
            <ProfileField
              label="Joined"
              value={new Date(joinedAt).toLocaleDateString(undefined, {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            />
          ) : null}

          {props.channels && props.channels.length > 0 ? (
            <div>
              <dt className="mb-1.5 select-none text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400">
                Channels
              </dt>
              <dd className="flex select-none flex-wrap gap-1.5">
                {props.channels.map((ch) => (
                  <span
                    className="rounded-lg bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700"
                    key={ch.id}
                  >
                    # {ch.name}
                  </span>
                ))}
              </dd>
            </div>
          ) : null}
        </div>
      </div>
    </RightPanel>
  );
}

function ProfileField(fieldProps: { label: string; value: string }) {
  return (
    <div>
      <dt className="mb-0.5 select-none text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400">
        {fieldProps.label}
      </dt>
      <dd className="text-sm text-slate-700">{fieldProps.value}</dd>
    </div>
  );
}
