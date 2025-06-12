/* eslint-disable no-console */
// eslint-disable-next-line max-classes-per-file
import chalk from 'chalk';
import pino from 'pino';
import { omit } from 'underscore';

type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

interface ILoggerOptions {
  service?: string;
  level?: LogLevel;
  isOffline?: boolean;
  module?: string;
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

// eslint-disable-next-line max-lines-per-function
const censorSensitiveData = (data: unknown): unknown => {
  if (!data) {
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
        SENSITIVE_FIELDS.some((field) => key.toLowerCase() === field.toLowerCase())
          ? '***'
          : censorSensitiveData(value),
      ]),
    );
  }

  return data;
};

class ConsoleLogger {
  private LoggerLevel = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

  private level: number;

  public bindings: ILoggerOptions;

  public constructor(bindings: ILoggerOptions = {}) {
    this.bindings = bindings;
    this.level = this.LoggerLevel.indexOf('debug');
    if (bindings.level) {
      this.level = this.LoggerLevel.indexOf(bindings.level) ?? this.level;
    }
  }

  public child(options: ILoggerOptions = {}) {
    return new ConsoleLogger({ ...this.bindings, ...options });
  }

  // eslint-disable-next-line max-params
  private log(level: string, obj: unknown, msg: string | undefined, ...args: unknown[]) {
    if (this.LoggerLevel.indexOf(level) < this.level) return;
    const levelStr = this.bindings.module
      ? [chalk.magenta(`[${this.bindings.module}]`), level].join(' ')
      : level;
    const bindingsObj = omit(this.bindings, ['module', 'level', 'isOffline']);
    const otherArgs = Object.keys(bindingsObj) ? { ...bindingsObj, ...args } : { ...args };
    if (msg) console.log(levelStr, msg, obj, otherArgs);
    else console.log(levelStr, obj, bindingsObj, otherArgs);
  }

  public trace(obj: unknown, msg: string | undefined, ...args: unknown[]) {
    this.log('trace', obj, msg, ...args);
  }

  public debug(obj: unknown, msg: string | undefined, ...args: unknown[]) {
    this.log('debug', obj, msg, ...args);
  }

  public info(obj: unknown, msg: string | undefined, ...args: unknown[]) {
    this.log('info', obj, msg, ...args);
  }

  public warn(obj: unknown, msg: string | undefined, ...args: unknown[]) {
    this.log('warn', obj, msg, ...args);
  }

  public error(obj: unknown, msg: string | undefined, ...args: unknown[]) {
    this.log('error', obj, msg, ...args);
  }

  public fatal(obj: unknown, msg: string | undefined, ...args: unknown[]) {
    this.log('fatal', obj, msg, ...args);
  }
}

export class Logger {
  public bindings: ILoggerOptions;

  private logger: pino.Logger | ConsoleLogger;

  private isOffline: boolean;

  private level: LogLevel;

  constructor(options: ILoggerOptions) {
    this.bindings = options;
    const { service, level = 'info', isOffline = false } = options;
    this.isOffline = isOffline ?? false;
    this.level = level;

    if (this.isOffline) this.logger = new ConsoleLogger(options);
    else {
      this.logger = pino({
        level,
        base: {
          service,
          environment: process.env.NODE_ENV,
        },
      });
    }
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

  child(options: ILoggerOptions): Logger {
    const childLogger = new Logger({
      service: this.bindings.service as string,
      level: this.level,
      isOffline: this.isOffline,
    });
    childLogger.logger = this.logger.child(options);
    return childLogger;
  }
}

let logger: Logger;

export default function getLogger() {
  if (!logger) {
    logger = new Logger({
      level: (process.env.LOG_LEVEL || 'debug') as LogLevel,
      isOffline: process.env.IS_OFFLINE ? Boolean(process.env.IS_OFFLINE) : false,
    });
  }
  return logger;
}
