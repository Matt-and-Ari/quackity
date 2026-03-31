export function CallGlyph() {
  return (
    <svg fill="none" height="16" viewBox="0 0 16 16" width="16">
      <path
        d="M5.4 2.8A1.2 1.2 0 0 1 6.6 2h2.8a1.2 1.2 0 0 1 1.2 1.2V3a.8.8 0 0 1-.8.8H6.2a.8.8 0 0 1-.8-.8v-.2ZM3.5 6a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v6.5a1.5 1.5 0 0 1-1.5 1.5h-6A1.5 1.5 0 0 1 3.5 12.5V6Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.2"
      />
    </svg>
  );
}

export function HangUpGlyph() {
  return (
    <svg fill="none" height="16" viewBox="0 0 16 16" width="16">
      <path
        d="M2 8c0-.5.8-3 6-3s6 2.5 6 3v1.5a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V8.5m-4 0V9.5a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V8Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.2"
      />
    </svg>
  );
}

export function HamburgerGlyph() {
  return (
    <svg fill="none" height="18" viewBox="0 0 18 18" width="18">
      <path
        d="M3 5h12M3 9h12M3 13h12"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function KebabGlyph() {
  return (
    <svg fill="currentColor" height="16" viewBox="0 0 16 16" width="16">
      <circle cx="8" cy="3" r="1.25" />
      <circle cx="8" cy="8" r="1.25" />
      <circle cx="8" cy="13" r="1.25" />
    </svg>
  );
}

export function BrowseGlyph() {
  return (
    <svg fill="none" height="16" viewBox="0 0 16 16" width="16">
      <path
        d="M6.5 2H3.5C2.67 2 2 2.67 2 3.5v9C2 13.33 2.67 14 3.5 14h9c.83 0 1.5-.67 1.5-1.5V9.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.3"
      />
      <path
        d="M6 10l1.5-4.5L12 4l-1.5 4.5L6 10Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.3"
      />
    </svg>
  );
}

export function SearchGlyph() {
  return (
    <svg fill="none" height="16" viewBox="0 0 16 16" width="16">
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M10.5 10.5 14 14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.3" />
    </svg>
  );
}

export function CloseGlyph() {
  return (
    <svg fill="none" height="16" viewBox="0 0 16 16" width="16">
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}

export function PlusGlyph(props: { size?: number }) {
  const s = props.size ?? 12;
  const half = s / 2;
  return (
    <svg fill="none" height={s} viewBox={`0 0 ${s} ${s}`} width={s}>
      <path
        d={`M${half} 1v${s - 2}M1 ${half}h${s - 2}`}
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function ChevronGlyph(props: { direction: "up" | "down" }) {
  const d = props.direction === "down" ? "M3.5 5.25 7 8.75l3.5-3.5" : "M3.5 8.75 7 5.25l3.5 3.5";
  return (
    <svg fill="none" height="14" viewBox="0 0 14 14" width="14">
      <path
        d={d}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function CheckGlyph() {
  return (
    <svg className="shrink-0 text-amber-500" fill="none" height="16" viewBox="0 0 16 16" width="16">
      <path
        d="M3.5 8.5 6.5 11.5 12.5 4.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function QuackIcon(props: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className={props.className}>
      <style>{`
        @keyframes quack-look {
          0%, 18%  { transform: translate(0, 0); }
          22%, 38% { transform: translate(1.8px, -0.4px); }
          42%, 58% { transform: translate(-2px, 0.3px); }
          62%, 78% { transform: translate(0.6px, 0.6px); }
          82%, 100% { transform: translate(0, 0); }
        }
        .quack-head {
          animation: quack-look 8s ease-in-out infinite;
        }
      `}</style>
      <circle cx="32" cy="32" r="30" fill="#FCD34D" />
      <ellipse cx="32" cy="38" rx="18" ry="16" fill="#FBBF24" />

      {/* Head group — moves as one unit to look around */}
      <g className="quack-head">
        <circle cx="32" cy="24" r="14" fill="#FCD34D" />

        {/* Left eye — only blinks */}
        <ellipse cx="26" cy="21" rx="2.5" ry="2.5" fill="#1E293B">
          <animate
            attributeName="ry"
            values="2.5;0.15;2.5;2.5;0.15;2.5;2.5"
            keyTimes="0;0.03;0.06;0.45;0.48;0.51;1"
            dur="4s"
            repeatCount="indefinite"
          />
        </ellipse>
        <circle cx="27" cy="20" r="0.8" fill="#FFF">
          <animate
            attributeName="r"
            values="0.8;0.05;0.8;0.8;0.05;0.8;0.8"
            keyTimes="0;0.03;0.06;0.45;0.48;0.51;1"
            dur="4s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Right eye — only blinks */}
        <ellipse cx="38" cy="21" rx="2.5" ry="2.5" fill="#1E293B">
          <animate
            attributeName="ry"
            values="2.5;0.15;2.5;2.5;0.15;2.5;2.5"
            keyTimes="0;0.03;0.06;0.45;0.48;0.51;1"
            dur="4s"
            repeatCount="indefinite"
          />
        </ellipse>
        <circle cx="39" cy="20" r="0.8" fill="#FFF">
          <animate
            attributeName="r"
            values="0.8;0.05;0.8;0.8;0.05;0.8;0.8"
            keyTimes="0;0.03;0.06;0.45;0.48;0.51;1"
            dur="4s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Beak */}
        <ellipse cx="32" cy="27" rx="6" ry="3.5" fill="#F97316" />
        <ellipse cx="32" cy="26.5" rx="4" ry="2" fill="#FB923C" />
      </g>

      <ellipse cx="20" cy="40" rx="8" ry="5" fill="#FBBF24" transform="rotate(-15 20 40)" />
      <ellipse cx="44" cy="40" rx="8" ry="5" fill="#FBBF24" transform="rotate(15 44 40)" />
    </svg>
  );
}

export function ChannelEmptyState(props: { channelName: string }) {
  return (
    <div className="flex flex-1 select-none flex-col items-center justify-center py-20">
      <QuackIcon className="size-16 drop-shadow-[0_8px_24px_rgba(217,119,6,0.12)]" />
      <p className="mt-4 text-sm font-semibold text-slate-900">Welcome to #{props.channelName}</p>
      <p className="mt-1 max-w-xs text-center text-xs leading-5 text-slate-400">
        This is the very beginning of the channel. Send a message to start the conversation.
      </p>
    </div>
  );
}

interface DmEmptyStateProps {
  displayName: string;
  imageUrl?: string;
  isSelf: boolean;
  role?: string;
}

function DmAvatar(props: { displayName: string; imageUrl?: string }) {
  if (props.imageUrl) {
    return (
      <img
        alt={props.displayName}
        className="size-16 rounded-2xl object-cover shadow-[0_8px_24px_rgba(217,119,6,0.12)]"
        draggable={false}
        src={props.imageUrl}
      />
    );
  }

  return (
    <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 text-xl font-bold text-white shadow-[0_8px_24px_rgba(217,119,6,0.12)]">
      {props.displayName.trim().charAt(0).toUpperCase() || "?"}
    </div>
  );
}

export function DmEmptyState(props: DmEmptyStateProps) {
  return (
    <div className="select-none border-b border-amber-100/70 px-4 pt-6 pb-5 sm:px-6 sm:pt-8 sm:pb-6">
      <div className="flex max-w-lg flex-col">
        <DmAvatar displayName={props.displayName} imageUrl={props.imageUrl} />
        <p className="mt-4 text-base font-semibold text-slate-900">
          {props.displayName}
          {props.isSelf ? (
            <span className="ml-1.5 text-sm font-normal text-slate-400">(you)</span>
          ) : null}
        </p>
        {props.role ? <p className="mt-0.5 text-xs text-slate-400">{props.role}</p> : null}
        <p className="mt-3 text-sm leading-relaxed text-slate-500">
          {props.isSelf ? (
            <>
              <span className="font-semibold text-slate-700">This is your space.</span> Draft
              messages, list your to-dos, or keep links and files handy. You can also talk to
              yourself here, but please bear in mind you&rsquo;ll have to supply both sides of the
              conversation.
            </>
          ) : (
            <>
              This is the very beginning of your direct message history with{" "}
              <span className="font-semibold text-slate-700">{props.displayName}</span>.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
