"use client";
import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  SyntaxHighlighter,
  SUPPORTED_LANGUAGES,
} from "@/lib/syntaxHighlighterLanguages";
import {
  detectContentType,
  guessLanguage,
  type ViewMode,
} from "@/lib/textDetection";

const MODES: { value: ViewMode; label: string }[] = [
  { value: "plain", label: "Plain Text" },
  { value: "markdown", label: "Markdown" },
  { value: "code", label: "Code" },
];

const markdownComponents: Components = {
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || "");
    const lang = match?.[1];
    const codeText = String(children).replace(/\n$/, "");

    const isBlock = Boolean(match);
    if (!isBlock) {
      return (
        <code
          className="rounded-md bg-secondary/80 px-1.5 py-0.5 text-xs font-mono text-primary"
          {...props}
        >
          {children}
        </code>
      );
    }

    if (lang && SUPPORTED_LANGUAGES.includes(lang)) {
      return (
        <SyntaxHighlighter
          language={lang}
          style={oneDark}
          customStyle={{
            margin: "0.5rem 0",
            borderRadius: "0.75rem",
            fontSize: "0.8125rem",
            padding: "1rem",
          }}
          wrapLongLines
        >
          {codeText}
        </SyntaxHighlighter>
      );
    }

    return (
      <pre className="rounded-xl border border-border/80 bg-secondary/40 p-4 overflow-x-auto text-xs font-mono">
        <code {...props}>{codeText}</code>
      </pre>
    );
  },
};

export function TextViewer({ text }: { text: string }) {
  const detected = useMemo(() => detectContentType(text), [text]);
  const [mode, setMode] = useState<ViewMode>(detected);
  const language = useMemo(() => guessLanguage(text), [text]);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
      <div className="flex items-center justify-between border-b border-border/80 px-3.5 py-2.5 bg-secondary/30">
        <div className="flex items-center gap-2">
          <div
            className="flex gap-1 bg-secondary/60 p-0.5 rounded-lg"
            role="tablist"
            aria-label="Text view mode"
          >
            {MODES.map((m) => (
              <button
                key={m.value}
                role="tab"
                aria-selected={mode === m.value}
                onClick={() => setMode(m.value)}
                className={`text-xs px-2.5 py-1 rounded-md transition-all font-medium ${
                  mode === m.value
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          {mode === detected && (
            <span className="text-[11px] text-muted-foreground hidden sm:inline">
              Auto-detected
            </span>
          )}
        </div>

        <button
          onClick={handleCopy}
          className="flex h-8 items-center gap-1.5 text-xs px-2.5 rounded-lg border border-border/60 bg-card text-muted-foreground hover:text-foreground hover:bg-secondary transition-all active:scale-95"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>

      <div className="max-h-[500px] overflow-auto">
        {mode === "plain" && (
          <pre className="p-4 sm:p-5 whitespace-pre-wrap break-words text-sm font-mono text-foreground leading-relaxed">
            {text}
          </pre>
        )}

        {mode === "markdown" && (
          <div className="p-4 sm:p-5 prose prose-sm prose-invert max-w-none text-foreground leading-relaxed">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkBreaks]}
              components={markdownComponents}
            >
              {text}
            </ReactMarkdown>
          </div>
        )}

        {mode === "code" && (
          <SyntaxHighlighter
            language={language}
            style={oneDark}
            customStyle={{
              margin: 0,
              borderRadius: 0,
              fontSize: "0.8125rem",
              padding: "1.25rem",
            }}
            wrapLongLines
          >
            {text}
          </SyntaxHighlighter>
        )}
      </div>
    </div>
  );
}
