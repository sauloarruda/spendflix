import type { AWS } from '@serverless/typescript';

const serverlessConfiguration: AWS = {
  org: 'sauloarrudasandbox',
  app: 'spendflix',
  service: 'auth',
  frameworkVersion: '4',
  plugins: ['serverless-offline'],
  provider: {
    name: 'aws',
    runtime: 'nodejs20.x',
    region: 'us-east-2',
    environment: {
      COGNITO_USER_POOL_ID: '${env:COGNITO_USER_POOL_ID}',
    },
    iamRoleStatements: [
      {
        Effect: 'Allow',
        Action: ['cognito-idp:AdminCreateUser'],
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
  package: { individually: true },
};

module.exports = serverlessConfiguration;
