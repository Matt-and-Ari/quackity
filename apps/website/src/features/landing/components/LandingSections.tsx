import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

export function useInView(props: { threshold?: number; once?: boolean }) {
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

export function AnimatedSection(props: {
  children: React.ReactNode;
  className?: string;
  delay?: string;
}) {
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

export function FeatureCard(props: { description: string; icon: React.ReactNode; title: string }) {
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

export function ShowcaseSection(props: {
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

export function StatBlock(props: { description: string; label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{props.value}</p>
      <p className="mt-1 text-sm font-medium text-slate-500">{props.label}</p>
      <p className="mt-2 text-xs leading-relaxed text-slate-400">{props.description}</p>
    </div>
  );
}

export function QuackLogo(props: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className={props.className}>
      <circle cx="32" cy="32" r="30" fill="#FCD34D" />
      <ellipse cx="32" cy="38" rx="18" ry="16" fill="#FBBF24" />
      <circle cx="32" cy="24" r="14" fill="#FCD34D" />

      {/* Left eye — blinks */}
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

      {/* Right eye — blinks */}
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

      <ellipse cx="32" cy="27" rx="6" ry="3.5" fill="#F97316" />
      <ellipse cx="32" cy="26.5" rx="4" ry="2" fill="#FB923C" />
      <ellipse cx="20" cy="40" rx="8" ry="5" fill="#FBBF24" transform="rotate(-15 20 40)" />
      <ellipse cx="44" cy="40" rx="8" ry="5" fill="#FBBF24" transform="rotate(15 44 40)" />
    </svg>
  );
}
