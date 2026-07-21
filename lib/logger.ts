/**
 * Minimal centralized logger.
 * Verbose in development, silent for debug/info in production;
 * warnings and errors are always logged.
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

/**
 * Wraps an API route handler with request timing and error logging.
 * Provider-agnostic: writes via the same logger, so swapping to a real
 * observability backend later only means changing logger.ts internals.
 */
export function withRequestLogging<Args extends unknown[]>(
  routeName: string,
  handler: (...args: Args) => Promise<Response>,
) {
  return async (...args: Args): Promise<Response> => {
    const start = Date.now();

    try {
      const res = await handler(...args);

      logger.info(`${routeName} completed`, {
        status: res.status,
        ms: Date.now() - start,
      });

      return res;
    } catch (err) {
      logger.error(`${routeName} threw`, err);
      throw err;
    }
  };
}
