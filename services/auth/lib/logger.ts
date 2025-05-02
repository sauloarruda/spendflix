import pino from 'pino';
import getConfig from './config';

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

  private isOffline: boolean;

  private level: LogLevel;

  constructor(options: LoggerOptions) {
    const { service, level = 'info', isOffline = false } = options;
    this.isOffline = isOffline || false;
    this.level = level;

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
        environment: getConfig().NODE_ENV,
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
      level: this.level,
      isOffline: this.isOffline,
    });
    childLogger.logger = this.logger.child(bindings);
    return childLogger;
  }
}

let logger: Logger;

export default function getLogger() {
  if (!logger)
    logger = new Logger({
      service: 'spendflix-auth',
      level: getConfig().LOG_LEVEL as LogLevel,
      isOffline: getConfig().IS_OFFLINE === 'true',
    });
  return logger;
}
