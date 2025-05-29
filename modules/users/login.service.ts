import { User } from '@/prisma';
import { InitiateAuthCommandOutput } from '@aws-sdk/client-cognito-identity-provider';

import cognito from './cognito';
import userService from './user.service';
import { UserTokens } from './userTokens';

async function updateUser(email: string, authResp: InitiateAuthCommandOutput): Promise<User> {
  let user = await userService.findByEmail(email);
  const userResp = await cognito.getUserFromToken(authResp.AuthenticationResult?.AccessToken ?? '');
  const cognitoId = userResp.UserAttributes?.find((attr) => attr.Name === 'sub')?.Value;
  const name = userResp.UserAttributes?.find((attr) => attr.Name === 'name')?.Value;

  if (!user ?? user.cognitoId !== cognitoId) {
    user = await userService.upsertUser({
      ...user,
      email,
      name,
      cognitoId,
    });
  }
  return user;
}

const DEFAULT_EXPIRES_IN = 3600;
async function login(email: string, password: string): Promise<UserTokens> {
  const authResp = await cognito.initiateAuth(email, password);
  const user = await updateUser(email, authResp);

  const result = authResp.AuthenticationResult!;
  return {
    accessToken: result.AccessToken!,
    refreshToken: result.RefreshToken!,
    idToken: result.IdToken!,
    // the cognito-local doesn't return the expiresIn
    expiresIn: result.ExpiresIn ?? DEFAULT_EXPIRES_IN,
    sub: user.id.toString(),
  };
}

async function forgotPassword(email: string): Promise<void> {
  await cognito.forgotPassword(email);
}

async function resetPassword(email: string, code: string, password: string): Promise<void> {
  await cognito.resetPassword(email, code, password);
}

const loginService = {
  login,
  forgotPassword,
  resetPassword,
};

export default loginService;
