import { useLayoutEffect, useRef, type KeyboardEvent } from "react";

import clsx from "clsx";

import type { StagedFile } from "../../hooks/useFileUpload";
import { HoverTooltip } from "../ui/HoverTooltip";
import { AttachGlyph } from "./chat-glyphs";
import { createFileList } from "./chat-date-utils";
import { MAX_INPUT_HEIGHT, StagedFileChip } from "./message-utils";

interface MessageInputProps {
  onAddFiles?: (files: FileList) => void;
  onFocus?: () => void;
  onKeyDown?: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onRemoveFile?: (fileId: string) => void;
  onSubmit: () => void;
  onValueChange: (value: string) => void;
  placeholder: string;
  stagedFiles?: StagedFile[];
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
  value: string;
}

export function MessageInput(props: MessageInputProps) {
  const fallbackRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = props.textareaRef ?? fallbackRef;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasContent = props.value.trim().length > 0 || (props.stagedFiles ?? []).length > 0;
  const isDraggingRef = useRef(false);
  const dragCounterRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    const nextHeight = Math.min(textarea.scrollHeight, MAX_INPUT_HEIGHT);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > MAX_INPUT_HEIGHT ? "auto" : "hidden";
  }, [props.value, textareaRef]);

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    props.onKeyDown?.(event);
    if (event.defaultPrevented) return;

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      props.onSubmit();
    }
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

  function handlePaste(event: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = event.clipboardData.items;
    const files: File[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }

    if (files.length > 0 && props.onAddFiles) {
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

        <textarea
          className={clsx(
            "w-full resize-none bg-transparent px-3 py-3 pr-12 text-sm leading-6 text-slate-700 outline-none placeholder:text-slate-400",
            !props.onAddFiles && "pl-4",
          )}
          onChange={(event) => props.onValueChange(event.target.value)}
          onFocus={props.onFocus}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={props.placeholder}
          ref={textareaRef}
          rows={1}
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
          onClick={props.onSubmit}
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
