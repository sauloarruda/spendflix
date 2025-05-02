import express, { Router } from 'express';
import { CognitoIdentityProviderServiceException } from '@aws-sdk/client-cognito-identity-provider';
import signupService from '../service/signup.service';
import getLogger from '../../lib/logger';

const authLogger = getLogger().child({ module: 'auth' });

const authRouter: Router = express.Router();
export default authRouter;

const errorToHttpStatus = (error: unknown) => {
  authLogger.info({ error }, 'Converting Cognito error to HTTP status');
  if (error instanceof CognitoIdentityProviderServiceException) {
    authLogger.info(
      {
        name: error.name,
        message: error.message,
        statusCode: error.$metadata?.httpStatusCode,
      },
      'Cognito service exception',
    );
    const status = error.$metadata?.httpStatusCode || 400;
    return { status, errorMessage: error.name };
  }
  authLogger.info({ error }, 'Non-Cognito error');
  if (error && typeof error === 'object' && 'name' in error) {
    return { status: 500, errorMessage: (error as Error).message };
  }
  return { status: 500, errorMessage: (error as Error).toString() };
};

authRouter.post('/signup', async (req, res) => {
  authLogger.info({ body: req.body }, 'Received signup request');
  const { name, email } = req.body;

  try {
    const result = await signupService.signup(name, email);
    authLogger.info({ result }, 'Signup successful');
    return res.status(201).json({
      onboardingUid: result.onboardingUid,
    });
  } catch (error) {
    authLogger.error({ error }, 'Signup error');
    const { status, errorMessage } = errorToHttpStatus(error);
    authLogger.info({ status, errorMessage }, 'Returning error response');
    return res.status(status).json({
      message: 'Failed to create user',
      error: errorMessage,
    });
  }
});

authRouter.post('/confirm', async (req, res) => {
  authLogger.info({ body: req.body }, 'Received confirmation request');
  const { email, code, onboardingUid } = req.body;
  try {
    const tokens = await signupService.confirm(email, code, onboardingUid);
    authLogger.info({ email }, 'Confirmation successful');
    return res.status(200).json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      idToken: tokens.idToken,
      expiresIn: tokens.expiresIn,
    });
  } catch (error) {
    authLogger.error({ error }, 'Confirmation error');
    const { status, errorMessage } = errorToHttpStatus(error);
    authLogger.info({ status, errorMessage }, 'Returning error response');
    return res.status(status).json({
      message: 'Failed to confirm user',
      error: errorMessage,
    });
  }
});
