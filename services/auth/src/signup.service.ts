import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  UsernameExistsException,
  ResendConfirmationCodeCommand,
  AdminGetUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import onboardingRepository from './repository/onboarding';
import { logger } from '../lib/logger';

const authLogger = logger.child({ module: 'auth' });

const cognitoClient = new CognitoIdentityProviderClient({
  endpoint: process.env.IS_OFFLINE ? 'http://localhost:9229' : undefined,
});

export interface ConfirmResult {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiresIn: number;
}

export const signup = async (name: string, email: string) => {
  authLogger.info({ name, email }, 'Starting signup process');

  try {
    authLogger.info('Saving onboarding step 1');
    const onboarding = await onboardingRepository.saveStep1(name, email);
    authLogger.info('Onboarding step 1 saved successfully');

    try {
      authLogger.info(
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
      authLogger.info({ res }, 'Cognito signup successful');
      return res;
    } catch (err) {
      authLogger.error({ err }, 'Error during Cognito signup');

      if (err instanceof UsernameExistsException) {
        authLogger.info('Username exists, checking user status');
        const user = await cognitoClient.send(
          new AdminGetUserCommand({
            Username: email,
            UserPoolId: process.env.COGNITO_USER_POOL_ID!,
          }),
        );
        authLogger.info({ user }, 'User status');

        if (user.Enabled) {
          authLogger.info('User is already confirmed');
          throw new UsernameExistsException({
            message: 'User already confirmed',
            $metadata: {},
          });
        }

        authLogger.info('Resending confirmation code');
        await cognitoClient.send(
          new ResendConfirmationCodeCommand({
            ClientId: process.env.COGNITO_CLIENT_ID!,
            Username: email,
          }),
        );
        return { message: 'Confirmation code resent' };
      }

      authLogger.info('Deleting temporary password due to error');
      await onboardingRepository.deleteTempPassword(email);
      throw err;
    }
  } catch (err) {
    authLogger.error({ err }, 'Error in signup process');
    throw err;
  }
};

export const confirm = async (email: string, code: string): Promise<ConfirmResult> => {
  const password = await onboardingRepository.getTempPassword(email);
  if (!password) throw new Error('No pending signup for this email');

  await cognitoClient.send(
    new ConfirmSignUpCommand({
      ClientId: process.env.COGNITO_CLIENT_ID!,
      Username: email,
      ConfirmationCode: code,
    }),
  );

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

  const result = authResp.AuthenticationResult!;
  await onboardingRepository.deleteTempPassword(email);

  return {
    accessToken: result.AccessToken!,
    refreshToken: result.RefreshToken!,
    idToken: result.IdToken!,
    expiresIn: result.ExpiresIn || 3600, // the cognito-local doesn't return the expiresIn
  };
};
