'use client';

import { OnboardingData } from '@/modules/users';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState, useCallback } from 'react';

import { onboardingLoginAction } from '@/actions/auth';
import { updateOnboardingAction } from '@/actions/onboarding';
import { checkToken } from '@/actions/serverActions';
import OnboardingContext from '@/contexts/OnboardingContext';
import { getSessionCookie } from '@/utils/cookie';

interface ResumeOnboardingProps {
  children: React.ReactNode;
}

async function checkSessionCookie(uid: string): Promise<boolean> {
  let session = getSessionCookie();
  if (!session) {
    try {
      await onboardingLoginAction(uid);
      session = getSessionCookie();
    } catch {
      return false;
    }
  }
  if (!session) return false;
  try {
    await checkToken(session);
    return true;
  } catch {
    try {
      await onboardingLoginAction(uid);
      session = getSessionCookie();
      if (!session) return false;
      await checkToken(session);
      return true;
    } catch {
      return false;
    }
  }
}

export default function ResumeOnboarding({ children }: ResumeOnboardingProps) {
  const router = useRouter();
  const [isLoadingOnboarding, setIsLoadingOnboarding] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);
  const [onboardingUid, setOnboardingUid] = useState<string | null>(null);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);

  useEffect(() => {
    async function restoreOnboarding() {
      setIsLoadingOnboarding(true);
      try {
        const uid = localStorage.getItem('onboardingUid');
        setOnboardingUid(uid);
        if (!uid) {
          router.replace('/onboarding/step1');
          return;
        }
        const sessionValid = await checkSessionCookie(uid);
        if (!sessionValid) {
          router.replace('/onboarding/step1?error=401');
          return;
        }
        const res = await fetch(`/api/onboardings/${uid}`);
        if (!res.ok) {
          if (res.status === 404) {
            router.replace('/onboarding/step1?error=404');
            return;
          }
          throw new Error('Failed to fetch onboarding');
        }
        const onboarding = await res.json();
        if (!onboarding || !onboarding.data) {
          router.replace('/onboarding/step1?error=404');
          return;
        }
        if (!onboarding.userId) {
          router.replace('/onboarding/step1?error=403');
          return;
        }
        setUserId(onboarding.userId);
        setOnboardingData(onboarding.data as OnboardingData);
      } catch {
        throw new Error(
          'Ocorreu um erro ao restaurar seu cadastro. Tente novamente ou entre em contato com o suporte.',
        );
      } finally {
        setIsLoadingOnboarding(false);
      }
    }
    restoreOnboarding();
  }, [router]);

  const updateOnboarding = useCallback(
    async (data: Partial<OnboardingData>) => {
      if (!onboardingUid) return;
      await updateOnboardingAction(onboardingUid, data);
      setOnboardingData((prev: OnboardingData | null) => ({ ...prev, ...data }));
    },
    [onboardingUid],
  );

  const finishOnboarding = useCallback(async () => {
    if (!onboardingUid) return;
    await updateOnboardingAction(onboardingUid, {
      finishedAt: new Date().toISOString(),
    });
    localStorage.removeItem('onboardingUid');
    router.replace('/');
  }, [onboardingUid, router]);

  if (isLoadingOnboarding) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <strong className="mb-4">Retomando de onde você parou...</strong>
        <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <OnboardingContext
      value={{ isLoadingOnboarding, userId, onboardingData, updateOnboarding, finishOnboarding }}
    >
      {children}
    </OnboardingContext>
  );
}
