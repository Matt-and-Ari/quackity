import { Link } from "wouter";

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

function FeatureCard(props: {
  delay: string;
  description: string;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div
      className="group relative rounded-2xl border border-amber-200/50 bg-white/60 p-6 backdrop-blur-sm transition-shadow duration-300 hover:shadow-[0_20px_60px_rgba(217,119,6,0.1)]"
      style={{ animationDelay: props.delay }}
    >
      <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-amber-100/80 text-amber-600 transition-colors duration-300 group-hover:bg-amber-200/80">
        {props.icon}
      </div>
      <h3 className="text-base font-semibold text-slate-900">{props.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">{props.description}</p>
    </div>
  );
}

function ChatPreview() {
  return (
    <div className="relative mx-auto w-full max-w-lg animate-fade-in-up [animation-delay:400ms]">
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-b from-amber-200/40 to-amber-100/20 blur-2xl" />
      <div className="relative overflow-hidden rounded-2xl border border-amber-200/60 bg-white/90 shadow-[0_24px_80px_rgba(217,119,6,0.12)] backdrop-blur-xl">
        {/* Title bar */}
        <div className="flex items-center gap-2 border-b border-amber-100/60 px-4 py-3">
          <div className="flex gap-1.5">
            <div className="size-2.5 rounded-full bg-rose-400/70" />
            <div className="size-2.5 rounded-full bg-amber-400/70" />
            <div className="size-2.5 rounded-full bg-emerald-400/70" />
          </div>
          <span className="ml-2 text-xs font-medium text-slate-400">#general</span>
        </div>

        <div className="space-y-4 p-4">
          <ChatBubble
            avatar="S"
            avatarColor="bg-violet-100 text-violet-600"
            message="Just shipped the new onboarding flow! Check it out 🎉"
            name="Sarah"
            time="10:42 AM"
          />
          <ChatBubble
            avatar="M"
            avatarColor="bg-sky-100 text-sky-600"
            message="Looks amazing, the magic code auth is so smooth"
            name="Marcus"
            time="10:43 AM"
          />
          <ChatBubble
            avatar="A"
            avatarColor="bg-amber-100 text-amber-600"
            message="Let's hop on a quick call to discuss the next sprint?"
            name="Ari"
            time="10:44 AM"
          />

          <div className="flex items-center gap-2 rounded-xl border border-amber-200/50 bg-amber-50/50 px-3 py-2.5">
            <div className="size-1.5 animate-pulse-soft rounded-full bg-emerald-500" />
            <span className="text-xs text-slate-500">3 people are typing...</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatBubble(props: {
  avatar: string;
  avatarColor: string;
  message: string;
  name: string;
  time: string;
}) {
  return (
    <div className="flex gap-3">
      <div
        className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${props.avatarColor}`}
      >
        {props.avatar}
      </div>
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-slate-900">{props.name}</span>
          <span className="text-[11px] text-slate-400">{props.time}</span>
        </div>
        <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{props.message}</p>
      </div>
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="h-[100dvh] overflow-y-auto">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-amber-200/40 bg-[#fffdf3]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3 sm:px-8">
          <div className="flex items-center gap-2.5">
            <QuackLogo className="size-8" />
            <span className="text-base font-bold tracking-tight text-slate-900">Quack</span>
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

      {/* Hero */}
      <section className="relative overflow-hidden px-5 pt-20 pb-16 sm:px-8 sm:pt-28 sm:pb-24">
        {/* Background orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 left-1/4 size-96 rounded-full bg-amber-200/30 blur-3xl" />
          <div className="absolute top-20 right-1/4 size-72 rounded-full bg-orange-200/20 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-6 inline-flex animate-fade-in items-center gap-2 rounded-full border border-amber-200/60 bg-white/70 px-4 py-1.5 text-sm font-medium text-amber-700 backdrop-blur-sm">
              <span className="size-1.5 animate-pulse-soft rounded-full bg-amber-500" />
              Real-time team chat, built different
            </div>

            <h1 className="animate-fade-in-up text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
              Where teams
              <span className="relative mx-2 inline-block">
                <span className="relative z-10">actually</span>
                <span className="absolute -bottom-1 left-0 -z-0 h-3 w-full rounded-sm bg-amber-300/50 sm:-bottom-1.5 sm:h-4" />
              </span>
              talk
            </h1>

            <p className="mx-auto mt-6 max-w-lg animate-fade-in-up text-lg leading-relaxed text-slate-500 [animation-delay:200ms]">
              Channels, threads, and calls. All real-time, all in one place. No bloat, no noise.
              Just your team, in flow.
            </p>

            <div className="mt-10 flex animate-fade-in-up flex-col items-center justify-center gap-3 sm:flex-row [animation-delay:300ms]">
              <Link
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/25"
                href="/login"
              >
                Start for free
                <svg
                  className="size-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <a
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/60 px-7 py-3.5 text-sm font-semibold text-slate-700 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
                href="#features"
              >
                See how it works
              </a>
            </div>
          </div>

          <div className="mt-16 sm:mt-20">
            <ChatPreview />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-5 py-20 sm:px-8 sm:py-28" id="features">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-600">
              Everything you need
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Built for how teams work today
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-500">
              No more juggling five apps. Quack brings messaging, threads, and calls into one fast,
              beautiful workspace.
            </p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              delay="0ms"
              description="Messages sync instantly across every device. No refresh, no waiting. Just conversation at the speed of thought."
              icon={
                <svg
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              }
              title="Real-time messaging"
            />
            <FeatureCard
              delay="80ms"
              description="Keep discussions organized without losing context. Reply in threads to keep channels clean and focused."
              icon={
                <svg
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              }
              title="Threaded conversations"
            />
            <FeatureCard
              delay="160ms"
              description="Jump on a call right from any channel. Crystal-clear audio and video powered by Cloudflare's global network."
              icon={
                <svg
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M15.05 5A5 5 0 0119 8.95M15.05 1A9 9 0 0123 8.94M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              }
              title="Built-in calls"
            />
            <FeatureCard
              delay="240ms"
              description="Sign in with a magic code. No passwords to remember, no friction. Secure and effortless."
              icon={
                <svg
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              }
              title="Passwordless auth"
            />
            <FeatureCard
              delay="320ms"
              description="Invite your team with a link. Manage roles, permissions, and channels from one clean settings panel."
              icon={
                <svg
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              }
              title="Team workspaces"
            />
            <FeatureCard
              delay="400ms"
              description="Works offline, syncs when you're back. Your messages are always there, even when your connection isn't."
              icon={
                <svg
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0M12 20h.01"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              }
              title="Offline-first"
            />
          </div>
        </div>
      </section>

      {/* Social proof / stats */}
      <section className="border-y border-amber-200/40 bg-white/40 px-5 py-16 backdrop-blur-sm sm:px-8 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-8 sm:grid-cols-3">
            <StatBlock label="Latency" value="<50ms" />
            <StatBlock label="Uptime" value="99.9%" />
            <StatBlock label="Open source" value="100%" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-3xl border border-amber-200/50 bg-gradient-to-br from-amber-50 to-orange-50/50 px-8 py-16 text-center shadow-[0_24px_80px_rgba(217,119,6,0.08)] sm:px-16 sm:py-20">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute -top-20 -right-20 size-64 rounded-full bg-amber-200/30 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 size-64 rounded-full bg-orange-200/20 blur-3xl" />
            </div>

            <div className="relative">
              <QuackLogo className="mx-auto mb-6 size-14 animate-float" />
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Ready to ditch the noise?
              </h2>
              <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-slate-500">
                Create your workspace in seconds. No credit card, no setup wizard, no nonsense.
              </p>
              <Link
                className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/25"
                href="/login"
              >
                Get started for free
                <svg
                  className="size-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-amber-200/40 px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <QuackLogo className="size-6" />
            <span className="text-sm font-semibold text-slate-900">Quack</span>
          </div>
          <p className="text-xs text-slate-400">
            Built by{" "}
            <a
              className="text-slate-500 transition-colors duration-200 hover:text-slate-700"
              href="https://www.youtube.com/@matt-ari"
              rel="noopener noreferrer"
              target="_blank"
            >
              Matt and Ari
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

function StatBlock(props: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{props.value}</p>
      <p className="mt-1 text-sm font-medium text-slate-500">{props.label}</p>
    </div>
  );
}
