'use client';

import { OnboardingData } from '@/modules/users';
import { useRouter } from 'next/navigation';

import ResumeOnboarding from '@/components/ResumeOnboarding';

export default function Home() {
  const router = useRouter();
  function handleFetchOnboarding(onboarding: OnboardingData) {
    router.push(`/onboarding/step${onboarding.step}`);
  }

  function handleError() {
    router.push('/onboarding/step1');
  }

  return (
    <ResumeOnboarding
      message="Preparando pra começar..."
      onResume={handleFetchOnboarding}
      onError={handleError}
    >
      <div className="flex flex-col items-center justify-center">
        <strong className="mb-4">Redirecionando...</strong>
        <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </ResumeOnboarding>
  );
}
