import { useEffect } from "react";

interface DeleteConfirmModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmModal(props: DeleteConfirmModalProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        props.onClose();
      } else if (event.key === "Enter") {
        event.preventDefault();
        props.onConfirm();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [props]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 px-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          props.onClose();
        }
      }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-amber-200/80 bg-white p-5 shadow-[0_30px_80px_rgba(15,23,42,0.14)]">
        <h3 className="text-base font-semibold text-slate-900">Delete message?</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          This action cannot be undone. The message content will be permanently removed.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition-colors duration-100 hover:bg-slate-100"
            onClick={props.onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            autoFocus
            className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-medium text-white transition-colors duration-100 hover:bg-rose-600"
            onClick={props.onConfirm}
            type="button"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
