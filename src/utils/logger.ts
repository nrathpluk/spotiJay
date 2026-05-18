export type LogLevel = "info" | "warn" | "error";

export interface Logger {
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}

export function createLogger(requestId: string): Logger {
  const write = (level: LogLevel, message: string, context: Record<string, unknown> = {}) => {
    console.log(JSON.stringify({
      level,
      message,
      timestamp: new Date().toISOString(),
      requestId,
      ...context,
    }));
  };

  return {
    info: (message, context) => write("info", message, context),
    warn: (message, context) => write("warn", message, context),
    error: (message, context) => write("error", message, context),
  };
}
