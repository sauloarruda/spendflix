import getLogger from '@/common/logger';
import { NextResponse, NextRequest } from 'next/server';

const logger = getLogger().child({ module: 'middleware' });

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  if (request.method !== 'POST') return NextResponse.next();
  const params = await request.json();
  logger.info({ path: request.nextUrl.pathname, method: request.method, params }, 'Request');
  return NextResponse.next();
}
