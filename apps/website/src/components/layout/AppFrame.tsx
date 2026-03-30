import type { ReactNode } from "react";

interface AppFrameProps {
  children: ReactNode;
  statusLabel: string;
}

export function AppFrame(props: AppFrameProps) {
  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden p-1.5 sm:p-2 md:p-3">
      <header className="mb-2 flex shrink-0 items-center justify-between rounded-xl border border-amber-200/60 bg-white/75 px-3 py-2.5 shadow-[0_18px_50px_rgba(217,119,6,0.08)] backdrop-blur-xl select-none sm:mb-3 sm:rounded-2xl sm:px-5 sm:py-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex size-7 items-center justify-center rounded-lg shadow-sm sm:size-8">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="size-full">
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
          </div>
          <span className="text-sm font-semibold tracking-tight text-slate-900">Quack</span>
        </div>
        <span className="text-xs text-slate-500">{props.statusLabel}</span>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">{props.children}</div>
    </div>
  );
}
