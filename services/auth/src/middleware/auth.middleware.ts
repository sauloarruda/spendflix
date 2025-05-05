import {
  CognitoIdentityProviderClient,
  GetUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { Request, Response, NextFunction } from 'express';
import getLogger from '../../lib/logger';

const authLogger = getLogger().child({ module: 'auth-middleware' });

const cognitoClient = new CognitoIdentityProviderClient();

const validateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    authLogger.warn('No authorization header provided');
    res.status(401).json({
      error: 'Unauthorized',
      message: 'No authorization token provided',
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    authLogger.warn('Invalid authorization header format');
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid authorization token format',
    });
    return;
  }

  try {
    console.log(token);
    const command = new GetUserCommand({
      AccessToken: token,
    });

    await cognitoClient.send(command);
    authLogger.debug('Token validated successfully');
    next();
  } catch (error) {
    authLogger.error({ error }, 'Token validation failed');
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  }
};

export default validateToken;
