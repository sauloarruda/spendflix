'use server';

import { signupService } from '@/modules/users';
import { cookies } from 'next/headers';

import { User } from '@/prisma';

async function signup(name: string, email: string): Promise<User> {
  return signupService.signup(name, email);
}

async function confirm(email: string, code: string): Promise<void> {
  const tokens = await signupService.confirm(email, code);
  const cookieStore = await cookies();
  cookieStore.set('session', tokens.accessToken);
}

export { signup, confirm };
