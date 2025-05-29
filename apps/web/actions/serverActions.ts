import getConfig from '@/common/config';
import getLogger from '@/common/logger';
import { validateCognitoJwtFields } from 'aws-jwt-verify/cognito-verifier';
import { Jwk } from 'aws-jwt-verify/jwk';
import { JwtHeader, JwtPayload } from 'aws-jwt-verify/jwt-model';
import { JwtVerifier, JwtVerifierSingleIssuer } from 'aws-jwt-verify/jwt-verifier';

const logger = getLogger().child({ module: 'serverActions' });

export class InvalidAuthenticationError extends Error {
  cause: Error;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.cause = cause as Error;
  }
}

type JwtVerifierType = JwtVerifierSingleIssuer<{
  issuer: string;
  audience: null;
  customJwtCheck: ({ payload }: { header: JwtHeader; payload: JwtPayload; jwk: Jwk }) => void;
}>;

let verifier: JwtVerifierType;
function getVerifier(): JwtVerifierType {
  if (!verifier) {
    verifier = JwtVerifier.create({
      issuer: `${getConfig().COGNITO_ENDPOINT}/${getConfig().COGNITO_USER_POOL_ID}`,
      audience: null,
      customJwtCheck: ({ payload }) =>
        validateCognitoJwtFields(payload, {
          tokenUse: 'access',
          clientId: getConfig().COGNITO_CLIENT_ID,
        }),
    });
  }
  return verifier;
}

async function checkToken(token: string) {
  const payload = await getVerifier().verify(token);
  return payload;
}
async function autorizeAction<T>(
  authorization: string | undefined,
  action: (tokenPayload: JwtPayload | undefined) => Promise<T>,
): Promise<T> {
  if (!authorization) {
    logger.warn({}, 'No authorization found');
    throw new InvalidAuthenticationError('Authorization not found');
  }
  try {
    const tokenPayload = await checkToken(authorization);
    return action(tokenPayload);
  } catch (error) {
    logger.debug({ error }, 'Invalid authorization');
    throw new InvalidAuthenticationError('Invalid authorization', error);
  }
}

export { autorizeAction, checkToken };
