'use server';
import { signupService } from '@/modules/users';
import { User } from '@/prisma';
import { cookies } from 'next/headers';

async function signup(name: string, email: string): Promise<User> {
  return await signupService.signup(name, email);
}

async function confirm(email: string, code: string): Promise<void> {
  const tokens = await signupService.confirm(email, code);
  const cookieStore = await cookies();
  cookieStore.set('session', tokens.accessToken);
}

export { signup, confirm };
