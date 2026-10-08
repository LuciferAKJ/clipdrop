"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Code, FileText, AlignLeft } from "lucide-react";
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

const MODES: { value: ViewMode; label: string; icon: typeof FileText }[] = [
  { value: "plain", label: "Plain Text", icon: AlignLeft },
  { value: "markdown", label: "Markdown", icon: FileText },
  { value: "code", label: "Code", icon: Code },
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
          className="rounded-md bg-secondary/80 px-1.5 py-0.5 text-xs font-mono text-primary border border-border/40"
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
            margin: "0.75rem 0",
            borderRadius: "0.75rem",
            fontSize: "0.8125rem",
            padding: "1rem",
            border: "1px solid oklch(0.24 0.03 260 / 0.7)",
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
    <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
      <div className="flex items-center justify-between border-b border-border/80 px-4 py-2.5 bg-secondary/30 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div
            className="flex gap-1 bg-secondary/70 p-1 rounded-xl border border-border/40"
            role="tablist"
            aria-label="Text view mode"
          >
            {MODES.map((m) => {
              const Icon = m.icon;
              const isSelected = mode === m.value;
              return (
                <button
                  key={m.value}
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setMode(m.value)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all font-medium ${
                    isSelected
                      ? "bg-card text-foreground shadow-xs border border-border/60"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
          {mode === detected && (
            <span className="text-[11px] font-mono text-muted-foreground hidden sm:inline bg-secondary/40 px-2 py-0.5 rounded-md border border-border/30">
              Auto-detected
            </span>
          )}
        </div>

        <button
          onClick={handleCopy}
          className="flex h-9 items-center gap-1.5 text-xs px-3 rounded-xl border border-border/70 bg-card text-muted-foreground hover:text-foreground hover:bg-secondary transition-all active:scale-95 shadow-xs"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="font-semibold text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy Note</span>
            </>
          )}
        </button>
      </div>

      <div className="max-h-[550px] overflow-auto">
        {mode === "plain" && (
          <pre className="p-4 sm:p-6 whitespace-pre-wrap break-words text-xs sm:text-sm font-mono text-foreground leading-relaxed selection:bg-primary/20">
            {text}
          </pre>
        )}

        {mode === "markdown" && (
          <div className="p-4 sm:p-6 prose prose-sm prose-invert max-w-none text-foreground leading-relaxed">
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
              background: "transparent",
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
