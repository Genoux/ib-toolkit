export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogContext = Record<string, unknown>;

export type LogSink = (level: LogLevel, message: string, context: LogContext) => void;

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

const jsonConsoleSink: LogSink = (level, message, context) => {
  // biome-ignore lint/suspicious/noConsole: the logger is the single sanctioned console writer
  console[level](JSON.stringify({ level, message, ...context }));
};

function serializeError(error: unknown): LogContext {
  if (error instanceof Error) {
    return { error: { name: error.name, message: error.message, stack: error.stack } };
  }
  return error === undefined ? {} : { error: String(error) };
}

export type Logger = {
  debug: (message: string, context?: LogContext) => void;
  info: (message: string, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  error: (message: string, error?: unknown, context?: LogContext) => void;
  child: (bindings: LogContext) => Logger;
};

export type LoggerOptions = {
  level?: LogLevel;
  bindings?: LogContext;
  sinks?: LogSink[];
};

/**
 * Structured JSON logger. Log ids, never emails or names: stdout is shipped to Vercel,
 * Sentry and any configured drain.
 */
export function createLogger({
  level = "info",
  bindings = {},
  sinks = [jsonConsoleSink],
}: LoggerOptions = {}): Logger {
  const write = (at: LogLevel, message: string, context: LogContext) => {
    if (LEVEL_ORDER[at] < LEVEL_ORDER[level]) return;
    const merged = { ...bindings, ...context };
    for (const sink of sinks) sink(at, message, merged);
  };

  return {
    debug: (message, context = {}) => write("debug", message, context),
    info: (message, context = {}) => write("info", message, context),
    warn: (message, context = {}) => write("warn", message, context),
    error: (message, error, context = {}) =>
      write("error", message, { ...context, ...serializeError(error) }),
    child: (extra) => createLogger({ level, sinks, bindings: { ...bindings, ...extra } }),
  };
}
