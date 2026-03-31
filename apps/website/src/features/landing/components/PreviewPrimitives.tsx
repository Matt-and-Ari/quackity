import clsx from "clsx";

export function PreviewMessageInput(props: { compact?: boolean; placeholder: string }) {
  return (
    <div className="rounded-xl border border-amber-200/70 bg-white">
      <div className="flex items-center gap-0.5 border-b border-amber-100/60 px-2 py-1">
        <PreviewToolbarBtn>
          <PreviewBoldIcon />
        </PreviewToolbarBtn>
        <PreviewToolbarBtn>
          <PreviewItalicIcon />
        </PreviewToolbarBtn>
        <PreviewToolbarBtn>
          <PreviewStrikeIcon />
        </PreviewToolbarBtn>
        <div className="mx-0.5 h-4 w-px bg-amber-200/50" />
        <PreviewToolbarBtn>
          <PreviewLinkIcon />
        </PreviewToolbarBtn>
        {!props.compact ? (
          <>
            <div className="mx-0.5 h-4 w-px bg-amber-200/50" />
            <PreviewToolbarBtn>
              <PreviewBulletListIcon />
            </PreviewToolbarBtn>
            <PreviewToolbarBtn>
              <PreviewOrderedListIcon />
            </PreviewToolbarBtn>
          </>
        ) : null}
        <div className="mx-0.5 h-4 w-px bg-amber-200/50" />
        {!props.compact ? (
          <PreviewToolbarBtn>
            <PreviewBlockquoteIcon />
          </PreviewToolbarBtn>
        ) : null}
        <PreviewToolbarBtn>
          <PreviewCodeIcon />
        </PreviewToolbarBtn>
        {!props.compact ? (
          <PreviewToolbarBtn>
            <PreviewCodeBlockIcon />
          </PreviewToolbarBtn>
        ) : null}
      </div>
      <div className="px-4 py-3 text-sm text-slate-400">{props.placeholder}</div>
      <div className="flex items-center justify-between border-t border-amber-100/60 px-1.5 py-1">
        <div className="flex items-center gap-0.5">
          <PreviewActionBtn>
            <PreviewAttachIcon />
          </PreviewActionBtn>
          <PreviewActionBtn>
            <PreviewEmojiIcon />
          </PreviewActionBtn>
          <PreviewActionBtn>
            <PreviewMentionIcon />
          </PreviewActionBtn>
        </div>
        <span className="flex size-7 items-center justify-center rounded-lg bg-amber-50 text-slate-300">
          <svg fill="none" height="14" viewBox="0 0 16 16" width="14">
            <path d="M3 13V9L11 8L3 7V3L14 8L3 13Z" fill="currentColor" />
          </svg>
        </span>
      </div>
    </div>
  );
}

export function PreviewActionBtn(props: { children: React.ReactNode }) {
  return (
    <span className="flex size-7 items-center justify-center rounded-lg text-slate-400">
      {props.children}
    </span>
  );
}

export function PreviewToolbarBtn(props: { active?: boolean; children: React.ReactNode }) {
  return (
    <span
      className={clsx(
        "flex size-7 items-center justify-center rounded-md",
        props.active ? "bg-amber-100/80 text-amber-700" : "text-slate-400",
      )}
    >
      {props.children}
    </span>
  );
}

/* ─── Toolbar icon components ─── */

export function PreviewAttachIcon() {
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

export function PreviewEmojiIcon() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="6" cy="6.8" r="0.8" fill="currentColor" />
      <circle cx="10" cy="6.8" r="0.8" fill="currentColor" />
      <path
        d="M5.5 9.5c.5 1.2 1.3 1.8 2.5 1.8s2-.6 2.5-1.8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.1"
      />
    </svg>
  );
}

export function PreviewMentionIcon() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M10.5 8a2.5 2.5 0 1 0-1 2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.2"
      />
      <path
        d="M10.5 5.5V9c0 .83.67 1.5 1.5 1.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.2"
      />
    </svg>
  );
}

export function PreviewBoldIcon() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 16 16">
      <path
        d="M4.5 3h4a2.5 2.5 0 0 1 0 5H4.5V3ZM4.5 8h4.5a2.5 2.5 0 0 1 0 5H4.5V8Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function PreviewItalicIcon() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 16 16">
      <path
        d="M10 3H6.5M9.5 13H6M8.5 3 7.5 13"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.3"
      />
    </svg>
  );
}

export function PreviewStrikeIcon() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 16 16">
      <path
        d="M3 8h10M10.5 5.5C10.5 4.12 9.38 3 8 3S5.5 4.12 5.5 5.5M5.5 10.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.3"
      />
    </svg>
  );
}

export function PreviewLinkIcon() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 16 16">
      <path
        d="M6.5 9.5a3 3 0 0 0 4.24 0l1.5-1.5a3 3 0 0 0-4.24-4.24l-.86.86"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.3"
      />
      <path
        d="M9.5 6.5a3 3 0 0 0-4.24 0l-1.5 1.5a3 3 0 0 0 4.24 4.24l.86-.86"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.3"
      />
    </svg>
  );
}

export function PreviewOrderedListIcon() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 16 16">
      <path
        d="M7 3.5h6M7 8h6M7 12.5h6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.3"
      />
      <text
        className="select-none"
        fill="currentColor"
        fontSize="6"
        fontWeight="600"
        x="2.5"
        y="5.5"
      >
        1
      </text>
      <text
        className="select-none"
        fill="currentColor"
        fontSize="6"
        fontWeight="600"
        x="2.5"
        y="10"
      >
        2
      </text>
      <text
        className="select-none"
        fill="currentColor"
        fontSize="6"
        fontWeight="600"
        x="2.5"
        y="14.5"
      >
        3
      </text>
    </svg>
  );
}

export function PreviewBulletListIcon() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 16 16">
      <path
        d="M7 3.5h6M7 8h6M7 12.5h6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.3"
      />
      <circle cx="4" cy="3.5" fill="currentColor" r="1.2" />
      <circle cx="4" cy="8" fill="currentColor" r="1.2" />
      <circle cx="4" cy="12.5" fill="currentColor" r="1.2" />
    </svg>
  );
}

export function PreviewBlockquoteIcon() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 16 16">
      <path d="M3 3v10" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      <path
        d="M6.5 5h6M6.5 8h5M6.5 11h4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.3"
      />
    </svg>
  );
}

export function PreviewCodeIcon() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 16 16">
      <path
        d="M5.5 4.5 2.5 8l3 3.5M10.5 4.5l3 3.5-3 3.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.3"
      />
    </svg>
  );
}

export function PreviewCodeBlockIcon() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 16 16">
      <rect height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" width="12" x="2" y="3" />
      <path
        d="M5.5 6.5 4 8l1.5 1.5M10.5 6.5 12 8l-1.5 1.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.2"
      />
    </svg>
  );
}
