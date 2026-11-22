import { useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";

interface MarkdownViewProps {
  content: string;
  className?: string;
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="my-3 rounded-[var(--radius-md)] border-hairline bg-[var(--bg-canvas)] overflow-hidden shadow-2xs">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--bg-subtle)] border-b-hairline text-[11px] font-mono text-[var(--text-tertiary)] select-none">
        <span className="uppercase tracking-wider font-semibold text-[var(--accent)]">
          {language || "code"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-[var(--text-primary)] transition-colors py-0.5 px-1.5 rounded hover:bg-[var(--bg-surface)]"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check size={12} className="text-[var(--status-success)]" />
              <span className="text-[10px] text-[var(--status-success)]">Copied</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span className="text-[10px]">Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto text-xs font-mono leading-relaxed text-[var(--text-primary)]">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function renderInline(text: string): ReactNode[] {
  // Parse inline code, bold, italic, links
  const parts: ReactNode[] = [];
  let remaining = text;
  let keyIndex = 0;

  // Regex for inline code: `code`
  // bold: **bold**
  // italic: *italic*
  // link: [title](url)
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(remaining)) !== null) {
    if (match.index > lastIndex) {
      parts.push(remaining.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(
        <code
          key={keyIndex++}
          className="px-1.5 py-0.5 rounded-[var(--radius-xs)] font-mono text-[11px] bg-[var(--bg-subtle)] text-[var(--accent)] border border-[var(--border-hairline)] font-medium"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(
        <strong key={keyIndex++} className="font-semibold text-[var(--text-primary)]">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("*") && token.endsWith("*")) {
      parts.push(
        <em key={keyIndex++} className="italic text-[var(--text-primary)]">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith("[") && token.includes("](")) {
      const closeBracket = token.indexOf("]");
      const linkText = token.slice(1, closeBracket);
      const linkUrl = token.slice(closeBracket + 2, -1);
      parts.push(
        <a
          key={keyIndex++}
          href={linkUrl}
          target="_blank"
          rel="noreferrer"
          className="text-[var(--accent)] hover:underline inline-flex items-center gap-1 font-medium"
        >
          {linkText}
        </a>
      );
    }
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < remaining.length) {
    parts.push(remaining.substring(lastIndex));
  }

  return parts;
}

export function MarkdownView({ content, className = "" }: MarkdownViewProps) {
  if (!content) return null;

  // Split by code blocks first
  const blocks: (
    | { type: "code"; code: string; language: string }
    | { type: "text"; text: string }
  )[] = [];

  const codeBlockRegex = /```([a-zA-Z0-9_\-#+.]*)\n([\s\S]*?)```/g;
  let lastPos = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastPos) {
      blocks.push({
        type: "text",
        text: content.substring(lastPos, match.index),
      });
    }
    blocks.push({
      type: "code",
      language: match[1].trim(),
      code: match[2].trimEnd(),
    });
    lastPos = codeBlockRegex.lastIndex;
  }

  if (lastPos < content.length) {
    blocks.push({
      type: "text",
      text: content.substring(lastPos),
    });
  }

  return (
    <div className={`space-y-3 leading-relaxed text-xs text-[var(--text-primary)] select-text ${className}`}>
      {blocks.map((block, idx) => {
        if (block.type === "code") {
          return <CodeBlock key={idx} code={block.code} language={block.language} />;
        }

        // Parse paragraphs, lists, headers
        const lines = block.text.split("\n");
        const elements: ReactNode[] = [];
        let listItems: string[] = [];
        let isOrdered = false;

        function flushList(key: number) {
          if (listItems.length > 0) {
            elements.push(
              isOrdered ? (
                <ol key={`ol-${key}`} className="list-decimal pl-5 space-y-1 my-2 text-xs">
                  {listItems.map((li, i) => (
                    <li key={i} className="leading-relaxed">
                      {renderInline(li)}
                    </li>
                  ))}
                </ol>
              ) : (
                <ul key={`ul-${key}`} className="list-disc pl-5 space-y-1 my-2 text-xs">
                  {listItems.map((li, i) => (
                    <li key={i} className="leading-relaxed">
                      {renderInline(li)}
                    </li>
                  ))}
                </ul>
              )
            );
            listItems = [];
          }
        }

        lines.forEach((line, lineIdx) => {
          const trimmed = line.trim();

          // Header: #, ##, ###
          if (trimmed.startsWith("### ")) {
            flushList(lineIdx);
            elements.push(
              <h4 key={lineIdx} className="font-semibold text-sm text-[var(--text-primary)] mt-3 mb-1">
                {renderInline(trimmed.substring(4))}
              </h4>
            );
          } else if (trimmed.startsWith("## ")) {
            flushList(lineIdx);
            elements.push(
              <h3 key={lineIdx} className="font-serif text-base text-[var(--text-primary)] mt-4 mb-1.5 font-medium">
                {renderInline(trimmed.substring(3))}
              </h3>
            );
          } else if (trimmed.startsWith("# ")) {
            flushList(lineIdx);
            elements.push(
              <h2 key={lineIdx} className="font-serif text-lg text-[var(--text-primary)] mt-4 mb-2 font-medium">
                {renderInline(trimmed.substring(2))}
              </h2>
            );
          }
          // Blockquote: >
          else if (trimmed.startsWith("> ")) {
            flushList(lineIdx);
            elements.push(
              <blockquote
                key={lineIdx}
                className="border-l-2 border-[var(--accent)] pl-3 py-1 my-2 text-[var(--text-secondary)] italic bg-[var(--bg-subtle)]/50 rounded-r"
              >
                {renderInline(trimmed.substring(2))}
              </blockquote>
            );
          }
          // Unordered list item: - or *
          else if (/^[-*]\s+/.test(trimmed)) {
            if (isOrdered) {
              flushList(lineIdx);
            }
            isOrdered = false;
            listItems.push(trimmed.replace(/^[-*]\s+/, ""));
          }
          // Ordered list item: 1.
          else if (/^\d+\.\s+/.test(trimmed)) {
            if (!isOrdered && listItems.length > 0) {
              flushList(lineIdx);
            }
            isOrdered = true;
            listItems.push(trimmed.replace(/^\d+\.\s+/, ""));
          }
          // Normal text line
          else if (trimmed.length > 0) {
            flushList(lineIdx);
            elements.push(
              <p key={lineIdx} className="leading-relaxed">
                {renderInline(trimmed)}
              </p>
            );
          } else {
            flushList(lineIdx);
          }
        });

        flushList(lines.length);

        return <div key={idx} className="space-y-2">{elements}</div>;
      })}
    </div>
  );
}
