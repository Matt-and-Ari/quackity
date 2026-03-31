import { useMemo } from "react";

import clsx from "clsx";

interface MessageBodyProps {
  body: string;
  className?: string;
}

export function MessageBody(props: MessageBodyProps) {
  const html = useMemo(() => bodyToHtml(props.body), [props.body]);

  return (
    <div
      className={clsx("tiptap-prose", props.className)}
      dangerouslySetInnerHTML={{ __html: html }}
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

function bodyToHtml(body: string): string {
  if (!body) return "";

  if (body.startsWith("{")) {
    try {
      const doc = JSON.parse(body) as TiptapNode;
      return renderDoc(doc);
    } catch {
      return plainTextToHtml(body);
    }
  }

  return plainTextToHtml(body);
}

function plainTextToHtml(text: string): string {
  return `<p>${escapeHtml(text).replace(/\n/g, "<br>")}</p>`;
}

function renderDoc(doc: TiptapNode): string {
  if (!doc.content) return "";
  return doc.content.map(renderNode).join("");
}

function renderNode(node: TiptapNode): string {
  switch (node.type) {
    case "paragraph":
      return `<p>${renderInline(node)}</p>`;
    case "heading": {
      const level = (node.attrs?.level as number) ?? 1;
      return `<h${level}>${renderInline(node)}</h${level}>`;
    }
    case "bulletList":
      return `<ul>${(node.content ?? []).map(renderNode).join("")}</ul>`;
    case "orderedList":
      return `<ol>${(node.content ?? []).map(renderNode).join("")}</ol>`;
    case "listItem":
      return `<li>${(node.content ?? []).map(renderNode).join("")}</li>`;
    case "codeBlock":
      return `<pre><code>${escapeHtml(extractText(node))}</code></pre>`;
    case "blockquote":
      return `<blockquote>${(node.content ?? []).map(renderNode).join("")}</blockquote>`;
    case "hardBreak":
      return "<br>";
    case "text":
      return renderTextWithMarks(node);
    default:
      return renderInline(node);
  }
}

function renderInline(node: TiptapNode): string {
  if (!node.content) return "";
  return node.content.map(renderNode).join("");
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
