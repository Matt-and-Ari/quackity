import { useEffect, useLayoutEffect, useRef, type KeyboardEvent } from "react";

import { MAX_INPUT_HEIGHT } from "./message-utils";

interface MessageEditorProps {
  onCancel: () => void;
  onSave: () => void;
  onValueChange: (value: string) => void;
  value: string;
}

export function MessageEditor(props: MessageEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  }, []);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const nextHeight = Math.min(textarea.scrollHeight, MAX_INPUT_HEIGHT);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > MAX_INPUT_HEIGHT ? "auto" : "hidden";
  }, [props.value]);

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      props.onCancel();
      return;
    }
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      props.onSave();
    }
  }

  return (
    <>
      <textarea
        className="w-full resize-none rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm leading-6 text-slate-700 outline-none transition-colors duration-100 focus:border-amber-400"
        onChange={(event) => props.onValueChange(event.target.value)}
        onKeyDown={handleKeyDown}
        ref={textareaRef}
        rows={1}
        value={props.value}
      />
      <div className="mt-1.5 flex select-none items-center gap-2">
        <button
          className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-white transition-colors duration-100 hover:bg-amber-600"
          onClick={props.onSave}
          type="button"
        >
          Save
        </button>
        <button
          className="rounded-lg border border-amber-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors duration-100 hover:bg-amber-50"
          onClick={props.onCancel}
          type="button"
        >
          Cancel
        </button>
        <span className="ml-auto text-[0.6rem] text-slate-400">enter to save · esc to cancel</span>
      </div>
    </>
  );
}
