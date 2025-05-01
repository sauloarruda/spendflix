import express, { Router } from 'express';
import { CognitoIdentityProviderServiceException } from '@aws-sdk/client-cognito-identity-provider';
import { logger } from '../../lib/logger';
import { signup, confirm } from '../service/signup.service';
import onboardingRepository from '../repository/onboarding';

const authLogger = logger.child({ module: 'auth' });

const authRouter: Router = express.Router();
export default authRouter;

const cognitoErrorToHttpStatus = (error: unknown) => {
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
    const result = await signup(name, email);
    authLogger.info({ result }, 'Signup successful');
    return res.status(201).end();
  } catch (error) {
    authLogger.error({ error }, 'Signup error');
    const { status, errorMessage } = cognitoErrorToHttpStatus(error);
    authLogger.info({ status, errorMessage }, 'Returning error response');
    return res.status(status).json({
      message: 'Failed to create user',
      error: errorMessage,
    });
  }
});

authRouter.post('/confirm', async (req, res) => {
  authLogger.info({ body: req.body }, 'Received confirmation request');
  const { email, code } = req.body;
  try {
    const tokens = await confirm(email, code);
    authLogger.info({ email }, 'Confirmation successful');
    await onboardingRepository.deleteTempPassword(email);
    return res.status(200).json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      idToken: tokens.idToken,
      expiresIn: tokens.expiresIn,
    });
  } catch (error) {
    authLogger.error({ error }, 'Confirmation error');
    const { status, errorMessage } = cognitoErrorToHttpStatus(error);
    authLogger.info({ status, errorMessage }, 'Returning error response');
    return res.status(status).json({
      message: 'Failed to confirm user',
      error: errorMessage,
    });
  }
});
