import type { ReactNode } from "react";

interface ActionModalProps {
  children: ReactNode;
  onClose: () => void;
  title: string;
}

export function ActionModal(props: ActionModalProps) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-slate-950/20 px-0 backdrop-blur-sm sm:items-center sm:px-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          props.onClose();
        }
      }}
    >
      <div className="w-full max-w-md rounded-t-2xl border border-amber-200/80 bg-white p-5 shadow-[0_30px_80px_rgba(15,23,42,0.14)] sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">{props.title}</h3>
          <button
            className="rounded-md px-2 py-1 text-xs text-slate-500 transition-colors duration-100 hover:bg-slate-100"
            onClick={props.onClose}
            type="button"
          >
            Close
          </button>
        </div>
        {props.children}
      </div>
    </div>
  );
}
