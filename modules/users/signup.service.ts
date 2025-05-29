import { User } from '@/prisma';
import { UsernameExistsException } from '@aws-sdk/client-cognito-identity-provider';

import { decrypt } from '@/common/encryption';
import getLogger from '@/common/logger';
import getPrisma from '@/common/prisma';

import cognito from './cognito';
import userService from './user.service';
import { UserTokens } from './userTokens';

const logger = getLogger().child({ module: 'signup' });
const DEFAULT_TOKEN_EXPIRATION = 3600; // Default expiration time in seconds

async function handleConfirmedUser(): Promise<never> {
  logger.warn('User is already confirmed');
  throw new UsernameExistsException({
    message: 'User already confirmed',
    $metadata: { httpStatusCode: 400 },
  });
}

async function handleUnconfirmedUser(email: string, signupUser: User): Promise<User> {
  logger.info('User unconfirmed => Resending confirmation code');
  await cognito.resendConfirmation(email);
  return signupUser;
}

async function handleGenericSignupError(error: Error, email: string): Promise<never> {
  logger.debug('Deleting temporary password due to error');
  await userService.deleteTempPassword(email);
  logger.error({ error }, 'Error during Cognito signup');
  throw error;
}

async function handleUserExistsException(
  error: Error | UsernameExistsException,
  email: string,
  signupUser: User,
): Promise<User> {
  if (error instanceof UsernameExistsException) {
    logger.info('Username exists, checking user status');
    const user = await cognito.getUserStatus(email);
    logger.debug({ user }, 'User status');

    if (user.UserStatus === 'CONFIRMED') {
      return handleConfirmedUser();
    }
    if (user.UserStatus === 'UNCONFIRMED') {
      return handleUnconfirmedUser(email, signupUser);
    }
  }

  return handleGenericSignupError(error, email);
}

async function performCognitoSignup(signupUser: User, email: string): Promise<User> {
  try {
    await cognito.signUpCommand(signupUser);
    return signupUser;
  } catch (error) {
    return handleUserExistsException(error as Error, email, signupUser);
  }
}

async function signup(name: string, email: string): Promise<User> {
  logger.debug({ name, email }, 'Starting signup process');

  try {
    const signupUser = await userService.startOnboarding(name, email);
    return performCognitoSignup(signupUser, email);
  } catch (error) {
    logger.error({ error }, 'UnknownError in signup process');
    throw error;
  }
}

async function verifyPasswordAndConfirm(email: string, code: string): Promise<UserTokens> {
  const password = await userService.getTempPassword(email);
  if (!password) {
    logger.error({ email }, 'No pending signup found for email');
    throw new Error('No pending signup for this email');
  }

  await cognito.confirmSignUp(email, code);
  return authenticate(email, password);
}

async function authenticate(email: string, password: string): Promise<UserTokens> {
  const authResp = await cognito.initiateAuth(email, password);
  const result = authResp.AuthenticationResult!;

  return {
    accessToken: result.AccessToken!,
    refreshToken: result.RefreshToken!,
    idToken: result.IdToken!,
    expiresIn: result.ExpiresIn ?? DEFAULT_TOKEN_EXPIRATION,
    sub: '',
  };
}

async function confirm(email: string, code: string): Promise<{ tokens: UserTokens; user: User }> {
  logger.info({ email }, 'Starting confirmation process');
  try {
    const user = await getPrisma().user.findUnique({ where: { email } });
    if (!user) throw new Error(`User not found for email: ${email}`);
    const tokens = await verifyPasswordAndConfirm(email, code);
    logger.info({ email }, 'Confirmation process completed successfully');
    return { tokens, user };
  } catch (error) {
    logger.error({ error }, 'Error in confirmation process');
    throw error;
  }
}

async function findUser(id: number) {
  const user = await userService.find(id);
  user.temporaryPassword = decrypt(user.temporaryPassword ?? '');
  return user;
}

const signupService = {
  signup,
  confirm,
  findUser,
};

export default signupService;
