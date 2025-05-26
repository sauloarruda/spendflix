'use client';

import { OnboardingData } from '@/modules/users';
import { useRouter } from 'next/navigation';

import { onboardingLoginAction } from '@/actions/auth';
import ResumeOnboarding from '@/components/onboarding/ResumeOnboarding';

export default function Error401() {
  const router = useRouter();
  async function handleResumeOnboarding(
    onboarding: OnboardingData,
    userId: number,
    onboardingUid: string,
  ) {
    if (onboarding) {
      await onboardingLoginAction(onboardingUid);
      router.push(`/onboarding/step${onboarding.step || 2}`);
    }
  }

  async function handleError(error: Error, onboardingUid: string | null) {
    console.error(error);
    console.log('continue onboarding?', onboardingUid);
    if (!onboardingUid) router.push('/login');
    else {
      try {
        const onboarding = await onboardingLoginAction(onboardingUid);
        router.push(`/onboarding/step${(onboarding.data as OnboardingData).step || 1}`);
      } catch (err) {
        console.log(err);
        router.push('/login');
      }
    }
  }
  return (
    <ResumeOnboarding
      message="Carregando..."
      onResume={handleResumeOnboarding}
      onError={handleError}
    >
      <center className="mt-8">Acesso negado. Redirecionando para login...</center>
    </ResumeOnboarding>
  );
}
