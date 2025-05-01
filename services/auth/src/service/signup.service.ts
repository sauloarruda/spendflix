import { UsernameExistsException } from '@aws-sdk/client-cognito-identity-provider';
import onboardingRepository from '../repository/onboarding';
import { logger } from '../../lib/logger';
import cognito from './cognito';

const authLogger = logger.child({ module: 'auth' });

export interface ConfirmResult {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiresIn: number;
}

export const signup = async (name: string, email: string): Promise<void> => {
  authLogger.debug({ name, email }, 'Starting signup process');

  try {
    const onboarding = await onboardingRepository.saveStep1(name, email);
    try {
      await cognito.signUpCommand(email, name, onboarding);
    } catch (error) {
      if (error instanceof UsernameExistsException) {
        authLogger.info('Username exists, checking user status');
        const user = await cognito.getUserStatus(email);
        authLogger.debug({ user }, 'User status');

        if (user.UserStatus === 'CONFIRMED') {
          authLogger.warn('User is already confirmed');
          throw new UsernameExistsException({
            message: 'User already confirmed',
            $metadata: { httpStatusCode: 400 },
          });
        } else if (user.UserStatus === 'UNCONFIRMED') {
          authLogger.info('User unconfirmed => Resending confirmation code');
          await cognito.resendConfirmation(email);
          return;
        }
      }

      authLogger.debug('Deleting temporary password due to error');
      await onboardingRepository.deleteTempPassword(email);
      authLogger.error({ err: error }, 'Error during Cognito signup');
      throw error;
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

    await cognito.confirmSignUp(email, code);
    const authResp = await cognito.initiateAuth(email, password);

    const result = authResp.AuthenticationResult!;
    authLogger.debug({ email }, 'Deleting temporary password');
    await onboardingRepository.deleteTempPassword(email);

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
