import clsx from "clsx";

import {
  PreviewActionBtn,
  PreviewAttachIcon,
  PreviewBlockquoteIcon,
  PreviewBoldIcon,
  PreviewBulletListIcon,
  PreviewCodeBlockIcon,
  PreviewCodeIcon,
  PreviewEmojiIcon,
  PreviewItalicIcon,
  PreviewLinkIcon,
  PreviewMentionIcon,
  PreviewMessageInput,
  PreviewOrderedListIcon,
  PreviewStrikeIcon,
  PreviewToolbarBtn,
} from "./PreviewPrimitives";

/* ─── Chat preview (hero) ─── */

export function ChatPreview() {
  return (
    <div className="relative mx-auto w-full max-w-lg">
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-b from-amber-200/40 to-amber-100/20 blur-2xl" />
      <div className="relative overflow-hidden rounded-[1.45rem] border border-amber-200/60 bg-white/90 shadow-[0_24px_80px_rgba(217,119,6,0.12)] backdrop-blur-xl">
        <div className="flex items-center gap-2 border-b border-amber-100/60 px-4 py-3">
          <svg className="size-3 shrink-0 text-slate-400" fill="none" viewBox="0 0 12 12">
            <path
              d="M4.5 1.5 3.5 10.5M8.5 1.5 7.5 10.5M1.5 4h9M1.5 8h9"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.2"
            />
          </svg>
          <span className="text-xs font-medium text-slate-700">general</span>
        </div>

        <div className="flex flex-col-reverse space-y-reverse space-y-1 p-2 sm:p-3">
          <ChatMessage
            avatarBg="bg-violet-100"
            avatarText="text-violet-600"
            initial="S"
            message="Just shipped the new onboarding flow! Check it out"
            name="Sarah"
            reactions={[
              { emoji: "🎉", count: 3 },
              { emoji: "🚀", count: 2 },
            ]}
            time="10:42 AM"
          />
          <ChatMessage
            avatarBg="bg-sky-100"
            avatarText="text-sky-600"
            initial="M"
            message="Looks amazing, the magic code auth is so smooth"
            name="Marcus"
            time="10:43 AM"
          />
          <ChatMessage
            avatarBg="bg-amber-100"
            avatarText="text-amber-600"
            initial="A"
            name="Ari"
            time="10:44 AM"
          >
            <span className="rounded-md bg-amber-100/70 px-1 py-0.5 font-medium text-amber-800">
              @Sarah
            </span>{" "}
            want to hop on a quick call to discuss the next sprint?
          </ChatMessage>
        </div>

        <div className="border-t border-amber-100/70 px-3 pt-0 pb-2 sm:px-4 sm:pb-3">
          <div className="flex h-5 items-center gap-1.5 px-1">
            <span className="inline-flex items-center gap-[3px]" aria-hidden="true">
              <span className="size-[5px] animate-[typing-dot_1.4s_ease-in-out_infinite] rounded-full bg-slate-400" />
              <span className="size-[5px] animate-[typing-dot_1.4s_ease-in-out_0.2s_infinite] rounded-full bg-slate-400" />
              <span className="size-[5px] animate-[typing-dot_1.4s_ease-in-out_0.4s_infinite] rounded-full bg-slate-400" />
            </span>
            <span className="text-xs text-slate-500">
              <span className="font-medium text-slate-600">Marcus</span> is typing
            </span>
          </div>
          <PreviewMessageInput placeholder="Message #general" />
        </div>
      </div>
    </div>
  );
}

function ChatMessage(props: {
  avatarBg: string;
  avatarText: string;
  children?: React.ReactNode;
  initial: string;
  message?: string;
  name: string;
  reactions?: Array<{ emoji: string; count: number }>;
  replyCount?: number;
  time: string;
}) {
  return (
    <div className="flex gap-3 rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3">
      <div
        className={clsx(
          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
          props.avatarBg,
          props.avatarText,
        )}
      >
        {props.initial}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex select-none items-baseline gap-2">
          <span className="text-sm font-semibold text-slate-900">{props.name}</span>
          <span className="text-xs text-slate-400">{props.time}</span>
        </div>
        <p className="mt-0.5 text-sm leading-relaxed text-slate-600">
          {props.children ?? props.message}
        </p>
        {props.reactions ? (
          <div className="mt-1.5 flex select-none flex-wrap items-center gap-1.5">
            {props.reactions.map((r) => (
              <span
                key={r.emoji}
                className="inline-flex items-center gap-1.5 rounded-full border border-amber-100 bg-white px-2.5 py-1 text-xs text-slate-600"
              >
                <span>{r.emoji}</span>
                <span>{r.count}</span>
              </span>
            ))}
          </div>
        ) : null}
        {props.replyCount ? (
          <div className="mt-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-100 bg-white px-2.5 py-1 text-xs text-slate-500">
              <svg className="size-3.5" fill="none" viewBox="0 0 16 16">
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
              {props.replyCount} {props.replyCount === 1 ? "reply" : "replies"}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ─── Thread preview (showcase) ─── */

export function ThreadPreview() {
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-violet-200/30 to-amber-100/20 blur-2xl" />
      <div className="relative flex flex-col overflow-hidden rounded-[1.45rem] border border-amber-200/60 bg-white/90 shadow-[0_16px_60px_rgba(217,119,6,0.1)] backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-amber-100/60 px-4 py-3">
          <span className="text-sm font-semibold text-slate-900">Thread</span>
          <span className="flex size-6 items-center justify-center rounded-lg text-slate-400">
            <svg className="size-3.5" fill="none" viewBox="0 0 14 14">
              <path
                d="M11 3 3 11M3 3l8 8"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.5"
              />
            </svg>
          </span>
        </div>

        <div className="min-h-0 flex-1 space-y-1 px-2 pt-3 pb-1 sm:px-3">
          <ThreadMessage
            avatarBg="bg-violet-100"
            avatarText="text-violet-600"
            initial="S"
            message="Here's the updated mockup with the new sidebar layout"
            name="Sarah"
            time="10:42 AM"
          />

          <div className="relative flex items-center py-1.5 select-none">
            <div className="flex-1 border-t border-amber-200/50" />
            <span className="mx-3 shrink-0 text-xs font-medium text-slate-400">2 replies</span>
            <div className="flex-1 border-t border-amber-200/50" />
          </div>

          <ThreadMessage
            avatarBg="bg-sky-100"
            avatarText="text-sky-600"
            initial="M"
            message="Love the spacing changes. Can we try amber accents?"
            name="Marcus"
            time="10:45 AM"
          />
          <ThreadMessage
            avatarBg="bg-amber-100"
            avatarText="text-amber-600"
            initial="A"
            message="Done! Updated and pushed. Check the preview link"
            name="Ari"
            time="10:48 AM"
          />
        </div>

        <div className="border-t border-amber-100/70 px-3 pt-2 pb-3">
          <label className="mb-2 flex cursor-pointer select-none items-center gap-2 px-1 text-xs text-slate-500">
            <span className="size-3.5 rounded-sm border border-slate-300" />
            Also send to <span className="font-medium text-slate-700">#general</span>
          </label>
          <PreviewMessageInput compact placeholder="Reply in thread..." />
        </div>
      </div>
    </div>
  );
}

function ThreadMessage(props: {
  avatarBg: string;
  avatarText: string;
  initial: string;
  message: string;
  name: string;
  time: string;
}) {
  return (
    <div className="flex gap-3 rounded-2xl px-3 py-2.5">
      <div
        className={clsx(
          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
          props.avatarBg,
          props.avatarText,
        )}
      >
        {props.initial}
      </div>
      <div className="min-w-0">
        <div className="flex select-none items-baseline gap-2">
          <span className="text-sm font-semibold text-slate-900">{props.name}</span>
          <span className="text-xs text-slate-400">{props.time}</span>
        </div>
        <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{props.message}</p>
      </div>
    </div>
  );
}

/* ─── Rich text preview (showcase) ─── */

export function RichTextPreview() {
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-amber-200/30 to-orange-100/20 blur-2xl" />
      <div className="relative overflow-hidden rounded-xl border border-amber-200/70 bg-white shadow-[0_16px_60px_rgba(217,119,6,0.1)]">
        <div className="flex items-center gap-0.5 border-b border-amber-100/60 px-2 py-1">
          <PreviewToolbarBtn active>
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
          <div className="mx-0.5 h-4 w-px bg-amber-200/50" />
          <PreviewToolbarBtn>
            <PreviewOrderedListIcon />
          </PreviewToolbarBtn>
          <PreviewToolbarBtn active>
            <PreviewBulletListIcon />
          </PreviewToolbarBtn>
          <div className="mx-0.5 h-4 w-px bg-amber-200/50" />
          <PreviewToolbarBtn>
            <PreviewBlockquoteIcon />
          </PreviewToolbarBtn>
          <PreviewToolbarBtn>
            <PreviewCodeIcon />
          </PreviewToolbarBtn>
          <PreviewToolbarBtn>
            <PreviewCodeBlockIcon />
          </PreviewToolbarBtn>
        </div>

        <div className="space-y-1 px-4 py-3 text-sm leading-relaxed text-slate-700">
          <p>
            Hey team, here's the <strong className="font-semibold">sprint update</strong>:
          </p>
          <ul className="my-1 list-disc space-y-0.5 pl-5 text-slate-600">
            <li>
              Shipped{" "}
              <code className="rounded bg-amber-100/60 px-1 py-0.5 text-[0.8125rem] text-amber-900">
                v2.1
              </code>{" "}
              to production
            </li>
            <li>Fixed the auth redirect bug</li>
            <li>
              <span className="rounded-md bg-amber-100/70 px-1 py-0.5 font-medium text-amber-800">
                @Marcus
              </span>{" "}
              can you review the PR?
            </li>
          </ul>
          <blockquote className="my-1 border-l-2 border-amber-300 pl-3 text-slate-500">
            "Ship it when it's ready, not when it's perfect"
          </blockquote>
        </div>

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
          <span className="flex size-7 items-center justify-center rounded-lg bg-amber-500 text-white">
            <svg fill="none" height="14" viewBox="0 0 16 16" width="14">
              <path d="M3 13V9L11 8L3 7V3L14 8L3 13Z" fill="currentColor" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Search preview (showcase) ─── */

export function SearchPreview() {
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-sky-200/30 to-amber-100/20 blur-2xl" />
      <div className="relative overflow-hidden rounded-2xl border border-amber-200/60 bg-white/90 shadow-[0_16px_60px_rgba(217,119,6,0.1)] backdrop-blur-xl">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center gap-2 rounded-xl border border-amber-200/60 bg-amber-50/40 px-3 py-2.5">
            <svg
              className="size-4 text-slate-400"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-sm text-slate-700">onboarding flow</span>
            <kbd className="ml-auto rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
              ⌘K
            </kbd>
          </div>
        </div>
        <div className="border-t border-amber-100/40 px-2 py-2">
          {[
            {
              channel: "# general",
              text: "Just shipped the new onboarding flow!",
              author: "Sarah",
            },
            {
              channel: "# design",
              text: "Onboarding flow mockups are ready for review",
              author: "Marcus",
            },
            {
              channel: "# engineering",
              text: "Fixed the onboarding redirect issue in PR #42",
              author: "Ari",
            },
          ].map((result) => (
            <div
              key={result.text}
              className="flex flex-col gap-0.5 rounded-lg px-3 py-2 transition-colors duration-150 first:bg-amber-50/60"
            >
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-amber-600">{result.channel}</span>
                <span className="text-[11px] text-slate-400">{result.author}</span>
              </div>
              <p className="text-sm text-slate-600">{result.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
