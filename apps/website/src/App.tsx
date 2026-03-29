import { useMemo, useState } from "react";

const featureCards = [
  {
    title: "Realtime by default",
    description:
      "Prototype collaborative product ideas with Instant-powered data and a UI that feels alive from the first render.",
  },
  {
    title: "Design system energy",
    description:
      "Tailwind utilities make the surface easy to evolve, while React components keep the layout expressive and maintainable.",
  },
  {
    title: "Fast iteration loop",
    description:
      "Vite, HMR, and a component-first structure give `apps/website` a much better foundation than the previous template string app.",
  },
] as const;

const launchSteps = [
  "Compose sections as React components instead of building HTML strings by hand.",
  "Style directly with Tailwind utilities, backed by a small global theme layer.",
  "Keep the page lightweight while leaving room for richer routes and product stories.",
] as const;

export default function App() {
  const [pulses, setPulses] = useState(7);

  const pulseLabel = useMemo(() => {
    if (pulses < 10) return "warming up";
    if (pulses < 20) return "in flight";
    return "fully online";
  }, [pulses]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.2),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.22),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.2),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:88px_88px] [mask-image:radial-gradient(circle_at_center,black,transparent_78%)]" />

      <main className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 sm:px-10 lg:px-12">
        <header className="flex items-center justify-between rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 backdrop-blur-xl">
          <div>
            <p className="font-display text-lg tracking-[0.3em] text-cyan-200 uppercase">Quack</p>
            <p className="text-sm text-slate-300">React + Tailwind in `apps/website`</p>
          </div>
          <a
            href="https://tailwindcss.com/docs/installation/using-vite"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:border-cyan-300/60 hover:bg-cyan-300/15"
          >
            Tailwind docs
          </a>
        </header>

        <section className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:py-20">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-sm text-slate-200 shadow-2xl shadow-cyan-950/20 backdrop-blur">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_20px_rgba(74,222,128,0.75)]" />
              Website app upgraded from static HTML to a component-based UI.
            </div>

            <div className="max-w-3xl space-y-6">
              <p className="font-display text-5xl leading-none tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
                Build the polished marketing surface before the product story gets big.
              </p>
              <p className="max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
                This starter keeps the page visually rich while switching the app onto a modern
                React render path and Tailwind-driven styling workflow.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => setPulses((value) => value + 1)}
                className="rounded-full bg-white px-6 py-3 font-semibold text-slate-950 transition hover:scale-[1.01] hover:bg-cyan-100"
              >
                Send signal pulse
              </button>
              <div className="rounded-full border border-white/[0.12] bg-white/[0.07] px-5 py-3 text-sm text-slate-200 backdrop-blur">
                <span className="font-semibold text-white">{pulses}</span> pulses transmitted,
                system {pulseLabel}.
              </div>
            </div>

            <dl className="grid gap-4 pt-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/[0.07] p-5 backdrop-blur-xl">
                <dt className="text-sm text-slate-400">Framework</dt>
                <dd className="mt-2 font-display text-2xl text-white">React</dd>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.07] p-5 backdrop-blur-xl">
                <dt className="text-sm text-slate-400">Styling</dt>
                <dd className="mt-2 font-display text-2xl text-white">Tailwind</dd>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.07] p-5 backdrop-blur-xl">
                <dt className="text-sm text-slate-400">Iteration</dt>
                <dd className="mt-2 font-display text-2xl text-white">Vite</dd>
              </div>
            </dl>
          </div>

          <div className="relative">
            <div className="absolute -left-8 top-10 h-32 w-32 rounded-full bg-cyan-400/30 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-40 w-40 rounded-full bg-fuchsia-500/25 blur-3xl" />
            <div className="relative rounded-[2rem] border border-white/[0.12] bg-slate-900/75 p-6 shadow-[0_30px_120px_rgba(2,8,23,0.7)] backdrop-blur-2xl">
              <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/80 p-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <p className="font-display text-2xl text-white">Launch panel</p>
                    <p className="mt-1 text-sm text-slate-400">
                      A React component can now own this view.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className="h-3 w-3 rounded-full bg-rose-400" />
                    <span className="h-3 w-3 rounded-full bg-amber-400" />
                    <span className="h-3 w-3 rounded-full bg-emerald-400" />
                  </div>
                </div>

                <div className="space-y-4 pt-5">
                  {featureCards.map((card, index) => (
                    <article
                      key={card.title}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:-translate-y-0.5 hover:bg-white/[0.07]"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <p className="font-medium text-slate-300">Module 0{index + 1}</p>
                        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs tracking-[0.2em] text-cyan-100 uppercase">
                          active
                        </span>
                      </div>
                      <h2 className="font-display text-2xl text-white">{card.title}</h2>
                      <p className="mt-3 leading-7 text-slate-400">{card.description}</p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 border-t border-white/10 py-8 text-sm text-slate-300 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
            <p className="font-display text-xl text-white">What changed</p>
            <p className="mt-3 max-w-xl leading-7 text-slate-300">
              The previous app rendered a large HTML string directly into `#app`. It now mounts a
              React tree and uses Tailwind utilities for nearly all visual styling.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {launchSteps.map((step, index) => (
              <div
                key={step}
                className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl"
              >
                <p className="text-xs tracking-[0.28em] text-cyan-200 uppercase">
                  Step 0{index + 1}
                </p>
                <p className="mt-3 leading-7 text-slate-200">{step}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
