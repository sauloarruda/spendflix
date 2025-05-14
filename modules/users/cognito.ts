import { User } from '@/prisma';
import {
  AdminGetUserCommand,
  AdminGetUserCommandOutput,
  CognitoIdentityProviderClient,
  ConfirmForgotPasswordCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  GetUserCommand,
  GetUserCommandOutput,
  InitiateAuthCommand,
  ResendConfirmationCodeCommand,
  SignUpCommand,
} from '@aws-sdk/client-cognito-identity-provider';

import getConfig from '@/common/config';
import { decrypt } from '@/common/encryption';
import getLogger from '@/common/logger';

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

async function getUserStatus(email: string): Promise<AdminGetUserCommandOutput> {
  return cognitoClient.send(
    new AdminGetUserCommand({
      Username: email,
      UserPoolId: getConfig().COGNITO_USER_POOL_ID,
    }),
  );
}

async function getUserFromToken(accessToken: string): Promise<GetUserCommandOutput> {
  return cognitoClient.send(
    new GetUserCommand({
      AccessToken: accessToken,
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

async function forgotPassword(email: string) {
  authLogger.debug({ email }, 'Forgot password with Cognito');
  await cognitoClient.send(
    new ForgotPasswordCommand({
      ClientId: getConfig().COGNITO_CLIENT_ID,
      Username: email,
    }),
  );
  authLogger.info({ email }, 'Password reset successfully');
}

async function resetPassword(email: string, code: string, password: string) {
  authLogger.debug({ email }, 'Resetting password with Cognito');
  await cognitoClient.send(
    new ConfirmForgotPasswordCommand({
      ClientId: getConfig().COGNITO_CLIENT_ID,
      Username: email,
      ConfirmationCode: code,
      Password: password,
    }),
  );
  authLogger.info({ email }, 'Password reset successfully');
}

const cognito = {
  signUpCommand,
  getUserStatus,
  resendConfirmation,
  initiateAuth,
  confirmSignUp,
  getUserFromToken,
  forgotPassword,
  resetPassword,
};

export default cognito;
