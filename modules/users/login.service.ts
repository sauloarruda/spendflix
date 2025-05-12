import { InitiateAuthCommandOutput } from '@aws-sdk/client-cognito-identity-provider';
import cognito from './cognito';
import userRepository from './user.repository';
import { UserTokens } from './userTokens';

async function updateUser(email: string, authResp: InitiateAuthCommandOutput): Promise<void> {
  const user = await userRepository.findByEmail(email);
  const userResp = await cognito.getUserFromToken(authResp.AuthenticationResult?.AccessToken || '');
  const cognitoId = userResp.UserAttributes?.find((attr) => attr.Name === 'sub')?.Value;
  if (!user) {
    await userRepository.upsertUser({
      email: email,
      name: userResp.UserAttributes?.find((attr) => attr.Name === 'name')?.Value,
      cognitoId: cognitoId,
    });
  } else {
    if (user.cognitoId !== cognitoId)
      await userRepository.upsertUser({
        ...user,
        cognitoId: userResp.UserAttributes?.find((attr) => attr.Name === 'sub')?.Value,
      });
  }
}

async function login(email: string, password: string): Promise<UserTokens> {
  const authResp = await cognito.initiateAuth(email, password);
  await updateUser(email, authResp);

  const result = authResp.AuthenticationResult!;
  return {
    accessToken: result.AccessToken!,
    refreshToken: result.RefreshToken!,
    idToken: result.IdToken!,
    expiresIn: result.ExpiresIn || 3600, // the cognito-local doesn't return the expiresIn
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
