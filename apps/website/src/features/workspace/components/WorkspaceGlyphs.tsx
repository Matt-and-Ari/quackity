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

export function ChannelEmptyState(props: { channelName: string }) {
  return (
    <div className="flex flex-1 select-none flex-col items-center justify-center py-20">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200/80 shadow-[0_8px_24px_rgba(217,119,6,0.12)]">
        <svg fill="none" height="28" viewBox="0 0 24 24" width="28">
          <path
            className="text-amber-500"
            d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
          <path
            className="text-amber-400"
            d="M8 10h.01M12 10h.01M16 10h.01"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2"
          />
        </svg>
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-900">Welcome to #{props.channelName}</p>
      <p className="mt-1 max-w-xs text-center text-xs leading-5 text-slate-400">
        This is the very beginning of the channel. Send a message to start the conversation.
      </p>
    </div>
  );
}
