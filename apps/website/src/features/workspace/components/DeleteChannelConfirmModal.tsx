import { useEffect, useRef, useState } from "react";

interface DeleteChannelConfirmModalProps {
  channelName: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteChannelConfirmModal(props: DeleteChannelConfirmModalProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const isMatch = inputValue.trim() === props.channelName;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        props.onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [props]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isMatch) {
      props.onConfirm();
    }
  }

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
        <h3 className="text-base font-semibold text-slate-900">Delete channel?</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          This will permanently delete{" "}
          <span className="font-semibold text-slate-700">#{props.channelName}</span> and all of its
          messages. This action is irreversible.
        </p>
        <form onSubmit={handleSubmit}>
          <label className="mt-4 block text-sm text-slate-500" htmlFor="delete-channel-confirm">
            Type <span className="font-semibold text-slate-700">{props.channelName}</span> to
            confirm
          </label>
          <input
            autoComplete="off"
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition-colors duration-100 placeholder:text-slate-300 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40"
            id="delete-channel-confirm"
            onChange={(event) => setInputValue(event.target.value)}
            placeholder={props.channelName}
            ref={inputRef}
            spellCheck={false}
            type="text"
            value={inputValue}
          />
          <div className="mt-5 flex justify-end gap-2">
            <button
              className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition-colors duration-100 hover:bg-slate-100"
              onClick={props.onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-medium text-white transition-opacity duration-100 hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!isMatch}
              type="submit"
            >
              Delete channel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
