import { useCallback, useMemo } from "react";

import clsx from "clsx";

interface MessageBodyProps {
  body: string;
  className?: string;
  currentUserId?: string;
  onMentionClick?: (userId: string) => void;
}

export function MessageBody(props: MessageBodyProps) {
  const html = useMemo(
    () => bodyToHtml(props.body, props.currentUserId),
    [props.body, props.currentUserId],
  );

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!props.onMentionClick) return;
      const target = event.target as HTMLElement;
      const mention = target.closest<HTMLElement>(".mention");
      if (mention) {
        const userId = mention.dataset.userId;
        if (userId) {
          event.stopPropagation();
          props.onMentionClick(userId);
        }
      }
    },
    [props.onMentionClick],
  );

  return (
    <div
      className={clsx("tiptap-prose", props.className)}
      dangerouslySetInnerHTML={{ __html: html }}
      onClick={handleClick}
    />
  );
}

interface TiptapNode {
  type?: string;
  content?: TiptapNode[];
  text?: string;
  marks?: TiptapMark[];
  attrs?: Record<string, unknown>;
}

interface TiptapMark {
  type: string;
  attrs?: Record<string, unknown>;
}

interface RenderCtx {
  currentUserId?: string;
}

function bodyToHtml(body: string, currentUserId?: string): string {
  if (!body) return "";

  const ctx: RenderCtx = { currentUserId };

  if (body.startsWith("{")) {
    try {
      const doc = JSON.parse(body) as TiptapNode;
      return renderDoc(doc, ctx);
    } catch {
      return plainTextToHtml(body);
    }
  }

  return plainTextToHtml(body);
}

function plainTextToHtml(text: string): string {
  return `<p>${escapeHtml(text).replace(/\n/g, "<br>")}</p>`;
}

function renderDoc(doc: TiptapNode, ctx: RenderCtx): string {
  if (!doc.content) return "";
  return doc.content.map((n) => renderNode(n, ctx)).join("");
}

function renderNode(node: TiptapNode, ctx: RenderCtx): string {
  switch (node.type) {
    case "paragraph":
      return `<p>${renderInline(node, ctx)}</p>`;
    case "heading": {
      const level = (node.attrs?.level as number) ?? 1;
      return `<h${level}>${renderInline(node, ctx)}</h${level}>`;
    }
    case "bulletList":
      return `<ul>${(node.content ?? []).map((n) => renderNode(n, ctx)).join("")}</ul>`;
    case "orderedList":
      return `<ol>${(node.content ?? []).map((n) => renderNode(n, ctx)).join("")}</ol>`;
    case "listItem":
      return `<li>${(node.content ?? []).map((n) => renderNode(n, ctx)).join("")}</li>`;
    case "codeBlock":
      return `<pre><code>${escapeHtml(extractText(node))}</code></pre>`;
    case "blockquote":
      return `<blockquote>${(node.content ?? []).map((n) => renderNode(n, ctx)).join("")}</blockquote>`;
    case "hardBreak":
      return "<br>";
    case "mention":
      return renderMention(node, ctx);
    case "text":
      return renderTextWithMarks(node);
    default:
      return renderInline(node, ctx);
  }
}

function renderMention(node: TiptapNode, ctx: RenderCtx): string {
  const userId = String(node.attrs?.id ?? "");
  const label = escapeHtml(String(node.attrs?.label ?? ""));
  const isSelf = ctx.currentUserId != null && userId === ctx.currentUserId;
  const cls = isSelf ? "mention mention-self" : "mention";
  return `<span class="${cls}" data-user-id="${escapeHtml(userId)}">@${label}</span>`;
}

function renderInline(node: TiptapNode, ctx: RenderCtx): string {
  if (!node.content) return "";
  return node.content.map((n) => renderNode(n, ctx)).join("");
}

function renderTextWithMarks(node: TiptapNode): string {
  let html = escapeHtml(node.text ?? "");

  if (!node.marks) return html;

  for (const mark of node.marks) {
    switch (mark.type) {
      case "bold":
        html = `<strong>${html}</strong>`;
        break;
      case "italic":
        html = `<em>${html}</em>`;
        break;
      case "strike":
        html = `<s>${html}</s>`;
        break;
      case "underline":
        html = `<u>${html}</u>`;
        break;
      case "code":
        html = `<code>${html}</code>`;
        break;
      case "link":
      case "quackLink": {
        const href = escapeHtml(String(mark.attrs?.href ?? ""));
        html = `<a href="${href}" target="_blank" rel="noopener noreferrer">${html}</a>`;
        break;
      }
    }
  }

  return html;
}

function extractText(node: TiptapNode): string {
  if (node.text) return node.text;
  if (!node.content) return "";
  return node.content.map(extractText).join("");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
