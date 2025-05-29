import { Readable } from 'stream';

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { sdkStreamMixin } from '@aws-sdk/util-stream-node';
import { mockClient } from 'aws-sdk-client-mock';

import s3Service from './s3';

// Mock config and logger
jest.mock('./config', () => () => ({
  S3_BUCKET: 'test-bucket',
  S3_REGION: 'us-east-1',
  S3_KEY: 'test-key',
  S3_SECRET: 'test-secret',
}));

jest.mock('./logger', () => () => ({
  child: () => ({ debug: jest.fn(), info: jest.fn(), error: jest.fn() }),
  debug: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
}));

const s3Mock = mockClient(S3Client);

describe('s3Service', () => {
  beforeEach(() => {
    s3Mock.reset();
    jest.clearAllMocks();
  });

  describe('upload', () => {
    it('uploads a file to S3', async () => {
      s3Mock.on(PutObjectCommand).resolves({});
      const file = {
        arrayBuffer: async () => Buffer.from('test-content'),
        type: 'text/plain',
      };
      await expect(s3Service.upload('test-key', file)).resolves.toBeUndefined();
      expect(s3Mock.calls()).toHaveLength(1);
      const call = s3Mock.call(0);
      expect(call.args[0].input).toMatchObject({
        Bucket: 'test-bucket',
        Key: 'test-key',
        ContentType: 'text/plain',
      });
      if ('Body' in call.args[0].input) {
        expect(call.args[0].input.Body).toBeInstanceOf(Buffer);
      }
    });
  });

  describe('get', () => {
    it('gets a file from S3 and returns its content as string', async () => {
      const content = 'hello world';
      const stream = new Readable();
      stream.push(content);
      stream.push(null);
      s3Mock.on(GetObjectCommand).resolves({ Body: sdkStreamMixin(stream) });
      await expect(s3Service.get('test-key')).resolves.toBe(content);
    });

    it('throws if S3 returns empty Body', async () => {
      s3Mock.on(GetObjectCommand).resolves({});
      await expect(s3Service.get('test-key')).rejects.toThrow('Empty response from S3');
    });
  });

  describe('config errors', () => {
    it('throws if S3_BUCKET is missing', async () => {
      jest.resetModules();
      jest.doMock('./config', () => () => ({
        S3_REGION: 'us-east-1',
        S3_KEY: 'test-key',
        S3_SECRET: 'test-secret',
      }));
      await expect(async () => (await import('./s3')).default).rejects.toThrow(
        'S3_BUCKET environment variable is not set',
      );
      jest.dontMock('./config');
    });
    it('throws if S3_REGION is missing', async () => {
      jest.resetModules();
      jest.doMock('./config', () => () => ({
        S3_BUCKET: 'test-bucket',
        S3_KEY: 'test-key',
        S3_SECRET: 'test-secret',
      }));
      await expect(async () => (await import('./s3')).default).rejects.toThrow(
        'S3_REGION environment variable is not set',
      );
      jest.dontMock('./config');
    });
    it('throws if S3_REGION format is invalid', async () => {
      jest.resetModules();
      jest.doMock('./config', () => () => ({
        S3_BUCKET: 'test-bucket',
        S3_REGION: 'invalid-region',
        S3_KEY: 'test-key',
        S3_SECRET: 'test-secret',
      }));
      await expect(async () => (await import('./s3')).default).rejects.toThrow(
        'Invalid AWS region format: invalid-region. Expected format: us-east-1, us-west-2, etc.',
      );
      jest.dontMock('./config');
    });
  });
});
