import pino from 'pino';

type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

interface LoggerOptions {
  service: string;
  level?: LogLevel;
  isOffline?: boolean;
}

class Logger {
  private logger: pino.Logger;

  constructor(options: LoggerOptions) {
    const { service, level = 'info', isOffline = false } = options;

    this.logger = pino({
      level,
      transport: isOffline
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
            },
          }
        : undefined,
      base: {
        service,
        environment: process.env.NODE_ENV || 'development',
      },
    });
  }

  fatal(obj: unknown, msg?: string, ...args: unknown[]): void {
    this.logger.fatal(obj, msg, ...args);
  }

  error(obj: unknown, msg?: string, ...args: unknown[]): void {
    this.logger.error(obj, msg, ...args);
  }

  warn(obj: unknown, msg?: string, ...args: unknown[]): void {
    this.logger.warn(obj, msg, ...args);
  }

  info(obj: unknown, msg?: string, ...args: unknown[]): void {
    this.logger.info(obj, msg, ...args);
  }

  debug(obj: unknown, msg?: string, ...args: unknown[]): void {
    this.logger.debug(obj, msg, ...args);
  }

  trace(obj: unknown, msg?: string, ...args: unknown[]): void {
    this.logger.trace(obj, msg, ...args);
  }

  child(bindings: Record<string, unknown>): Logger {
    const childLogger = new Logger({
      service: this.logger.bindings().service as string,
      level: this.logger.level as LogLevel,
      isOffline: process.env.IS_OFFLINE === 'true' || process.env.NODE_ENV === 'test',
    });
    childLogger.logger = this.logger.child(bindings);
    return childLogger;
  }
}

export const createLogger = (options: LoggerOptions): Logger => {
  return new Logger(options);
};

// Default logger instance
export const logger = createLogger({
  service: 'spendflix-auth',
  level: (process.env.LOG_LEVEL as LogLevel) || process.env.IS_OFFLINE ? 'debug' : 'info',
  isOffline: process.env.IS_OFFLINE === 'true' || process.env.NODE_ENV === 'test',
});
