import type { AWS } from '@serverless/typescript';

const serverlessConfiguration: AWS = {
  service: 'auth',
  frameworkVersion: '4',
  plugins: ['serverless-offline'],
  custom: {
    'serverless-offline': { httpPort: 4000 },
  },
  provider: {
    name: 'aws',
    runtime: 'nodejs20.x',
    region: 'us-east-2',
    environment: {
      COGNITO_USER_POOL_ID: '${env:COGNITO_USER_POOL_ID}',
      COGNITO_CLIENT_ID: '${env:COGNITO_CLIENT_ID}',
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
        ],
        Resource: '*',
      },
    ],
  },
  resources: {
    Resources: {
      OnboardingTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: 'oboarding',
          AttributeDefinitions: [{ AttributeName: 'email', AttributeType: 'S' }],
          KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' }],
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
  package: { individually: true },
};

module.exports = serverlessConfiguration;
