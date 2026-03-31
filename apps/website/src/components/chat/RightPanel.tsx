import clsx from "clsx";

import { ResizeHandle } from "./ResizeHandle";

interface RightPanelProps {
  children: React.ReactNode;
  isMobile?: boolean;
  onClose: () => void;
  startResize: (event: React.MouseEvent) => void;
  title: string;
  width: number;
}

export function RightPanel(props: RightPanelProps) {
  return (
    <aside
      className={clsx(
        "relative flex min-h-0 min-w-0 flex-col overflow-hidden",
        props.isMobile
          ? "h-full w-full"
          : "rounded-[1.45rem] border border-amber-200/60 bg-white/82 shadow-[0_18px_50px_rgba(15,23,42,0.07)]",
      )}
      style={props.isMobile ? undefined : { flexShrink: 0, width: props.width }}
    >
      {!props.isMobile ? <ResizeHandle onMouseDown={props.startResize} side="left" /> : null}

      <div className="flex select-none items-center justify-between border-b border-amber-100/70 px-4 py-3">
        {props.isMobile ? (
          <button
            className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-slate-500 transition-colors duration-100 hover:bg-amber-50"
            onClick={props.onClose}
            type="button"
          >
            <svg fill="none" height="14" viewBox="0 0 14 14" width="14">
              <path
                d="M9 2.5 4.5 7 9 11.5"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
              />
            </svg>
            Back
          </button>
        ) : null}
        <h3 className="text-sm font-semibold text-slate-900">{props.title}</h3>
        {!props.isMobile ? (
          <button
            className="rounded-md px-2 py-1 text-xs text-slate-500 transition-colors duration-100 hover:bg-amber-50"
            onClick={props.onClose}
            type="button"
          >
            Close
          </button>
        ) : (
          <div />
        )}
      </div>

      {props.children}
    </aside>
  );
}
