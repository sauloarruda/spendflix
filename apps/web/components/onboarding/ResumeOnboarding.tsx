'use client';

import { OnboardingData } from '@/modules/users';
import { useRouter } from 'next/navigation';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

import { onboardingLoginAction } from '@/actions/auth';
import { getOnboardingAction, updateOnboardingAction } from '@/actions/onboarding';
import { checkToken } from '@/actions/serverActions';
import { getSessionCookie } from '@/utils/cookie';

// Types

interface OnboardingContextType {
  isLoadingOnboarding: boolean;
  userId: number | null;
  onboardingData: OnboardingData | null;
  updateOnboarding: (data: Partial<OnboardingData>) => Promise<void>;
  finishOnboarding: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within ResumeOnboarding');
  return ctx;
}

interface ResumeOnboardingProps {
  children: React.ReactNode;
}

async function checkSessionCookie(uid: string): Promise<boolean> {
  let session = getSessionCookie();
  if (!session) {
    // Tenta autologin
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
    // Tenta autologin novamente se o token for inválido
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
        // TODO: trocar para chamada via API route /api/onboarding/[uid]
        const onboarding = await getOnboardingAction(uid);
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

  // Update onboarding
  const updateOnboarding = useCallback(
    async (data: Partial<OnboardingData>) => {
      if (!onboardingUid) return;
      await updateOnboardingAction(onboardingUid, data);
      // Atualiza o onboardingData local após update
      setOnboardingData((prev: OnboardingData | null) => ({ ...prev, ...data }));
    },
    [onboardingUid],
  );

  // Finish onboarding
  const finishOnboarding = useCallback(async () => {
    if (!onboardingUid) return;
    await updateOnboardingAction(onboardingUid, {
      step: 999,
      finishedAt: new Date().toISOString(),
    });
    localStorage.removeItem('onboardingUid');
    router.replace('/');
  }, [onboardingUid, router]);

  // Loading UI
  if (isLoadingOnboarding) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <strong className="mb-4">Retomando de onde você parou...</strong>
        <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Provide context to children
  return (
    <OnboardingContext.Provider
      value={{ isLoadingOnboarding, userId, onboardingData, updateOnboarding, finishOnboarding }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}
