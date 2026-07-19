"use client";
import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { SyntaxHighlighter, SUPPORTED_LANGUAGES } from "@/lib/syntaxHighlighterLanguages";
import { detectContentType, guessLanguage, type ViewMode } from "@/lib/textDetection";

const MODES: { value: ViewMode; label: string }[] = [
  { value: "plain", label: "Plain Text" },
  { value: "markdown", label: "Markdown" },
  { value: "code", label: "Code" },
];

// Fenced code blocks inside markdown render through the same Prism instance
// used in Code mode. Falls back to a plain <code> block if the language
// isn't in our registered set (avoids Prism warnings / unstyled output).
const markdownComponents: Components = {
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || "");
    const lang = match?.[1];
    const codeText = String(children).replace(/\n$/, "");

    const isBlock = Boolean(match); // fenced blocks carry a language-xxx className; inline code doesn't
    if (!isBlock) {
      return (
        <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono" {...props}>
          {children}
        </code>
      );
    }

    if (lang && SUPPORTED_LANGUAGES.includes(lang)) {
      return (
        <SyntaxHighlighter
          language={lang}
          style={oneDark}
          customStyle={{ margin: "0.5rem 0", borderRadius: "0.5rem", fontSize: "0.8125rem" }}
          wrapLongLines
        >
          {codeText}
        </SyntaxHighlighter>
      );
    }

    // Unsupported or missing language — graceful plain fallback, no crash.
    return (
      <pre className="rounded-lg bg-muted p-3 overflow-x-auto text-sm font-mono">
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
    <div className="rounded-lg border overflow-hidden">
      <div className="flex items-center justify-between border-b px-3 py-2 bg-muted/40">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {MODES.map((m) => (
              <button
                key={m.value}
                onClick={() => setMode(m.value)}
                className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                  mode === m.value
                    ? "bg-background border font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          {mode === detected && (
            <span className="text-xs text-muted-foreground hidden sm:inline">Auto-detected</span>
          )}
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <div className="max-h-[500px] overflow-auto">
        {mode === "plain" && (
          <pre className="p-4 whitespace-pre-wrap break-words text-sm font-mono">{text}</pre>
        )}

        {mode === "markdown" && (
          <div className="p-4 prose prose-sm prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={markdownComponents}>
              {text}
            </ReactMarkdown>
          </div>
        )}

        {mode === "code" && (
          <SyntaxHighlighter
            language={language}
            style={oneDark}
            customStyle={{ margin: 0, borderRadius: 0, fontSize: "0.8125rem" }}
            wrapLongLines
          >
            {text}
          </SyntaxHighlighter>
        )}
      </div>
    </div>
  );
}