import { useRef, useState } from "react";

import type { Editor } from "@tiptap/react";
import clsx from "clsx";

import type { StagedFile } from "../../hooks/useFileUpload";
import { HoverTooltip } from "../ui/HoverTooltip";
import { AttachGlyph } from "./chat-glyphs";
import { createFileList } from "./chat-date-utils";
import { FormattingToolbar } from "./FormattingToolbar";
import type { MentionSuggestionItem } from "./MentionList";
import { StagedFileChip } from "./message-utils";
import { RichTextEditor, clearEditor } from "./RichTextEditor";

interface MessageInputProps {
  editorRef?: React.RefObject<Editor | null>;
  members?: MentionSuggestionItem[];
  onAddFiles?: (files: FileList) => void;
  onFocus?: () => void;
  onKeyDown?: (event: KeyboardEvent) => boolean | void;
  onRemoveFile?: (fileId: string) => void;
  onSubmit: () => void;
  onTypingKeyDown?: (event: KeyboardEvent) => void;
  onTypingBlur?: () => void;
  onValueChange: (value: string) => void;
  placeholder: string;
  stagedFiles?: StagedFile[];
  value: string;
}

export function MessageInput(props: MessageInputProps) {
  const fallbackEditorRef = useRef<Editor | null>(null);
  const editorRef = props.editorRef ?? fallbackEditorRef;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDraggingRef = useRef(false);
  const dragCounterRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [editor, setEditor] = useState<Editor | null>(null);

  const hasContent = props.value.trim().length > 0 || (props.stagedFiles ?? []).length > 0;

  function handleSubmit() {
    props.onSubmit();
    clearEditor(editorRef.current);
    props.onTypingBlur?.();
  }

  function handleFileInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (files && files.length > 0 && props.onAddFiles) {
      props.onAddFiles(files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleDragEnter(event: React.DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    dragCounterRef.current++;
    if (!isDraggingRef.current) {
      isDraggingRef.current = true;
      containerRef.current?.classList.add("ring-2", "ring-amber-400", "ring-inset");
    }
  }

  function handleDragLeave(event: React.DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      isDraggingRef.current = false;
      containerRef.current?.classList.remove("ring-2", "ring-amber-400", "ring-inset");
    }
  }

  function handleDragOver(event: React.DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    dragCounterRef.current = 0;
    isDraggingRef.current = false;
    containerRef.current?.classList.remove("ring-2", "ring-amber-400", "ring-inset");

    const files = event.dataTransfer.files;
    if (files.length > 0 && props.onAddFiles) {
      props.onAddFiles(files);
    }
  }

  function handlePaste(event: ClipboardEvent) {
    const items = event.clipboardData?.items;
    if (!items) return;

    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }

    if (files.length > 0 && props.onAddFiles) {
      event.preventDefault();
      props.onAddFiles(createFileList(files));
    }
  }

  const stagedFiles = props.stagedFiles ?? [];

  return (
    <div
      className="relative rounded-xl border border-amber-200/70 bg-white transition-colors duration-100 focus-within:border-amber-400"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      ref={containerRef}
    >
      <div className="border-b border-amber-100/60">
        <FormattingToolbar editor={editor} />
      </div>

      {stagedFiles.length > 0 ? (
        <div className="flex flex-wrap gap-2 px-3 pt-3">
          {stagedFiles.map((staged) => (
            <StagedFileChip
              key={staged.id}
              onRemove={props.onRemoveFile ? () => props.onRemoveFile!(staged.id) : undefined}
              staged={staged}
            />
          ))}
        </div>
      ) : null}

      <div className="flex items-end">
        {props.onAddFiles ? (
          <>
            <input
              accept="*/*"
              className="hidden"
              multiple
              onChange={handleFileInputChange}
              ref={fileInputRef}
              type="file"
            />
            <HoverTooltip content="Attach a file">
              <button
                aria-label="Attach file"
                className="mb-2.5 ml-2 flex size-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors duration-100 hover:bg-amber-50 hover:text-slate-600"
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                <AttachGlyph />
              </button>
            </HoverTooltip>
          </>
        ) : null}

        <RichTextEditor
          className={clsx("w-full bg-transparent px-3 py-3 pr-12", !props.onAddFiles && "pl-4")}
          editorRef={editorRef}
          members={props.members}
          onEditorReady={setEditor}
          onKeyDown={(event) => {
            props.onTypingKeyDown?.(event);
            return props.onKeyDown?.(event);
          }}
          onPaste={handlePaste}
          onSubmit={handleSubmit}
          onValueChange={props.onValueChange}
          placeholder={props.placeholder}
          value={props.value}
        />

        <button
          aria-label="Send message"
          className={clsx(
            "absolute bottom-2.5 right-3 flex size-7 select-none items-center justify-center rounded-lg transition-colors duration-100",
            hasContent
              ? "bg-amber-500 text-white hover:bg-amber-600"
              : "bg-amber-50 text-slate-300",
          )}
          disabled={!hasContent}
          onClick={handleSubmit}
          type="button"
        >
          <svg fill="none" height="14" viewBox="0 0 16 16" width="14">
            <path d="M3 13V9L11 8L3 7V3L14 8L3 13Z" fill="currentColor" />
          </svg>
        </button>
      </div>
    </div>
  );
}
