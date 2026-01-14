/**
 * Structured logging system
 * For production, integrate with services like Vercel Analytics or Sentry
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

type LogContext = {
  userId?: string
  clinicId?: string
  requestId?: string
  [key: string]: any
}

class Logger {
  private minLevel: LogLevel
  private context: LogContext = {}

  constructor(minLevel: LogLevel = LogLevel.INFO) {
    this.minLevel = process.env.NODE_ENV === "development" ? LogLevel.DEBUG : minLevel
  }

  setContext(context: LogContext) {
    this.context = { ...this.context, ...context }
  }

  clearContext() {
    this.context = {}
  }

  private log(level: LogLevel, message: string, data?: any) {
    if (level < this.minLevel) {
      return
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      message,
      ...this.context,
      ...(data && { data }),
    }

    // In production, send to logging service
    if (process.env.NODE_ENV === "production") {
      this.sendToLoggingService(logEntry)
    }

    // Console output for development
    const consoleMethod = level === LogLevel.ERROR ? "error" : level === LogLevel.WARN ? "warn" : "log"
    console[consoleMethod](JSON.stringify(logEntry, null, 2))
  }

  debug(message: string, data?: any) {
    this.log(LogLevel.DEBUG, message, data)
  }

  info(message: string, data?: any) {
    this.log(LogLevel.INFO, message, data)
  }

  warn(message: string, data?: any) {
    this.log(LogLevel.WARN, message, data)
  }

  error(message: string, error?: Error | any, data?: any) {
    this.log(LogLevel.ERROR, message, {
      error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
      ...data,
    })
  }

  private sendToLoggingService(logEntry: any) {
    // Send logs to Vercel Analytics or external service like Sentry
    if (typeof window === "undefined") {
      // Server-side logging
      // Use Vercel's built-in logging or send to external service
      try {
        // For Sentry integration:
        // if (logEntry.level === 'ERROR') {
        //   Sentry.captureException(logEntry.data?.error || new Error(logEntry.message), {
        //     level: 'error',
        //     extra: logEntry.data,
        //     tags: {
        //       userId: logEntry.userId,
        //       clinicId: logEntry.clinicId,
        //     },
        //   })
        // }
        // For custom logging endpoint:
        // fetch('/api/logs', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(logEntry),
        // }).catch(() => {}) // Silent fail for logging
      } catch (error) {
        // Silent fail for logging service errors
        console.error("Failed to send log to service:", error)
      }
    }
  }
}

// Singleton instance
const logger = new Logger()

export default logger

/**
 * Create logger with specific context
 */
export function createLogger(context: LogContext): Logger {
  const contextLogger = new Logger()
  contextLogger.setContext(context)
  return contextLogger
}
