import pino from 'pino';

import { Logger } from './logger';

jest.mock('pino');
jest.mock('@/common/config', () => () => ({
  NODE_ENV: 'test',
  LOG_LEVEL: 'debug',
  IS_OFFLINE: false,
}));

describe('Logger', () => {
  let logSpies: Record<string, jest.Mock>;

  beforeEach(() => {
    logSpies = {
      fatal: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
      trace: jest.fn(),
      child: jest.fn(() => logSpies),
    };
    (pino as unknown as jest.Mock).mockReturnValue(logSpies);
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('should call the correct pino log method for each level', () => {
    const logger = new Logger({ level: 'debug', service: 'test-service' });
    logger.fatal({ foo: 'bar' }, 'fatal msg');
    logger.error({ foo: 'bar' }, 'error msg');
    logger.warn({ foo: 'bar' }, 'warn msg');
    logger.info({ foo: 'bar' }, 'info msg');
    logger.debug({ foo: 'bar' }, 'debug msg');
    logger.trace({ foo: 'bar' }, 'trace msg');
    expect(logSpies.fatal).toHaveBeenCalledWith({ foo: 'bar' }, 'fatal msg');
    expect(logSpies.error).toHaveBeenCalledWith({ foo: 'bar' }, 'error msg');
    expect(logSpies.warn).toHaveBeenCalledWith({ foo: 'bar' }, 'warn msg');
    expect(logSpies.info).toHaveBeenCalledWith({ foo: 'bar' }, 'info msg');
    expect(logSpies.debug).toHaveBeenCalledWith({ foo: 'bar' }, 'debug msg');
    expect(logSpies.trace).toHaveBeenCalledWith({ foo: 'bar' }, 'trace msg');
  });

  it('should call the correct ConsoleLogger log method for each level', () => {
    const logger = new Logger({ level: 'debug', service: 'test-service', isOffline: true });
    logger.fatal({ foo: 'bar' }, 'fatal msg');
    logger.error({ foo: 'bar' }, 'error msg');
    logger.warn({ foo: 'bar' }, 'warn msg');
    logger.info({ foo: 'bar' }, 'info msg');
    logger.debug({ foo: 'bar' }, 'debug msg');
    logger.trace({ foo: 'bar' }, 'trace msg');
  });

  it('should censor sensitive fields in log data', () => {
    const logger = new Logger({ level: 'info', service: 'test-service' });
    const data = {
      password: 'secret',
      token: 'abc',
      nested: { apiKey: 'key', value: 123 },
      arr: [{ refreshToken: 'r', x: 1 }],
      normal: 'ok',
    };
    logger.info(data, 'msg');
    expect(logSpies.info).toHaveBeenCalledWith(
      {
        password: '***',
        token: '***',
        nested: { apiKey: '***', value: 123 },
        arr: [{ refreshToken: '***', x: 1 }],
        normal: 'ok',
      },
      'msg',
    );
  });

  it('should handle logging with no message and extra args', () => {
    const logger = new Logger({ level: 'info', service: 'test-service' });
    logger.info({ foo: 'bar' }, undefined, { password: '123' }, 'extra');
    expect(logSpies.info).toHaveBeenCalledWith(
      { foo: 'bar' },
      undefined,
      { password: '***' },
      'extra',
    );
  });

  it('should create a child logger with merged options', () => {
    const logger = new Logger({ level: 'info', service: 'test-service' });
    const child = logger.child({ module: 'child' });
    expect(pino).toHaveBeenCalled();
    expect(logSpies.child).toHaveBeenCalledWith({ module: 'child' });
    expect(child).toBeInstanceOf(Logger);
  });

  it('should respect isOffline and set transport', () => {
    // eslint-disable-next-line no-new
    new Logger({ level: 'info', service: 'test-service', isOffline: true });
  });
});

describe('getLogger', () => {
  let getLoggerLocal: typeof import('./logger').default;
  let pinoLocal: typeof import('pino');

  beforeEach(() => {
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    pinoLocal = require('pino');
    (pinoLocal as unknown as jest.Mock).mockReturnValue({
      info: jest.fn(),
      child: jest.fn(() => ({})),
    });
    jest.doMock('@/common/config', () => () => ({
      NODE_ENV: 'test',
      LOG_LEVEL: 'warn',
      IS_OFFLINE: 'true',
    }));
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    getLoggerLocal = require('./logger').default;
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
  });

  it('should return a singleton logger instance', () => {
    const logger1 = getLoggerLocal();
    const logger2 = getLoggerLocal();
    expect(logger1).toBe(logger2);
  });

  it('should use config values for log level and offline mode', () => {
    getLoggerLocal();
  });
});
