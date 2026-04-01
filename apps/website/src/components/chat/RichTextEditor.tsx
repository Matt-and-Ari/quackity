import { useEffect, useRef } from "react";

import { EditorContent, Extension, ReactRenderer, useEditor, type Editor } from "@tiptap/react";
import type { EditorView } from "@tiptap/pm/view";
import type { ResolvedPos } from "@tiptap/pm/model";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Mention from "@tiptap/extension-mention";
import Suggestion from "@tiptap/suggestion";
import type { SuggestionProps, SuggestionKeyDownProps } from "@tiptap/suggestion";
import clsx from "clsx";
import emojiDataJson from "@emoji-mart/data/sets/15/native.json";
import type { EmojiMartData } from "@emoji-mart/data";

import { getPreferences } from "../../hooks/usePreferences";
import { EmojiSuggestionList, type EmojiSuggestionItem } from "./EmojiSuggestionList";
import { MentionList, type MentionSuggestionItem } from "./MentionList";

interface RichTextEditorProps {
  autoFocus?: boolean;
  className?: string;
  editorRef?: React.RefObject<Editor | null>;
  members?: MentionSuggestionItem[];
  onEditorReady?: (editor: Editor) => void;
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
  const membersRef = useRef(props.members ?? []);
  membersRef.current = props.members ?? [];

  const placeholderRef = useRef(props.placeholder ?? "");
  placeholderRef.current = props.placeholder ?? "";

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        horizontalRule: false,
        dropcursor: false,
      }),
      Placeholder.configure({
        placeholder: () => placeholderRef.current,
      }),
      Underline,
      Link.extend({ name: "quackLink" }).configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
      }),
      Mention.configure({
        HTMLAttributes: { class: "mention" },
        suggestion: buildMentionSuggestion(membersRef),
      }),
      buildEmojiSuggestionExtension(),
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

        if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "x") {
          event.preventDefault();
          propsRef.current.editorRef?.current?.commands.toggleStrike();
          return true;
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
          const wantsEnterSend = getPreferences().enterToSend;
          if (!wantsEnterSend && !event.metaKey && !event.ctrlKey) return false;
          if (shouldDeferEnterToTiptap(view)) return false;
          if (isSuggestionActive(view)) return false;

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
    if (editor) {
      propsRef.current.onEditorReady?.(editor);
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
    if (!editor) return;
    editor.view.dispatch(editor.state.tr.setMeta("addToHistory", false));
  }, [props.placeholder, editor]);

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

function isSuggestionActive(view: EditorView): boolean {
  return view.dom.querySelector(".suggestion") !== null;
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
  if (node.type === "mention") return `@${node.attrs?.label ?? ""}`;
  if (node.text) return node.text;
  if (!node.content) return "";
  return node.content.map(extractPlainText).join(node.type === "doc" ? "\n" : "");
}

export function extractMentionUserIds(body: string): string[] {
  if (!body || !body.startsWith("{")) return [];

  try {
    const doc = JSON.parse(body) as TiptapDoc;
    const ids: string[] = [];
    collectMentionIds(doc, ids);
    return [...new Set(ids)];
  } catch {
    return [];
  }
}

function collectMentionIds(node: TiptapDoc, ids: string[]) {
  if (node.type === "mention" && node.attrs?.id) {
    ids.push(String(node.attrs.id));
  }
  if (node.content) {
    for (const child of node.content) {
      collectMentionIds(child, ids);
    }
  }
}

interface MentionRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

function buildMentionSuggestion(membersRef: React.RefObject<MentionSuggestionItem[]>) {
  return {
    items({ query }: { query: string }): MentionSuggestionItem[] {
      const q = query.toLowerCase();
      return (membersRef.current ?? [])
        .filter((m) => m.displayName.toLowerCase().includes(q))
        .slice(0, 8);
    },
    render() {
      let component: ReactRenderer<MentionRef> | null = null;
      let popup: HTMLDivElement | null = null;

      return {
        onStart(suggestionProps: SuggestionProps) {
          component = new ReactRenderer(MentionList, {
            props: suggestionProps,
            editor: suggestionProps.editor,
          }) as ReactRenderer<MentionRef>;

          popup = createSuggestionPopup();
          if (component) popup.appendChild(component.element);

          if (suggestionProps.clientRect) {
            positionPopup(popup, suggestionProps.clientRect);
          }
        },
        onUpdate(suggestionProps: SuggestionProps) {
          component?.updateProps(suggestionProps);

          if (popup && suggestionProps.clientRect) {
            positionPopup(popup, suggestionProps.clientRect);
          }
        },
        onKeyDown(suggestionProps: SuggestionKeyDownProps) {
          if (suggestionProps.event.key === "Escape") {
            popup?.remove();
            popup = null;
            component?.destroy();
            component = null;
            return true;
          }
          return component?.ref?.onKeyDown(suggestionProps) ?? false;
        },
        onExit() {
          popup?.remove();
          popup = null;
          component?.destroy();
          component = null;
        },
      };
    },
  };
}

function createSuggestionPopup(): HTMLDivElement {
  const popup = document.createElement("div");
  popup.style.position = "fixed";
  popup.style.zIndex = "50";
  document.body.appendChild(popup);
  return popup;
}

function positionPopup(popup: HTMLDivElement, clientRect: (() => DOMRect | null) | null) {
  if (!clientRect) return;
  const rect = clientRect();
  if (!rect) return;

  const gap = 4;
  const popupHeight = popup.offsetHeight;

  if (popupHeight === 0) {
    popup.style.visibility = "hidden";
    popup.style.left = `${rect.left}px`;
    popup.style.top = `${rect.top - gap}px`;

    requestAnimationFrame(() => {
      if (!popup) return;
      popup.style.visibility = "";
      positionPopup(popup, clientRect);
    });
    return;
  }

  const fitsAbove = rect.top - gap - popupHeight >= 0;
  const top = fitsAbove ? rect.top - gap - popupHeight : rect.bottom + gap;

  popup.style.left = `${Math.max(0, rect.left)}px`;
  popup.style.top = `${top}px`;
}

const emojiData = emojiDataJson as EmojiMartData;

interface EmojiSearchEntry {
  emoji: string;
  id: string;
  name: string;
  searchText: string;
}

const allEmojiSearchEntries: EmojiSearchEntry[] = Object.values(emojiData.emojis)
  .map((emoji) => {
    const native = emoji.skins[0]?.native;
    if (!native) return null;
    return {
      emoji: native,
      id: emoji.id,
      name: emoji.name,
      searchText: `${emoji.id} ${emoji.name} ${emoji.keywords.join(" ")}`.toLowerCase(),
    };
  })
  .filter((e): e is EmojiSearchEntry => e !== null);

interface EmojiSuggestionRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

function buildEmojiSuggestionExtension() {
  return Extension.create({
    name: "emojiSuggestion",
    addProseMirrorPlugins() {
      return [
        Suggestion<EmojiSuggestionItem>({
          editor: this.editor,
          char: ":",
          allowSpaces: false,
          startOfLine: false,
          items({ query }: { query: string }): EmojiSuggestionItem[] {
            if (!query) return [];
            const q = query.toLowerCase();
            return allEmojiSearchEntries.filter((e) => e.searchText.includes(q)).slice(0, 10);
          },
          command({ editor, range, props: item }) {
            editor.chain().focus().deleteRange(range).insertContent(item.emoji).run();
          },
          render() {
            let component: ReactRenderer<EmojiSuggestionRef> | null = null;
            let popup: HTMLDivElement | null = null;

            return {
              onStart(suggestionProps: SuggestionProps<EmojiSuggestionItem>) {
                component = new ReactRenderer(EmojiSuggestionList, {
                  props: suggestionProps,
                  editor: suggestionProps.editor,
                }) as ReactRenderer<EmojiSuggestionRef>;

                popup = createSuggestionPopup();
                if (component) popup.appendChild(component.element);

                if (suggestionProps.clientRect) {
                  positionPopup(popup, suggestionProps.clientRect);
                }
              },
              onUpdate(suggestionProps: SuggestionProps<EmojiSuggestionItem>) {
                component?.updateProps(suggestionProps);

                if (popup && suggestionProps.clientRect) {
                  positionPopup(popup, suggestionProps.clientRect);
                }
              },
              onKeyDown(suggestionProps: SuggestionKeyDownProps) {
                if (suggestionProps.event.key === "Escape") {
                  popup?.remove();
                  popup = null;
                  component?.destroy();
                  component = null;
                  return true;
                }
                return component?.ref?.onKeyDown(suggestionProps) ?? false;
              },
              onExit() {
                popup?.remove();
                popup = null;
                component?.destroy();
                component = null;
              },
            };
          },
        }),
      ];
    },
  });
}
