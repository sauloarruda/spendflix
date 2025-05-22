'use server';

import { loginService, onboardingService, signupService, UserTokens } from '@/modules/users';
import { cookies } from 'next/headers';

import { Onboarding, User } from '@/prisma';

async function signupAction(name: string, email: string): Promise<User> {
  return signupService.signup(name, email);
}

async function setAuthCookie(tokens: UserTokens) {
  const cookieStore = await cookies();
  cookieStore.set('session', tokens.accessToken);
}

async function confirmAction(email: string, code: string): Promise<User> {
  const { tokens, user } = await signupService.confirm(email, code);
  await setAuthCookie(tokens);
  return user;
}

async function loginAction(email: string, password: string): Promise<void> {
  const tokens = await loginService.login(email, password);
  await setAuthCookie(tokens);
}

async function onboardingLoginAction(onboardingUid: string): Promise<Onboarding> {
  const onboarding = await onboardingService.find(onboardingUid);
  if (!onboarding.userId) throw new Error('Invalid parameters');

  const user = await signupService.findUser(onboarding.userId);
  if (!user.temporaryPassword) throw new Error('Invalid user');
  const tokens = await loginService.login(user.email, user.temporaryPassword!);
  await setAuthCookie(tokens);
  return onboarding;
}

async function forgotPasswordAction(email: string): Promise<void> {
  await loginService.forgotPassword(email);
}

async function resetPasswordAction(email: string, code: string, password: string): Promise<void> {
  await loginService.resetPassword(email, code, password);
}

export {
  signupAction,
  confirmAction,
  loginAction,
  forgotPasswordAction,
  resetPasswordAction,
  onboardingLoginAction,
};
