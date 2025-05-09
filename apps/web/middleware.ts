// import getLogger from '@/common/logger';
import getLogger from '@/common/logger';
import { JwtVerifier } from 'aws-jwt-verify';
import { validateCognitoJwtFields } from 'aws-jwt-verify/cognito-verifier';
import { Jwk } from 'aws-jwt-verify/jwk';
import { JwtHeader, JwtPayload } from 'aws-jwt-verify/jwt-model';
import { JwtVerifierSingleIssuer } from 'aws-jwt-verify/jwt-verifier';
import { cookies } from 'next/headers';
import { NextResponse, NextRequest } from 'next/server';

const logger = getLogger().child({ module: 'middleware' });

type JwtVerifierType = JwtVerifierSingleIssuer<{
  issuer: string;
  audience: null;
  customJwtCheck: ({ payload }: { header: JwtHeader; payload: JwtPayload; jwk: Jwk }) => void;
}>;
// eslint-disable-next-line no-restricted-syntax
let verifier: JwtVerifierType;
function getVerifier(): JwtVerifierType {
  if (!verifier) {
    verifier = JwtVerifier.create({
      issuer: `${process.env.COGNITO_ENDPOINT}/${process.env.COGNITO_USER_POOL_ID}`,
      audience: null,
      customJwtCheck: ({ payload }) =>
        validateCognitoJwtFields(payload, {
          tokenUse: 'access',
          clientId: process.env.COGNITO_CLIENT_ID,
        }),
    });
  }
  return verifier;
}

async function checkToken(token: string) {
  try {
    const payload = await getVerifier().verify(token);
    logger.debug({ payload }, 'Decoded JWT');
  } catch (error) {
    logger.error({ error }, 'Error verifying token:');
    throw error;
  }
}

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  if (request.method !== 'POST') return NextResponse.next();
  logger.info(
    { pathname: request.nextUrl.pathname, method: request.method },
    'Running middleware...',
  );
  const path = request.nextUrl.pathname;
  if (path === '/onboarding/step1') return NextResponse.next();

  const cookie = (await cookies()).get('session')?.value;
  if (!cookie) {
    logger.debug('No cookie found');
    return Response.json({ success: false, message: 'session cookie not found' }, { status: 401 });
  }
  try {
    await checkToken(cookie);
  } catch (error) {
    logger.debug({ error }, 'Invalid session');
    return Response.json({ success: false, message: 'invalid session' }, { status: 401 });
  }
  return NextResponse.next();
}
