import express from 'express';
import { CognitoIdentityProviderServiceException } from '@aws-sdk/client-cognito-identity-provider';
import { signup, confirm } from './signup.service';
import onboardingRepository from './repository/onboarding';

const authRouter = express.Router();
export default authRouter;

const cognitoErrorToHttpStatus = (error: unknown) => {
  if (error instanceof CognitoIdentityProviderServiceException)
    return { status: 400, errorMessage: error.name };
  return { status: 500, errorMessage: (error as Error).toString() };
};

authRouter.post('/signup', async (req, res) => {
  const { name, email } = req.body;

  try {
    await signup(name, email);
    return res.status(201).end();
  } catch (error) {
    const { status, errorMessage } = cognitoErrorToHttpStatus(error);
    return res.status(status).json({
      message: 'Failed to create user',
      error: errorMessage,
    });
  }
});

authRouter.post('/confirm', async (req, res) => {
  const { email, code } = req.body;
  try {
    const tokens = await confirm(email, code);
    await onboardingRepository.deleteTempPassword(email);
    return res.status(200).json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      idToken: tokens.idToken,
      expiresIn: tokens.expiresIn,
    });
  } catch (error) {
    const { status, errorMessage } = cognitoErrorToHttpStatus(error);
    return res.status(status).json({
      message: 'Failed to confirm user',
      error: errorMessage,
    });
  }
});
