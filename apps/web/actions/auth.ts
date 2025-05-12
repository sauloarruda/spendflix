'use server';

import { loginService, signupService, UserTokens } from '@/modules/users';
import { cookies } from 'next/headers';

import { User } from '@/prisma';

async function signup(name: string, email: string): Promise<User> {
  return signupService.signup(name, email);
}

async function setAuthCookie(tokens: UserTokens) {
  const cookieStore = await cookies();
  cookieStore.set('session', tokens.accessToken);
}

async function confirm(email: string, code: string): Promise<void> {
  const tokens = await signupService.confirm(email, code);
  await setAuthCookie(tokens);
}

async function login(email: string, password: string): Promise<void> {
  const tokens = await loginService.login(email, password);
  await setAuthCookie(tokens);
}

export { signup, confirm, login };
