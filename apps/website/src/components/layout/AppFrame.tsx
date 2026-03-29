import type { ReactNode } from "react";

interface AppFrameProps {
  children: ReactNode;
  statusLabel: string;
}

export function AppFrame(props: AppFrameProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden p-2 sm:p-3">
      <header className="mb-3 flex shrink-0 items-center justify-between rounded-2xl border border-amber-200/60 bg-white/75 px-5 py-3 shadow-[0_18px_50px_rgba(217,119,6,0.08)] backdrop-blur-xl select-none">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 text-sm shadow-sm">
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
