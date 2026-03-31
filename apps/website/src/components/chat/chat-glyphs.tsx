import clsx from "clsx";

export function ChannelHashGlyph() {
  return (
    <svg className="size-3 shrink-0" fill="none" viewBox="0 0 12 12">
      <path
        d="M4.5 1.5 3.5 10.5M8.5 1.5 7.5 10.5M1.5 4h9M1.5 8h9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.2"
      />
    </svg>
  );
}

export function AttachGlyph() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 16 16">
      <path
        d="M13.5 7.5l-5.8 5.8a3.2 3.2 0 0 1-4.5-4.5l5.8-5.8a2 2 0 0 1 2.8 2.8L6 11.6a.8.8 0 0 1-1.1-1.1L10.1 5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.2"
      />
    </svg>
  );
}

export function FileIconGlyph() {
  return (
    <svg className="size-4 shrink-0 text-amber-500" fill="none" viewBox="0 0 16 16">
      <path
        d="M9 1.5H4.5a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V5L9 1.5Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.1"
      />
      <path d="M9 1.5V5h3.5" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.1" />
    </svg>
  );
}

export function DownloadGlyph() {
  return (
    <svg className="size-3.5 shrink-0 text-slate-400" fill="none" viewBox="0 0 14 14">
      <path
        d="M7 1.5v8M4 7l3 3 3-3M2.5 12h9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.2"
      />
    </svg>
  );
}

export function EditGlyph(props: { className?: string }) {
  return (
    <svg className={clsx("size-4", props.className)} fill="none" viewBox="0 0 16 16">
      <path
        d="M10.77 2.63a1.5 1.5 0 1 1 2.12 2.12L6 11.64 3 12.5l.86-3 6.91-6.87Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.2"
      />
    </svg>
  );
}

export function ReplyGlyph(props: { className?: string }) {
  return (
    <svg className={clsx("size-4", props.className)} fill="none" viewBox="0 0 16 16">
      <path
        d="M6 5 3 8l3 3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.2"
      />
      <path
        d="M3.5 8H9a4 4 0 0 1 4 4v.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.2"
      />
    </svg>
  );
}

export function DeleteGlyph(props: { className?: string }) {
  return (
    <svg className={clsx("size-4", props.className)} fill="none" viewBox="0 0 16 16">
      <path
        d="M2.5 4h11M6.5 2.5h3M5 4v8.5m3-8.5v8.5m3-8.5v8.5M4.5 4l.4 9a1 1 0 0 0 1 .96h4.2a1 1 0 0 0 1-.96l.4-9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.2"
      />
    </svg>
  );
}

export function ReactionGlyph(props: { className?: string }) {
  return (
    <svg className={clsx("size-4", props.className)} fill="none" viewBox="0 0 16 16">
      <circle cx="7" cy="8.5" r="5" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M5.2 7.2h.01M8.8 7.2h.01M5 10.2c.5.7 1.1 1.1 2 1.1s1.5-.4 2-1.1"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.2"
      />
      <path d="M13 2v3M11.5 3.5h3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}

export function CopyGlyph(props: { className?: string }) {
  return (
    <svg className={clsx("size-4", props.className)} fill="none" viewBox="0 0 16 16">
      <rect
        height="8"
        rx="1.25"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.2"
        width="8"
        x="5.5"
        y="5.5"
      />
      <path
        d="M10.5 5.5V4.25A1.25 1.25 0 0 0 9.25 3h-5A1.25 1.25 0 0 0 3 4.25v5a1.25 1.25 0 0 0 1.25 1.25H5.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.2"
      />
    </svg>
  );
}

export function LeaveGlyph(props: { className?: string }) {
  return (
    <svg className={clsx("size-4", props.className)} fill="none" viewBox="0 0 16 16">
      <path
        d="M6 3.5H4.75A1.25 1.25 0 0 0 3.5 4.75v6.5A1.25 1.25 0 0 0 4.75 12.5H6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.2"
      />
      <path
        d="M8.5 5.5 11 8m0 0-2.5 2.5M11 8H6.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.2"
      />
    </svg>
  );
}
