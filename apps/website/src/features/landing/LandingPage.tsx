import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import clsx from "clsx";

/* ─── Logo ─── */

function QuackLogo(props: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className={props.className}>
      <circle cx="32" cy="32" r="30" fill="#FCD34D" />
      <ellipse cx="32" cy="38" rx="18" ry="16" fill="#FBBF24" />
      <circle cx="32" cy="24" r="14" fill="#FCD34D" />
      <circle cx="26" cy="21" r="2.5" fill="#1E293B" />
      <circle cx="38" cy="21" r="2.5" fill="#1E293B" />
      <circle cx="27" cy="20" r="0.8" fill="#FFF" />
      <circle cx="39" cy="20" r="0.8" fill="#FFF" />
      <ellipse cx="32" cy="27" rx="6" ry="3.5" fill="#F97316" />
      <ellipse cx="32" cy="26.5" rx="4" ry="2" fill="#FB923C" />
      <ellipse cx="20" cy="40" rx="8" ry="5" fill="#FBBF24" transform="rotate(-15 20 40)" />
      <ellipse cx="44" cy="40" rx="8" ry="5" fill="#FBBF24" transform="rotate(15 44 40)" />
    </svg>
  );
}

/* ─── Intersection observer hook for scroll-triggered animations ─── */

function useInView(props: { threshold?: number; once?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (props.once !== false) observer.unobserve(el);
        }
      },
      { threshold: props.threshold ?? 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [props.threshold, props.once]);

  return { ref, inView };
}

/* ─── Reusable section wrapper with scroll animation ─── */

function AnimatedSection(props: { children: React.ReactNode; className?: string; delay?: string }) {
  const { ref, inView } = useInView({ threshold: 0.1 });
  return (
    <div
      ref={ref}
      className={clsx(
        "transition-opacity duration-700 ease-out",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
        props.className,
      )}
      style={{
        transitionDelay: props.delay ?? "0ms",
        transitionProperty: "opacity, transform",
      }}
    >
      {props.children}
    </div>
  );
}

/* ─── Feature card ─── */

function FeatureCard(props: { description: string; icon: React.ReactNode; title: string }) {
  return (
    <div className="group relative rounded-2xl border border-amber-200/50 bg-white/60 p-6 backdrop-blur-sm transition-shadow duration-300 hover:shadow-[0_20px_60px_rgba(217,119,6,0.1)]">
      <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-amber-100/80 text-amber-600 transition-colors duration-300 group-hover:bg-amber-200/80">
        {props.icon}
      </div>
      <h3 className="text-base font-semibold text-slate-900">{props.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">{props.description}</p>
    </div>
  );
}

/* ─── Showcase section (alternating left/right) ─── */

function ShowcaseSection(props: {
  badge: string;
  description: string;
  items: string[];
  preview: React.ReactNode;
  reversed?: boolean;
  title: string;
}) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center gap-12 lg:flex-row lg:gap-16",
        props.reversed && "lg:flex-row-reverse",
      )}
    >
      <div className="flex-1 space-y-5">
        <span className="inline-flex items-center gap-2 rounded-full border border-amber-200/60 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-700 backdrop-blur-sm">
          {props.badge}
        </span>
        <h3 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {props.title}
        </h3>
        <p className="max-w-md text-base leading-relaxed text-slate-500">{props.description}</p>
        <ul className="space-y-2.5 pt-1">
          {props.items.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm text-slate-600">
              <svg
                className="mt-0.5 size-4 shrink-0 text-amber-500"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                viewBox="0 0 24 24"
              >
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex-1">{props.preview}</div>
    </div>
  );
}

/* ─── Chat preview (hero) ─── */

function ChatPreview() {
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

function ThreadPreview() {
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

function RichTextPreview() {
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

/* ─── Shared preview primitives ─── */

function PreviewMessageInput(props: { compact?: boolean; placeholder: string }) {
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

function PreviewActionBtn(props: { children: React.ReactNode }) {
  return (
    <span className="flex size-7 items-center justify-center rounded-lg text-slate-400">
      {props.children}
    </span>
  );
}

function PreviewAttachIcon() {
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

function PreviewEmojiIcon() {
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

function PreviewMentionIcon() {
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

function PreviewToolbarBtn(props: { active?: boolean; children: React.ReactNode }) {
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

function PreviewBoldIcon() {
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

function PreviewItalicIcon() {
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

function PreviewStrikeIcon() {
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

function PreviewLinkIcon() {
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

function PreviewOrderedListIcon() {
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

function PreviewBulletListIcon() {
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

function PreviewBlockquoteIcon() {
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

function PreviewCodeIcon() {
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

function PreviewCodeBlockIcon() {
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

/* ─── Search preview (showcase) ─── */

function SearchPreview() {
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

/* ─── Stat block ─── */

function StatBlock(props: { description: string; label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{props.value}</p>
      <p className="mt-1 text-sm font-medium text-slate-500">{props.label}</p>
      <p className="mt-2 text-xs leading-relaxed text-slate-400">{props.description}</p>
    </div>
  );
}

/* ─── Icon helpers ─── */

function IconBolt() {
  return (
    <svg className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconChat() {
  return (
    <svg className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path
        d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPhone() {
  return (
    <svg className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path
        d="M15.05 5A5 5 0 0119 8.95M15.05 1A9 9 0 0123 8.94M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path
        d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path
        d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconGithub() {
  return (
    <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function IconArrowRight() {
  return (
    <svg className="size-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Main landing page ─── */

export function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    function handleScroll() {
      setScrolled((el?.scrollTop ?? 0) > 20);
    }
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div ref={scrollRef} className="h-[100dvh] overflow-y-auto scroll-smooth">
      {/* ── Nav ── */}
      <nav
        className={clsx(
          "sticky top-0 z-50 border-b bg-[#fffdf3]/80 backdrop-blur-xl transition-colors duration-300",
          scrolled ? "border-amber-200/60" : "border-transparent",
        )}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:px-8">
          <div className="flex items-center gap-2.5">
            <QuackLogo className="size-8" />
            <span className="text-base font-bold tracking-tight text-slate-900">Quackity</span>
          </div>
          <div className="hidden items-center gap-6 sm:flex">
            <a
              className="text-sm font-medium text-slate-500 transition-colors duration-200 hover:text-slate-900"
              href="#features"
            >
              Features
            </a>
            <a
              className="text-sm font-medium text-slate-500 transition-colors duration-200 hover:text-slate-900"
              href="#showcase"
            >
              Showcase
            </a>
            <a
              className="text-sm font-medium text-slate-500 transition-colors duration-200 hover:text-slate-900"
              href="#open-source"
            >
              Open Source
            </a>
            <a
              className="text-sm font-medium text-slate-500 transition-colors duration-200 hover:text-slate-900"
              href="https://github.com/Matt-and-Ari/quackity"
              rel="noopener noreferrer"
              target="_blank"
            >
              GitHub
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition-colors duration-200 hover:text-slate-900"
              href="/login"
            >
              Sign in
            </Link>
            <Link
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-slate-800"
              href="/login"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-5 pt-20 pb-16 sm:px-8 sm:pt-28 sm:pb-24">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 left-1/4 size-96 rounded-full bg-amber-200/30 blur-3xl" />
          <div className="absolute top-20 right-1/4 size-72 rounded-full bg-orange-200/20 blur-3xl" />
          <div className="absolute -bottom-40 left-1/2 size-80 -translate-x-1/2 rounded-full bg-yellow-200/20 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-6 inline-flex animate-fade-in items-center gap-2 rounded-full border border-amber-200/60 bg-white/70 px-4 py-1.5 text-sm font-medium text-amber-700 backdrop-blur-sm">
              <span className="size-1.5 animate-pulse-soft rounded-full bg-amber-500" />A demo
              project by Matt and Ari
            </div>

            <h1 className="animate-fade-in-up text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
              Team chat, made{" "}
              <span className="relative inline-block">
                <span className="relative z-10">simple</span>
                <span className="absolute -bottom-1 left-0 -z-0 h-3 w-full rounded-sm bg-amber-300/50 sm:-bottom-1.5 sm:h-4" />
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-lg animate-fade-in-up text-lg leading-relaxed text-slate-500 [animation-delay:200ms]">
              Real-time channels, threads, reactions, and video calls. An open source project by
              Matt and Ari.
            </p>

            <div className="mt-10 flex animate-fade-in-up flex-col items-center justify-center gap-3 sm:flex-row [animation-delay:300ms]">
              <Link
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/25"
                href="/login"
              >
                Start for free
                <IconArrowRight />
              </Link>
              <a
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/60 px-7 py-3.5 text-sm font-semibold text-slate-700 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
                href="#features"
              >
                See how it works
              </a>
            </div>
          </div>

          <div className="mt-16 animate-fade-in-up [animation-delay:400ms] sm:mt-20">
            <ChatPreview />
          </div>
        </div>
      </section>

      {/* ── Feature grid ── */}
      <section className="px-5 py-20 sm:px-8 sm:py-28" id="features">
        <div className="mx-auto max-w-6xl">
          <AnimatedSection className="mx-auto max-w-xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-600">
              Everything you need
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Built for how teams work today
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-500">
              Quackity packs messaging, threads, reactions, search, file sharing, and calls into one
              fast, beautiful workspace.
            </p>
          </AnimatedSection>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: <IconBolt />,
                title: "Real-time messaging",
                description:
                  "Messages sync instantly across every device. No refresh, no waiting. Just conversation at the speed of thought.",
              },
              {
                icon: <IconChat />,
                title: "Threads & reactions",
                description:
                  "Reply in threads to keep channels clean. React with emoji for quick feedback without extra noise.",
              },
              {
                icon: <IconPhone />,
                title: "Built-in calls",
                description:
                  "Jump on a call right from any channel. Crystal-clear audio and video powered by Cloudflare's global network.",
              },
              {
                icon: <IconEdit />,
                title: "Rich text & attachments",
                description:
                  "Bold, code blocks, @mentions, and drag-and-drop file sharing up to 25 MB. All in a beautiful editor.",
              },
              {
                icon: <IconSearch />,
                title: "Instant search",
                description:
                  "Find any message across all your channels with Cmd+K. Results in milliseconds, grouped by channel.",
              },
              {
                icon: <IconUsers />,
                title: "Workspaces & permissions",
                description:
                  "Public and private channels, email invites, role management, and passwordless magic-code auth.",
              },
            ].map((feature, i) => (
              <AnimatedSection key={feature.title} delay={`${i * 60}ms`}>
                <FeatureCard
                  description={feature.description}
                  icon={feature.icon}
                  title={feature.title}
                />
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── Showcase sections ── */}
      <section className="px-5 py-20 sm:px-8 sm:py-28" id="showcase">
        <div className="mx-auto max-w-6xl space-y-28 sm:space-y-36">
          <AnimatedSection>
            <ShowcaseSection
              badge="Threads"
              description="Keep your channels clean while diving deep into any topic. Threads give every conversation its own space without losing context."
              items={[
                "Reply to any message to start a thread",
                "Option to also post replies back to the channel",
                "Dedicated thread panel with full conversation history",
                "Thread notifications so you never miss a reply",
              ]}
              preview={<ThreadPreview />}
              title="Conversations that stay organized"
            />
          </AnimatedSection>

          <AnimatedSection>
            <ShowcaseSection
              badge="Rich Text"
              description="Express yourself with more than plain text. A full rich text editor with formatting, code blocks, mentions, and file attachments."
              items={[
                "Bold, italic, underline, strikethrough, and more",
                "Inline code and fenced code blocks",
                "@Mentions with autocomplete",
                "Drag-and-drop file attachments with previews",
              ]}
              preview={<RichTextPreview />}
              reversed
              title="Write messages that shine"
            />
          </AnimatedSection>

          <AnimatedSection>
            <ShowcaseSection
              badge="Search"
              description="Find anything instantly. Cmd+K opens a powerful search that scans every message across all your channels."
              items={[
                "Full-text search across all channels",
                "Results grouped by channel with context",
                "Keyboard-first navigation",
                "Jump directly to any message",
              ]}
              preview={<SearchPreview />}
              title="Find anything in seconds"
            />
          </AnimatedSection>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="border-y border-amber-200/40 bg-white/40 px-5 py-16 backdrop-blur-sm sm:px-8 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <AnimatedSection>
            <div className="grid gap-8 sm:grid-cols-4">
              <StatBlock
                description="Powered by InstantDB's real-time sync"
                label="Message latency"
                value="<50ms"
              />
              <StatBlock
                description="Built on Cloudflare's global edge"
                label="Uptime"
                value="99.9%"
              />
              <StatBlock
                description="Every line of code, open to all"
                label="Open source"
                value="100%"
              />
              <StatBlock
                description="No credit card, no trial limits"
                label="Free to use"
                value="$0"
              />
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── Open source ── */}
      <section className="px-5 py-20 sm:px-8 sm:py-28" id="open-source">
        <div className="mx-auto max-w-6xl">
          <AnimatedSection>
            <div className="relative overflow-hidden rounded-3xl border border-amber-200/50 bg-gradient-to-br from-slate-900 to-slate-800 px-8 py-16 text-center shadow-[0_24px_80px_rgba(0,0,0,0.2)] sm:px-16 sm:py-20">
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-20 -right-20 size-64 rounded-full bg-amber-500/10 blur-3xl" />
                <div className="absolute -bottom-20 -left-20 size-64 rounded-full bg-amber-400/10 blur-3xl" />
              </div>

              <div className="relative">
                <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-sm">
                  <IconGithub />
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  A demo project, fully open source
                </h2>
                <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-slate-400">
                  Quackity is a demo project by Matt and Ari, built to explore real-time web tech
                  with InstantDB and Cloudflare. The entire codebase is open source. Read it, fork
                  it, or use it as a reference for your own projects.
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <a
                    className="inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-sm font-semibold text-slate-900 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
                    href="https://github.com/Matt-and-Ari/quackity"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <IconGithub />
                    View on GitHub
                  </a>
                  <Link
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-white/40 hover:shadow-lg"
                    href="/login"
                  >
                    Try it live
                    <IconArrowRight />
                  </Link>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <AnimatedSection>
            <div className="relative overflow-hidden rounded-3xl border border-amber-200/50 bg-gradient-to-br from-amber-50 to-orange-50/50 px-8 py-16 text-center shadow-[0_24px_80px_rgba(217,119,6,0.08)] sm:px-16 sm:py-20">
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-20 -right-20 size-64 rounded-full bg-amber-200/30 blur-3xl" />
                <div className="absolute -bottom-20 -left-20 size-64 rounded-full bg-orange-200/20 blur-3xl" />
              </div>

              <div className="relative">
                <QuackLogo className="mx-auto mb-6 size-14 animate-float" />
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  Want to take it for a spin?
                </h2>
                <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-slate-500">
                  Create a workspace in seconds and explore everything Quackity can do. No credit
                  card, no setup wizard.
                </p>
                <Link
                  className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/25"
                  href="/login"
                >
                  Get started for free
                  <IconArrowRight />
                </Link>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-amber-200/40 px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-8 sm:flex-row">
            <div className="flex items-center gap-2.5">
              <QuackLogo className="size-7" />
              <span className="text-sm font-bold text-slate-900">Quackity</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
              <a className="transition-colors duration-200 hover:text-slate-900" href="#features">
                Features
              </a>
              <a className="transition-colors duration-200 hover:text-slate-900" href="#showcase">
                Showcase
              </a>
              <a
                className="transition-colors duration-200 hover:text-slate-900"
                href="#open-source"
              >
                Open Source
              </a>
              <a
                className="transition-colors duration-200 hover:text-slate-900"
                href="https://github.com/Matt-and-Ari/quackity"
                rel="noopener noreferrer"
                target="_blank"
              >
                GitHub
              </a>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-400">
              <p>
                A demo by{" "}
                <a
                  className="text-slate-500 transition-colors duration-200 hover:text-slate-700"
                  href="https://www.youtube.com/@matt-ari"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Matt and Ari
                </a>
              </p>
              <a
                className="inline-flex items-center gap-1 text-slate-500 transition-colors duration-200 hover:text-slate-700"
                href="https://github.com/Matt-and-Ari/quackity"
                rel="noopener noreferrer"
                target="_blank"
              >
                <IconGithub />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
