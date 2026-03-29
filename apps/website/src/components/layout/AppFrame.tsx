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
          <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 text-xs shadow-sm sm:size-8 sm:text-sm">
            🦆
          </div>
          <span className="text-sm font-semibold tracking-tight text-slate-900">Quack</span>
        </div>
        <span className="text-xs text-slate-500">{props.statusLabel}</span>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">{props.children}</div>
    </div>
  );
}
