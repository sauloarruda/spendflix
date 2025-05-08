import {
  AdminGetUserCommand,
  CognitoIdentityProviderClient,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  ResendConfirmationCodeCommand,
  SignUpCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import getLogger from '@/common/logger';
import { decrypt } from '@/common/encryption';
import getConfig from '@/common/config';
import { User } from '@/prisma';

const authLogger = getLogger().child({ module: 'cognito' });

authLogger.info({ endpoint: getConfig().COGNITO_ENDPOINT }, 'Endpoint');
const cognitoClient = new CognitoIdentityProviderClient({
  endpoint: getConfig().COGNITO_ENDPOINT,
});

async function signUpCommand(user: User) {
  authLogger.info({ endpoint: cognitoClient.config.endpoint }, 'Client');
  const commandArgs = {
    ClientId: getConfig().COGNITO_CLIENT_ID,
    Username: user.email,
    Password: decrypt(user.temporaryPassword ?? ''),
    UserAttributes: [
      { Name: 'email', Value: user.email },
      { Name: 'name', Value: user.name },
      { Name: 'nickname', Value: user.name },
    ],
  };
  authLogger.debug(commandArgs, 'Attempting Cognito signup');

  const res = await cognitoClient.send(new SignUpCommand(commandArgs));
  authLogger.debug({ res }, 'Cognito signup successful');
  return res;
}

async function getUserStatus(email: string) {
  return cognitoClient.send(
    new AdminGetUserCommand({
      Username: email,
      UserPoolId: getConfig().COGNITO_USER_POOL_ID,
    }),
  );
}

async function resendConfirmation(email: string) {
  authLogger.debug({ email }, 'Resending confirmation code');
  cognitoClient.send(
    new ResendConfirmationCodeCommand({
      ClientId: getConfig().COGNITO_CLIENT_ID,
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
      ClientId: getConfig().COGNITO_CLIENT_ID,
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
      ClientId: getConfig().COGNITO_CLIENT_ID,
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
