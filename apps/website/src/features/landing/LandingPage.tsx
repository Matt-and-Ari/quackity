import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import clsx from "clsx";

import {
  IconArrowRight,
  IconBolt,
  IconChat,
  IconEdit,
  IconGithub,
  IconPhone,
  IconSearch,
  IconUsers,
} from "./components/LandingIcons";
import {
  ChatPreview,
  RichTextPreview,
  SearchPreview,
  ThreadPreview,
} from "./components/LandingPreviews";
import {
  AnimatedSection,
  FeatureCard,
  QuackLogo,
  ShowcaseSection,
  StatBlock,
} from "./components/LandingSections";

/* ─── Main landing page ─── */

export function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = "Quackity";
  }, []);

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
        <div className="flex items-center justify-between px-5 py-3 sm:px-8">
          <button
            className="flex items-center gap-2.5"
            onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
            type="button"
          >
            <QuackLogo className="size-8" />
            <span className="text-base font-bold tracking-tight text-slate-900">Quackity</span>
          </button>
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
              <QuackLogo className="size-9" />
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
