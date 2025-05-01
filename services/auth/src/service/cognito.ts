import {
  AdminGetUserCommand,
  CognitoIdentityProviderClient,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  ResendConfirmationCodeCommand,
  SignUpCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { logger } from '../../lib/logger';
import { Onboarding } from '../repository/onboarding';

const authLogger = logger.child({ module: 'auth' });

const cognitoClient = new CognitoIdentityProviderClient({
  endpoint: process.env.IS_OFFLINE ? 'http://localhost:9229' : undefined,
});

async function signUpCommand(email: string, name: string, onboarding: Onboarding) {
  authLogger.debug(
    {
      clientId: process.env.COGNITO_CLIENT_ID,
      username: email,
      userAttributes: [
        { Name: 'email', Value: email },
        { Name: 'name', Value: name },
        { Name: 'nickname', Value: name },
      ],
    },
    'Attempting Cognito signup',
  );

  const res = await cognitoClient.send(
    new SignUpCommand({
      ClientId: process.env.COGNITO_CLIENT_ID!,
      Username: email,
      Password: onboarding.temporaryPassword,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'name', Value: name },
        { Name: 'nickname', Value: name },
      ],
    }),
  );
  authLogger.debug({ res }, 'Cognito signup successful');
  return res;
}

async function getUserStatus(email: string) {
  return cognitoClient.send(
    new AdminGetUserCommand({
      Username: email,
      UserPoolId: process.env.COGNITO_USER_POOL_ID!,
    }),
  );
}

async function resendConfirmation(email: string) {
  authLogger.debug({ email }, 'Resending confirmation code');
  cognitoClient.send(
    new ResendConfirmationCodeCommand({
      ClientId: process.env.COGNITO_CLIENT_ID!,
      Username: email,
    }),
  );
  authLogger.info({ email }, 'Confirmation code resent successfully');
}

async function initiateAuth(email: string, password: string) {
  authLogger.info({ email }, 'Initiating authentication with Cognito');
  const authResp = await cognitoClient.send(
    new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: process.env.COGNITO_CLIENT_ID!,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    }),
  );
  authLogger.info({ email }, 'Authentication successful');
  return authResp;
}

async function confirmSignUp(email: string, code: string) {
  authLogger.debug({ email }, 'Confirming signup with Cognito');
  await cognitoClient.send(
    new ConfirmSignUpCommand({
      ClientId: process.env.COGNITO_CLIENT_ID!,
      Username: email,
      ConfirmationCode: code,
    }),
  );
  authLogger.info({ email }, 'Signup confirmed successfully');
}

const cognito = {
  signUpCommand,
  getUserStatus,
  resendConfirmation,
  initiateAuth,
  confirmSignUp,
};

export default cognito;
