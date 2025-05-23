import { OnboardingData } from '@/modules/users';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { getOnboardingAction } from '@/actions/onboarding';
import LoadingForm from '@/components/utils/LoadingForm';
import { hasSessionCookie } from 'utils/auth';

interface ResumeOnboardingProps {
  message: string;
  children?: React.ReactNode;
  onResume?: (onboarding: OnboardingData, userId: number) => void;
  onError?: (error: Error, onboardingUid: string | null) => void;
}

export default function ResumeOnboarding({
  message,
  children,
  onResume,
  onError,
}: ResumeOnboardingProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  async function handleError(error: Error, uid: string | null) {
    if (onError) onError(error, uid);
    else router.push('/401');
  }

  async function handleLoading() {
    if (!loading) return;
    const uid = localStorage.getItem('onboardingUid');

    if (!hasSessionCookie()) {
      const error = new Error('Session cookie not found');
      handleError(error, uid);
      return;
    }

    if (!uid) {
      const error = new Error('onboardingUid not found');
      handleError(error, uid);
      return;
    }

    try {
      const onboarding = await getOnboardingAction(uid);
      if (!onboarding) {
        handleError(new Error('Onboarding not found'), uid);
      } else if (onResume) onResume(onboarding.data as OnboardingData, onboarding.userId!);
    } catch (error) {
      handleError(error as Error, uid);
    }
    setLoading(false);
  }

  return (
    <LoadingForm message={message} onLoad={handleLoading}>
      {children}
    </LoadingForm>
  );
}
