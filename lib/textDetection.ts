export type ViewMode = "plain" | "markdown" | "code";

const MARKDOWN_PATTERNS = [
  /^#{1,6}\s/m,        // headers
  /\[.+?\]\(.+?\)/,    // links
  /\*\*.+?\*\*/,       // bold
  /^[-*+]\s/m,         // lists
  /^>\s/m,             // blockquotes
  /```/,               // fenced code blocks inside markdown
  /^\|.+\|$/m,         // tables
];

const CODE_PATTERNS = [
  /;\s*$/m,
  /^\s*(function|const|let|var|import|export|def|class|return|if\s*\()/m,
  /[{}[\]]/,
  /^\s{2,}\S/m,        // indentation
  /=>/,
  /^\s*#include/m,
];

/**
 * Pure heuristic — no I/O, no side effects. Designed so an explicit
 * upload-time contentType (future DB column) can simply bypass this
 * function entirely and pass a known ViewMode straight to <TextViewer />.
 */
export function detectContentType(text: string): ViewMode {
  if (!text || !text.trim()) return "plain";

  const mdScore = MARKDOWN_PATTERNS.reduce(
    (score, re) => score + (re.test(text) ? 1 : 0),
    0
  );
  const codeScore = CODE_PATTERNS.reduce(
    (score, re) => score + (re.test(text) ? 1 : 0),
    0
  );

  if (mdScore >= 2 && mdScore >= codeScore) return "markdown";
  if (codeScore >= 2) return "code";
  return "plain";
}

const LANGUAGE_HINTS: [RegExp, string][] = [
  [/^\s*(import|export|const|let|=>)/m, "typescript"],
  [/^\s*def\s+\w+\(.*\):/m, "python"],
  [/^\s*#include\s*</m, "cpp"],
  [/^\s*(SELECT|INSERT|UPDATE|DELETE)\s/im, "sql"],
  [/^\s*<\/?[a-z]+.*>/im, "markup"],
  [/^\s*\{[\s\S]*"[\w-]+":/m, "json"],
  [/^\s*(FROM|RUN|COPY)\s/m, "docker"],
];

/** Best-effort language guess for the syntax highlighter. Falls back to plain text highlighting. */
export function guessLanguage(text: string): string {
  for (const [pattern, lang] of LANGUAGE_HINTS) {
    if (pattern.test(text)) return lang;
  }
  return "text";
}