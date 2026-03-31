import { useEffect, useRef } from "react";

import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import type { EditorView } from "@tiptap/pm/view";
import type { ResolvedPos } from "@tiptap/pm/model";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import clsx from "clsx";

interface RichTextEditorProps {
  autoFocus?: boolean;
  className?: string;
  editorRef?: React.RefObject<Editor | null>;
  onKeyDown?: (event: KeyboardEvent) => boolean | void;
  onPaste?: (event: ClipboardEvent) => void;
  onSubmit?: () => void;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  value?: string;
}

export function RichTextEditor(props: RichTextEditorProps) {
  const propsRef = useRef(props);
  propsRef.current = props;

  const lastEmittedValue = useRef(props.value ?? "");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        horizontalRule: false,
        dropcursor: false,
      }),
      Placeholder.configure({
        placeholder: props.placeholder ?? "",
      }),
      Underline,
      Link.extend({ name: "quackLink" }).configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
      }),
    ],
    content: parseContent(props.value),
    editorProps: {
      attributes: {
        class: "outline-none",
      },
      handleKeyDown: (view, event) => {
        const p = propsRef.current;

        if (p.onKeyDown) {
          const handled = p.onKeyDown(event);
          if (handled) return true;
        }

        if (event.key === "Enter" && event.shiftKey) {
          const { $from } = view.state.selection;
          if (isInsideList($from)) {
            event.preventDefault();
            const ed = propsRef.current.editorRef?.current;
            if (ed) ed.commands.splitListItem("listItem");
            return true;
          }
          return false;
        }

        if (event.key === "Enter" && !event.shiftKey && p.onSubmit) {
          if (shouldDeferEnterToTiptap(view)) return false;

          const isEmpty = view.state.doc.textContent.trim().length === 0;
          if (!isEmpty) {
            event.preventDefault();
            p.onSubmit();
            return true;
          }
        }

        return false;
      },
    },
    onUpdate({ editor: e }) {
      const serialized = serializeContent(e);
      lastEmittedValue.current = serialized;
      propsRef.current.onValueChange?.(serialized);
    },
  });

  useEffect(() => {
    if (props.editorRef && editor) {
      (props.editorRef as React.MutableRefObject<Editor | null>).current = editor;
    }
  }, [editor, props.editorRef]);

  useEffect(() => {
    if (!editor) return;

    const incoming = props.value ?? "";
    if (incoming === lastEmittedValue.current) return;

    lastEmittedValue.current = incoming;
    editor.commands.setContent(parseContent(incoming), { emitUpdate: false });
  }, [props.value, editor]);

  useEffect(() => {
    if (props.autoFocus && editor) {
      requestAnimationFrame(() => {
        editor.commands.focus("end");
      });
    }
  }, [props.autoFocus, editor]);

  useEffect(() => {
    if (!editor || !props.onPaste) return;

    const editorElement = editor.view.dom;
    const handler = props.onPaste;
    editorElement.addEventListener("paste", handler);
    return () => editorElement.removeEventListener("paste", handler);
  }, [editor, props.onPaste]);

  return <EditorContent className={clsx("tiptap-wrapper", props.className)} editor={editor} />;
}

function shouldDeferEnterToTiptap(view: EditorView): boolean {
  const { $from } = view.state.selection;
  const node = $from.parent;

  if (node.type.name === "codeBlock") return true;
  if (node.type.name === "paragraph" && node.textContent.startsWith("```")) return true;
  if (isInsideList($from)) return true;

  return false;
}

function isInsideList($from: ResolvedPos): boolean {
  for (let depth = $from.depth; depth >= 0; depth--) {
    const name = $from.node(depth).type.name;
    if (name === "listItem" || name === "bulletList" || name === "orderedList") return true;
  }
  return false;
}

interface JSONContent {
  type?: string;
  content?: JSONContent[];
  text?: string;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  attrs?: Record<string, unknown>;
}

function serializeContent(editor: Editor): string {
  const json = editor.getJSON() as JSONContent;
  const hasContent =
    json.content &&
    json.content.length > 0 &&
    !(
      json.content.length === 1 &&
      json.content[0].type === "paragraph" &&
      !json.content[0].content
    );

  if (!hasContent) return "";

  const isPlainText =
    json.content!.length === 1 &&
    json.content![0].type === "paragraph" &&
    json.content![0].content?.every((n) => n.type === "text" && !n.marks?.length);

  if (isPlainText) {
    return json.content![0].content?.map((n) => n.text ?? "").join("") ?? "";
  }

  return JSON.stringify(json);
}

function parseContent(value: string | undefined): string | Record<string, unknown> {
  if (!value) return "";

  if (value.startsWith("{")) {
    try {
      return JSON.parse(value) as Record<string, unknown>;
    } catch {
      return value;
    }
  }

  return value;
}

export function clearEditor(editor: Editor | null) {
  if (!editor) return;
  editor.commands.clearContent(true);
}

export function focusEditor(editor: Editor | null) {
  if (!editor) return;
  editor.commands.focus("end");
}

export function getEditorText(editor: Editor | null): string {
  if (!editor) return "";
  return editor.state.doc.textContent;
}

export function isEditorEmpty(editor: Editor | null): boolean {
  if (!editor) return true;
  return editor.state.doc.textContent.trim().length === 0;
}

export function getEditorPlainText(value: string): string {
  if (!value) return "";

  if (value.startsWith("{")) {
    try {
      const json = JSON.parse(value) as TiptapDoc;
      return extractPlainText(json);
    } catch {
      return value;
    }
  }

  return value;
}

interface TiptapDoc {
  type?: string;
  content?: TiptapDoc[];
  text?: string;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  attrs?: Record<string, unknown>;
}

function extractPlainText(node: TiptapDoc): string {
  if (node.text) return node.text;
  if (!node.content) return "";
  return node.content.map(extractPlainText).join(node.type === "doc" ? "\n" : "");
}
