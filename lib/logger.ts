/**
 * Minimal centralized logger. Verbose in development, silent for
 * info/debug in production; errors and warnings always surface
 * (Vercel captures stdout/stderr in function logs regardless of env).
 */

type LogFields = Record<string, unknown>;

const isProd = process.env.NODE_ENV === "production";

function format(level: string, message: string, fields?: LogFields) {
  const base = `[${level}] ${message}`;
  return fields ? `${base} ${JSON.stringify(fields)}` : base;
}

export const logger = {
  debug(message: string, fields?: LogFields) {
    if (isProd) return;
    console.debug(format("debug", message, fields));
  },
  info(message: string, fields?: LogFields) {
    if (isProd) return;
    console.info(format("info", message, fields));
  },
  warn(message: string, fields?: LogFields) {
    console.warn(format("warn", message, fields));
  },
  error(message: string, err?: unknown) {
    const detail = err instanceof Error ? err.message : err;
    console.error(format("error", message, detail ? { detail } : undefined));
  },
};
