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
  const onboarding = await onboardingRepository.saveStep1(name, email);

  try {
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
    return res;
  } catch (err) {
    if (err instanceof UsernameExistsException) {
      const user = await cognitoClient.send(
        new AdminGetUserCommand({
          Username: email,
          UserPoolId: process.env.COGNITO_USER_POOL_ID!,
        }),
      );
      if (user.Enabled) {
        throw new UsernameExistsException({
          message: 'User already confirmed',
          $metadata: {},
        });
      }
      await cognitoClient.send(
        new ResendConfirmationCodeCommand({
          ClientId: process.env.COGNITO_CLIENT_ID!,
          Username: email,
        }),
      );
      return { message: 'Confirmation code resent' };
    }
    await onboardingRepository.deleteTempPassword(email);
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
