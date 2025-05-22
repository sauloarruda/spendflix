// import getLogger from '@/common/logger';
import getConfig from '@/common/config';
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
  try {
    const payload = await getVerifier().verify(token);
    // logger.debug({ payload }, 'Decoded JWT');
    return payload;
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
  if (
    path === '/onboarding/step1' ||
    path === '/forgot-password' ||
    path === '/login' ||
    path === '/401'
  ) {
    return NextResponse.next();
  }
  const cookie = (await cookies()).get('session')?.value;
  if (!cookie) {
    logger.warn({}, 'No cookie found');
    return NextResponse.redirect(new URL('/401', request.url));
  }
  try {
    await checkToken(cookie);
  } catch (error) {
    logger.debug({ error }, 'Invalid session');
    return NextResponse.redirect(new URL('/401', request.url));
  }
  return NextResponse.next();
}
