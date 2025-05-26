import getLogger from '@/common/logger';
import { NextResponse, NextRequest } from 'next/server';

const logger = getLogger().child({ module: 'middleware' });

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  if (request.method !== 'POST') return NextResponse.next();
  let params;
  try {
    params = await request.json();
    // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  } catch (e) {
    params = {};
  }
  logger.info({ path: request.nextUrl.pathname, method: request.method, params }, 'Request');
  return NextResponse.next();
}
