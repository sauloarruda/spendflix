'use server';

import getConfig from '@/common/config';
import getLogger from '@/common/logger';
import { validateCognitoJwtFields } from 'aws-jwt-verify/cognito-verifier';
import { Fetcher } from 'aws-jwt-verify/https';
import { Jwk, SimpleJwksCache } from 'aws-jwt-verify/jwk';
import { JwtHeader, JwtPayload } from 'aws-jwt-verify/jwt-model';
import { JwtVerifier, JwtVerifierSingleIssuer } from 'aws-jwt-verify/jwt-verifier';
import axios from 'axios';

import { InvalidAuthenticationError } from './InvalidAuthenticationError';

const logger = getLogger().child({ module: 'serverActions' });

type JwtVerifierType = JwtVerifierSingleIssuer<{
  issuer: string;
  audience: null;
  customJwtCheck: ({ payload }: { header: JwtHeader; payload: JwtPayload; jwk: Jwk }) => void;
}>;

class CustomFetcher implements Fetcher {
  instance = axios.create();

  public async fetch(uri: string) {
    return this.instance
      .get(uri, { responseType: 'arraybuffer' })
      .then((response) => response.data);
  }
}

let verifier: JwtVerifierType;
function getVerifier(): JwtVerifierType {
  if (!verifier) {
    verifier = JwtVerifier.create(
      {
        issuer: `${getConfig().COGNITO_ENDPOINT}/${getConfig().COGNITO_USER_POOL_ID}`,
        audience: null,
        customJwtCheck: ({ payload }) =>
          validateCognitoJwtFields(payload, {
            tokenUse: 'access',
            clientId: getConfig().COGNITO_CLIENT_ID,
          }),
      },
      {
        jwksCache: new SimpleJwksCache({
          fetcher: new CustomFetcher(),
        }),
      },
    );
  }
  return verifier;
}

async function checkToken(token: string | undefined): Promise<JwtPayload> {
  if (!token) throw new InvalidAuthenticationError('No token found');
  const payload = await getVerifier().verify(token);
  return payload;
}

async function authorizeAction<T>(
  authorization: string | undefined,
  action: (tokenPayload: JwtPayload | undefined) => Promise<T>,
): Promise<T> {
  logger.debug({ authorization }, 'Check authorization');
  if (!authorization) {
    logger.warn({}, 'No authorization found');
    throw new InvalidAuthenticationError('Authorization not found');
  }
  try {
    const tokenPayload = await checkToken(authorization);
    return action(tokenPayload);
  } catch (error) {
    logger.warn({ error }, 'Invalid authorization');
    throw new InvalidAuthenticationError('Invalid authorization', error);
  }
}

export { authorizeAction, checkToken };
