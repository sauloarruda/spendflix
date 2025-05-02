import { UsernameExistsException } from '@aws-sdk/client-cognito-identity-provider';
import userRepository from '../repository/user.repository';
import cognito from './cognito';
import onboardingRepository from '../repository/onboarding.repository';
import getLogger from '../../lib/logger';

const authLogger = getLogger().child({ module: 'signup' });

export interface ConfirmResult {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiresIn: number;
}

async function signup(name: string, email: string): Promise<{ onboardingUid: string }> {
  authLogger.debug({ name, email }, 'Starting signup process');

  try {
    const signupUser = await userRepository.startOnboarding(name, email);
    try {
      await cognito.signUpCommand(signupUser);
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
          return { onboardingUid: signupUser.onboardingUid };
        }
      }

      authLogger.debug('Deleting temporary password due to error');
      await userRepository.deleteTempPassword(email);
      authLogger.error({ error }, 'Error during Cognito signup');
      throw error;
    }
    return { onboardingUid: signupUser.onboardingUid };
  } catch (error) {
    authLogger.error({ error }, 'UnknownError in signup process');
    throw error;
  }
}

async function confirm(email: string, code: string, onboardingUid: string): Promise<ConfirmResult> {
  authLogger.info({ email }, 'Starting confirmation process');
  try {
    const password = await userRepository.getTempPassword(email);
    if (!password) {
      authLogger.error({ email }, 'No pending signup found for email');
      throw new Error('No pending signup for this email');
    }

    await cognito.confirmSignUp(email, code);
    const authResp = await cognito.initiateAuth(email, password);

    const result = authResp.AuthenticationResult!;
    await onboardingRepository.update(onboardingUid, { step: 2 });

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
}

const signupService = {
  signup,
  confirm,
};

export default signupService;
