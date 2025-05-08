import { UsernameExistsException } from '@aws-sdk/client-cognito-identity-provider';
import getLogger from '@/common/logger';
import userRepository from './user.repository';
import cognito from './cognito';
import { User } from '@/prisma';
import { UserTokens } from './userTokens';

const logger = getLogger().child({ module: 'signup' });

async function signup(name: string, email: string): Promise<User> {
  logger.debug({ name, email }, 'Starting signup process');

  try {
    const signupUser = await userRepository.startOnboarding(name, email);
    try {
      await cognito.signUpCommand(signupUser);
    } catch (error) {
      if (error instanceof UsernameExistsException) {
        logger.info('Username exists, checking user status');
        const user = await cognito.getUserStatus(email);
        logger.debug({ user }, 'User status');

        if (user.UserStatus === 'CONFIRMED') {
          logger.warn('User is already confirmed');
          throw new UsernameExistsException({
            message: 'User already confirmed',
            $metadata: { httpStatusCode: 400 },
          });
        } else if (user.UserStatus === 'UNCONFIRMED') {
          logger.info('User unconfirmed => Resending confirmation code');
          await cognito.resendConfirmation(email);
          return signupUser;
        }
      }

      logger.debug('Deleting temporary password due to error');
      await userRepository.deleteTempPassword(email);
      logger.error({ error }, 'Error during Cognito signup');
      throw error;
    }
    return signupUser;
  } catch (error) {
    logger.error({ error }, 'UnknownError in signup process');
    throw error;
  }
}

async function confirm(email: string, code: string): Promise<UserTokens> {
  logger.info({ email }, 'Starting confirmation process');
  try {
    const password = await userRepository.getTempPassword(email);
    if (!password) {
      logger.error({ email }, 'No pending signup found for email');
      throw new Error('No pending signup for this email');
    }

    await cognito.confirmSignUp(email, code);
    const authResp = await cognito.initiateAuth(email, password);

    const result = authResp.AuthenticationResult!;

    logger.info({ email }, 'Confirmation process completed successfully');
    return {
      accessToken: result.AccessToken!,
      refreshToken: result.RefreshToken!,
      idToken: result.IdToken!,
      expiresIn: result.ExpiresIn || 3600, // the cognito-local doesn't return the expiresIn
    };
  } catch (error) {
    logger.error({ error }, 'Error in confirmation process');
    throw error;
  }
}

const signupService = {
  signup,
  confirm,
};

export default signupService;
