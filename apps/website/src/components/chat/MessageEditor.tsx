import { RichTextEditor } from "./RichTextEditor";

interface MessageEditorProps {
  onCancel: () => void;
  onSave: () => void;
  onValueChange: (value: string) => void;
  value: string;
}

export function MessageEditor(props: MessageEditorProps) {
  function handleKeyDown(event: KeyboardEvent): boolean | void {
    if (event.key === "Escape") {
      event.preventDefault();
      props.onCancel();
      return true;
    }
  }

  return (
    <>
      <div className="rounded-xl border border-amber-200 bg-white transition-colors duration-100 focus-within:border-amber-400">
        <RichTextEditor
          autoFocus
          className="px-3 py-2"
          onKeyDown={handleKeyDown}
          onSubmit={props.onSave}
          onValueChange={props.onValueChange}
          value={props.value}
        />
      </div>
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
