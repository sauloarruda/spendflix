import getLogger from '@/common/logger';
import { JwtVerifier } from 'aws-jwt-verify';
import { validateCognitoJwtFields } from 'aws-jwt-verify/cognito-verifier';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

const logger = getLogger().child({ module: 'middleware' });

logger.debug(process.env, 'Environment variables');

const verifier = JwtVerifier.create({
  issuer: `${process.env.COGNITO_ENDPOINT}/${process.env.COGNITO_USER_POOL_ID}`,
  audience: null,
  customJwtCheck: ({ payload }) =>
    validateCognitoJwtFields(payload, {
      tokenUse: 'access',
      clientId: process.env.COGNITO_CLIENT_ID,
    }),
});

async function checkToken(token: string) {
  try {
    const payload = await verifier.verify(token);
    logger.debug({ payload }, 'Decoded JWT');
  } catch (error) {
    logger.error({ error }, 'Error verifying token:');
    throw error;
  }
}

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  if (request.method !== 'POST') return NextResponse.next();
  logger.debug('middleware', request.nextUrl.pathname, request.method);
  const path = request.nextUrl.pathname;
  if (path === '/onboarding/step1') NextResponse.next();

  const cookie = (await cookies()).get('session')?.value;
  if (!cookie) {
    logger.warn('No cookie found');
    return Response.json({ success: false, message: 'session cookie not found' }, { status: 401 });
  }
  try {
    const res = await checkToken(cookie);
  } catch (error) {
    logger.warn({ error }, 'Invalid session');
    return Response.json({ success: false, message: 'invalid session' }, { status: 401 });
  }
  return NextResponse.next();
}
