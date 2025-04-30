import type { AWS } from '@serverless/typescript';

const serverlessConfiguration: AWS = {
  service: 'spendflix-auth',
  frameworkVersion: '4',
  plugins: ['serverless-offline'],
  custom: {
    'serverless-offline': { httpPort: 4000 },
  },
  provider: {
    name: 'aws',
    runtime: 'nodejs20.x',
    region: 'us-east-2',
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
    },
    iamRoleStatements: [
      {
        Effect: 'Allow',
        Action: [
          'cognito-idp:SignUp',
          'cognito-idp:ConfirmSignUp',
          'cognito-idp:InitiateAuth',
          'dynamodb:PutItem',
          'dynamodb:GetItem',
          'dynamodb:DeleteItem',
          'dynamodb:DescribeTable',
          'dynamodb:CreateTable',
          'dynamodb:UpdateTable',
        ],
        Resource: '*',
      },
    ],
  },
  resources: {
    Resources: {
      OnboardingTable: {
        Type: 'AWS::DynamoDB::Table',
        DeletionPolicy: 'Retain',
        UpdateReplacePolicy: 'Retain',
        Properties: {
          TableName: 'onboarding',
          AttributeDefinitions: [
            {
              AttributeName: 'email',
              AttributeType: 'S',
            },
          ],
          KeySchema: [
            {
              AttributeName: 'email',
              KeyType: 'HASH',
            },
          ],
          BillingMode: 'PAY_PER_REQUEST',
          TimeToLiveSpecification: {
            AttributeName: 'ttl',
            Enabled: true,
          },
        },
      },
    },
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
