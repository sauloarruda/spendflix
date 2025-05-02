import type { AWS } from '@serverless/typescript';

const serverlessConfiguration: AWS = {
  service: 'spendflix-auth',
  frameworkVersion: '4',
  plugins: ['serverless-offline'],
  custom: {
    'serverless-offline': {
      httpPort: 4000,
      lambdaPort: 4002,
    },
  },
  provider: {
    name: 'aws',
    runtime: 'nodejs20.x',
    region: 'us-east-2',
    stage: '${opt:stage, "local"}',
    memorySize: 128,
    architecture: 'x86_64',
    timeout: 29,
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
      COGNITO_USER_POOL_ID: '${env:COGNITO_USER_POOL_ID}',
      COGNITO_CLIENT_ID: '${env:COGNITO_CLIENT_ID}',
      BASE_APP_URL: '${env:BASE_APP_URL}',
      ENCRYPTION_SECRET: '${env:ENCRYPTION_SECRET}',
      DATABASE_URL: '${env:DATABASE_URL}',
    },
    iamRoleStatements: [
      {
        Effect: 'Allow',
        Action: [
          'cognito-idp:SignUp',
          'cognito-idp:ConfirmSignUp',
          'cognito-idp:InitiateAuth',
          'cognito-idp:AdminGetUser',
        ],
        Resource: '*',
      },
    ],
  },
  functions: {
    api: {
      handler: 'src/lambda.handler',
      events: [
        {
          http: {
            path: 'auth/{proxy+}',
            method: 'any',
            cors: true,
          },
        },
        {
          http: {
            path: 'onboarding/{proxy+}',
            method: 'any',
            cors: true,
          },
        },
        {
          http: {
            path: 'docs',
            method: 'get',
          },
        },
        {
          http: {
            path: 'docs/openapi.yaml',
            method: 'get',
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
    ],
  },
};

module.exports = serverlessConfiguration;
