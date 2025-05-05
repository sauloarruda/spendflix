import type { AWS } from '@serverless/typescript';

const serverlessConfiguration: AWS = {
  service: 'spendflix-transactions',
  frameworkVersion: '4',
  plugins: ['serverless-offline'],
  custom: {
    'serverless-offline': {
      httpPort: 4100,
      lambdaPort: 4003,
    },
  },
  provider: {
    name: 'aws',
    runtime: 'nodejs20.x',
    region: 'us-east-2',
    stage: '${opt:stage, "local"}',
    memorySize: 256,
    architecture: 'x86_64',
    timeout: 10,
    httpApi: {
      cors: {
        allowedOrigins: ['${env:BASE_APP_URL}'],
        allowedHeaders: [
          'Content-Type',
          'Authorization',
          'X-Amz-Date',
          'X-Api-Key',
          'X-Amz-Security-Token',
          'X-Amz-User-Agent',
        ],
        allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowCredentials: true,
        maxAge: 600,
      },
    },
    environment: {
      BASE_APP_URL: '${env:BASE_APP_URL}',
      DATABASE_URL: '${env:DATABASE_URL}',
      LOG_LEVEL: '${env:LOG_LEVEL}',
    },
  },
  functions: {
    api: {
      handler: 'src/lambda.handler',
      events: [
        {
          http: {
            path: 'transactions/{proxy+}',
            method: 'any',
            cors: true,
          },
        },
      ],
    },
  },
  package: {
    individually: true,
    patterns: [
      '!node_modules/**',
      '!tests/**',
      '!coverage/**',
      '!.turbo/**',
      '!.serverless/**',
      '!**/*.test.ts',
      '!**/*.spec.ts',
      'openapi.yaml',
      'node_modules/.prisma/**',
      'node_modules/@prisma/client/**',
      'node_modules/prisma/**',
      'generated/**',
    ],
  },
};

module.exports = serverlessConfiguration;
