/**
 * Structured logging system for AIBox
 *
 * Provides leveled logging with colored console output and structured format.
 */

import chalk from 'chalk';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

const LOG_LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
};

const LOG_LEVEL_COLORS: Record<LogLevel, (msg: string) => string> = {
  [LogLevel.DEBUG]: chalk.gray,
  [LogLevel.INFO]: chalk.blue,
  [LogLevel.WARN]: chalk.yellow,
  [LogLevel.ERROR]: chalk.red,
};

interface LogEntry {
  level: LogLevel;
  timestamp: Date;
  message: string;
  context?: Record<string, unknown>;
}

export class Logger {
  private minLevel: LogLevel;

  constructor(minLevel: LogLevel = LogLevel.INFO) {
    this.minLevel = minLevel;
  }

  /**
   * Set the minimum log level
   */
  setLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  /**
   * Get the current minimum log level
   */
  getLevel(): LogLevel {
    return this.minLevel;
  }

  /**
   * Log a debug message
   */
  debug(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log an info message
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log an error message
   */
  error(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, context);
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    if (level < this.minLevel) {
      return;
    }

    const entry: LogEntry = {
      level,
      timestamp: new Date(),
      message,
      context,
    };

    this.output(entry);
  }

  /**
   * Output log entry to console
   */
  private output(entry: LogEntry): void {
    const levelColor = LOG_LEVEL_COLORS[entry.level];
    const levelName = LOG_LEVEL_COLORS[entry.level](`[${LOG_LEVEL_NAMES[entry.level]}]`);
    const timestamp = chalk.dim(entry.timestamp.toISOString());
    const message = `${levelName} ${timestamp} ${entry.message}`;

    console.log(message);

    if (entry.context && Object.keys(entry.context).length > 0) {
      for (const [key, value] of Object.entries(entry.context)) {
        console.log(chalk.dim(`  ${key}:`), chalk.dim(JSON.stringify(value, null, 2)));
      }
    }
  }

  /**
   * Create a child logger with additional context
   */
  child(defaultContext: Record<string, unknown>): Logger {
    const child = new Logger(this.minLevel);
    const originalLog = child.log.bind(child);
    child.log = (level: LogLevel, message: string, context?: Record<string, unknown>) => {
      const mergedContext = { ...defaultContext, ...context };
      originalLog(level, message, mergedContext);
    };
    return child;
  }
}

// Global logger instance
let globalLogger: Logger | null = null;

/**
 * Get or create the global logger instance
 */
export function getLogger(minLevel?: LogLevel): Logger {
  if (!globalLogger) {
    globalLogger = new Logger(minLevel);
  }
  return globalLogger;
}

/**
 * Set the global logger instance
 */
export function setLogger(logger: Logger): void {
  globalLogger = logger;
}

/**
 * Parse log level from string
 */
export function parseLogLevel(level: string): LogLevel {
  const upperLevel = level.toUpperCase();
  switch (upperLevel) {
    case 'DEBUG':
      return LogLevel.DEBUG;
    case 'INFO':
      return LogLevel.INFO;
    case 'WARN':
    case 'WARNING':
      return LogLevel.WARN;
    case 'ERROR':
      return LogLevel.ERROR;
    default:
      return LogLevel.INFO;
  }
}
