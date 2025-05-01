import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  UsernameExistsException,
  ResendConfirmationCodeCommand,
  AdminGetUserCommand,
  CognitoIdentityProviderServiceException,
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
  authLogger.debug({ name, email }, 'Starting signup process');

  try {
    authLogger.debug('Saving onboarding step 1');
    const onboarding = await onboardingRepository.saveStep1(name, email);
    authLogger.debug('Onboarding step 1 saved successfully');

    try {
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
    } catch (err) {
      if (err instanceof UsernameExistsException) {
        authLogger.info('Username exists, checking user status');
        const user = await cognitoClient.send(
          new AdminGetUserCommand({
            Username: email,
            UserPoolId: process.env.COGNITO_USER_POOL_ID!,
          }),
        );
        authLogger.debug({ user }, 'User status');

        if (user.UserStatus === 'CONFIRMED') {
          authLogger.warn('User is already confirmed');
          throw new UsernameExistsException({
            message: 'User already confirmed',
            $metadata: { httpStatusCode: 400 },
          });
        } else if (user.UserStatus === 'UNCONFIRMED') {
          authLogger.info('Resending confirmation code');
          await cognitoClient.send(
            new ResendConfirmationCodeCommand({
              ClientId: process.env.COGNITO_CLIENT_ID!,
              Username: email,
            }),
          );
          return { message: 'Confirmation code resent' };
        }
      }

      // If it's a Cognito service exception, preserve its metadata
      if (err instanceof CognitoIdentityProviderServiceException) {
        throw err;
      }

      authLogger.debug('Deleting temporary password due to error');
      await onboardingRepository.deleteTempPassword(email);
      authLogger.error({ err }, 'Error during Cognito signup');
      throw err;
    }
  } catch (err) {
    authLogger.error({ err }, 'Error in signup process');
    throw err;
  }
};

export const confirm = async (email: string, code: string): Promise<ConfirmResult> => {
  authLogger.info({ email }, 'Starting confirmation process');
  try {
    const password = await onboardingRepository.getTempPassword(email);
    if (!password) {
      authLogger.error({ email }, 'No pending signup found for email');
      throw new Error('No pending signup for this email');
    }

    authLogger.info({ email }, 'Confirming signup with Cognito');
    try {
      await cognitoClient.send(
        new ConfirmSignUpCommand({
          ClientId: process.env.COGNITO_CLIENT_ID!,
          Username: email,
          ConfirmationCode: code,
        }),
      );
    } catch (error) {
      // If it's a Cognito service exception, preserve its metadata
      if (error instanceof CognitoIdentityProviderServiceException) {
        throw error;
      }
      throw error;
    }
    authLogger.info({ email }, 'Signup confirmed successfully');

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

    const result = authResp.AuthenticationResult!;
    authLogger.debug({ email }, 'Deleting temporary password');
    try {
      await onboardingRepository.deleteTempPassword(email);
    } catch (error) {
      authLogger.error({ error }, 'Error deleting temporary password');
      // Continue with success response even if deletion fails
    }

    authLogger.info({ email }, 'Confirmation process completed successfully');
    return {
      accessToken: result.AccessToken!,
      refreshToken: result.RefreshToken!,
      idToken: result.IdToken!,
      expiresIn: result.ExpiresIn || 3600, // the cognito-local doesn't return the expiresIn
    };
  } catch (error) {
    authLogger.error({ error }, 'Error in confirmation process');
    throw error;
  }
};
