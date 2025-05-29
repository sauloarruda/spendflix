'use client';

import { useRouter } from 'next/navigation';

import ResumeOnboarding from '@/components/onboarding/ResumeOnboarding';
import { useOnboarding } from '@/contexts/OnboardingContext';

export default function Home() {
  const router = useRouter();
  const { onboardingData } = useOnboarding();
  if (onboardingData && onboardingData.step && onboardingData.step > 1) {
    router.push(`/onboarding/step${onboardingData.step}`);
  } else {
    router.push('/onboarding/step1');
  }

  return (
    <ResumeOnboarding>
      <div className="flex flex-col items-center justify-center">
        <strong className="mb-4">Redirecionando...</strong>
        <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </ResumeOnboarding>
  );
}
