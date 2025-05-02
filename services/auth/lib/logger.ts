import pino from 'pino';

type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

interface LoggerOptions {
  service: string;
  level?: LogLevel;
  isOffline?: boolean;
}

// List of sensitive field names to censor
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'apiKey',
  'secret',
  'authorization',
  'auth',
  'credentials',
  'key',
];

// Utility function to censor sensitive data
const censorSensitiveData = (data: unknown): unknown => {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => censorSensitiveData(item));
  }

  if (typeof data === 'object') {
    return Object.fromEntries(
      Object.entries(data as Record<string, unknown>).map(([key, value]) => [
        key,
        SENSITIVE_FIELDS.some((field) => key.toLowerCase().includes(field.toLowerCase()))
          ? '***'
          : censorSensitiveData(value),
      ]),
    );
  }

  return data;
};

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

  private prepareLogData(
    obj: unknown,
    msg?: string,
    ...args: unknown[]
  ): [unknown, string | undefined, unknown[]] {
    const censoredObj = censorSensitiveData(obj);
    return [censoredObj, msg, args.map((arg) => censorSensitiveData(arg))];
  }

  fatal(obj: unknown, msg?: string, ...args: unknown[]): void {
    const [censoredObj, censoredMsg, censoredArgs] = this.prepareLogData(obj, msg, ...args);
    this.logger.fatal(censoredObj, censoredMsg, ...censoredArgs);
  }

  error(obj: unknown, msg?: string, ...args: unknown[]): void {
    const [censoredObj, censoredMsg, censoredArgs] = this.prepareLogData(obj, msg, ...args);
    this.logger.error(censoredObj, censoredMsg, ...censoredArgs);
  }

  warn(obj: unknown, msg?: string, ...args: unknown[]): void {
    const [censoredObj, censoredMsg, censoredArgs] = this.prepareLogData(obj, msg, ...args);
    this.logger.warn(censoredObj, censoredMsg, ...censoredArgs);
  }

  info(obj: unknown, msg?: string, ...args: unknown[]): void {
    const [censoredObj, censoredMsg, censoredArgs] = this.prepareLogData(obj, msg, ...args);
    this.logger.info(censoredObj, censoredMsg, ...censoredArgs);
  }

  debug(obj: unknown, msg?: string, ...args: unknown[]): void {
    const [censoredObj, censoredMsg, censoredArgs] = this.prepareLogData(obj, msg, ...args);
    this.logger.debug(censoredObj, censoredMsg, ...censoredArgs);
  }

  trace(obj: unknown, msg?: string, ...args: unknown[]): void {
    const [censoredObj, censoredMsg, censoredArgs] = this.prepareLogData(obj, msg, ...args);
    this.logger.trace(censoredObj, censoredMsg, ...censoredArgs);
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
  isOffline: process.env.IS_OFFLINE === 'true',
});
