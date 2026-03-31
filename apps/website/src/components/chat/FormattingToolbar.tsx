import type { Editor } from "@tiptap/react";
import clsx from "clsx";

import { HoverTooltip } from "../ui/HoverTooltip";

interface FormattingToolbarProps {
  editor: Editor | null;
}

export function FormattingToolbar(props: FormattingToolbarProps) {
  const editor = props.editor;

  if (!editor) return null;

  return (
    <div className="flex items-center gap-0.5 border-t border-amber-100/60 px-2 py-1">
      <ToolbarButton
        active={editor.isActive("bold")}
        label="Bold"
        onClick={() => editor.chain().focus().toggleBold().run()}
        shortcut="⌘B"
      >
        <BoldIcon />
      </ToolbarButton>

      <ToolbarButton
        active={editor.isActive("italic")}
        label="Italic"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        shortcut="⌘I"
      >
        <ItalicIcon />
      </ToolbarButton>

      <ToolbarButton
        active={editor.isActive("strike")}
        label="Strikethrough"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        shortcut="⌘⇧X"
      >
        <StrikethroughIcon />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        active={editor.isActive("quackLink")}
        label="Link"
        onClick={() => {
          if (editor.isActive("quackLink")) {
            editor.chain().focus().unsetLink().run();
          } else {
            const url = window.prompt("Enter URL:");
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }
        }}
        shortcut="⌘K"
      >
        <LinkIcon />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        active={editor.isActive("orderedList")}
        label="Ordered list"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        shortcut="⌘⇧7"
      >
        <OrderedListIcon />
      </ToolbarButton>

      <ToolbarButton
        active={editor.isActive("bulletList")}
        label="Bulleted list"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        shortcut="⌘⇧8"
      >
        <BulletListIcon />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        active={editor.isActive("blockquote")}
        label="Quote"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        shortcut="⌘⇧9"
      >
        <BlockquoteIcon />
      </ToolbarButton>

      <ToolbarButton
        active={editor.isActive("code")}
        label="Inline code"
        onClick={() => editor.chain().focus().toggleCode().run()}
        shortcut="⌘E"
      >
        <InlineCodeIcon />
      </ToolbarButton>

      <ToolbarButton
        active={editor.isActive("codeBlock")}
        label="Code block"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        shortcut="⌘⇧E"
      >
        <CodeBlockIcon />
      </ToolbarButton>
    </div>
  );
}

interface ToolbarButtonProps {
  active: boolean;
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  shortcut?: string;
}

function ToolbarButton(props: ToolbarButtonProps) {
  const tooltipContent = props.shortcut ? `${props.label} (${props.shortcut})` : props.label;

  return (
    <HoverTooltip content={tooltipContent} side="top">
      <button
        aria-label={props.label}
        aria-pressed={props.active}
        className={clsx(
          "flex size-7 items-center justify-center rounded-md transition-colors duration-75",
          props.active
            ? "bg-amber-100/80 text-amber-700"
            : "text-slate-400 hover:bg-amber-50 hover:text-slate-600",
        )}
        onClick={(e) => {
          e.preventDefault();
          props.onClick();
        }}
        type="button"
      >
        {props.children}
      </button>
    </HoverTooltip>
  );
}

function Divider() {
  return <div className="mx-0.5 h-4 w-px bg-amber-200/50" />;
}

function BoldIcon() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 16 16">
      <path
        d="M4.5 3h4a2.5 2.5 0 0 1 0 5H4.5V3ZM4.5 8h4.5a2.5 2.5 0 0 1 0 5H4.5V8Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function ItalicIcon() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 16 16">
      <path
        d="M10 3H6.5M9.5 13H6M8.5 3 7.5 13"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.3"
      />
    </svg>
  );
}

function StrikethroughIcon() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 16 16">
      <path
        d="M3 8h10M10.5 5.5C10.5 4.12 9.38 3 8 3S5.5 4.12 5.5 5.5M5.5 10.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.3"
      />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 16 16">
      <path
        d="M6.5 9.5a3 3 0 0 0 4.24 0l1.5-1.5a3 3 0 0 0-4.24-4.24l-.86.86"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.3"
      />
      <path
        d="M9.5 6.5a3 3 0 0 0-4.24 0l-1.5 1.5a3 3 0 0 0 4.24 4.24l.86-.86"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.3"
      />
    </svg>
  );
}

function OrderedListIcon() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 16 16">
      <path
        d="M7 3.5h6M7 8h6M7 12.5h6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.3"
      />
      <text
        className="select-none"
        fill="currentColor"
        fontSize="6"
        fontWeight="600"
        x="2.5"
        y="5.5"
      >
        1
      </text>
      <text
        className="select-none"
        fill="currentColor"
        fontSize="6"
        fontWeight="600"
        x="2.5"
        y="10"
      >
        2
      </text>
      <text
        className="select-none"
        fill="currentColor"
        fontSize="6"
        fontWeight="600"
        x="2.5"
        y="14.5"
      >
        3
      </text>
    </svg>
  );
}

function BulletListIcon() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 16 16">
      <path
        d="M7 3.5h6M7 8h6M7 12.5h6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.3"
      />
      <circle cx="4" cy="3.5" fill="currentColor" r="1.2" />
      <circle cx="4" cy="8" fill="currentColor" r="1.2" />
      <circle cx="4" cy="12.5" fill="currentColor" r="1.2" />
    </svg>
  );
}

function BlockquoteIcon() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 16 16">
      <path d="M3 3v10" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      <path
        d="M6.5 5h6M6.5 8h5M6.5 11h4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.3"
      />
    </svg>
  );
}

function InlineCodeIcon() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 16 16">
      <path
        d="M5.5 4.5 2.5 8l3 3.5M10.5 4.5l3 3.5-3 3.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.3"
      />
    </svg>
  );
}

function CodeBlockIcon() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 16 16">
      <rect height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" width="12" x="2" y="3" />
      <path
        d="M5.5 6.5 4 8l1.5 1.5M10.5 6.5 12 8l-1.5 1.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.2"
      />
    </svg>
  );
}
