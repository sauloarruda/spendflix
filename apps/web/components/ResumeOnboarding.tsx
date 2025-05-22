import { OnboardingData } from '@/modules/users';
import { useState } from 'react';

import { getOnboardingAction } from '@/actions/onboarding';

import LoadingForm from './LoadingForm';

interface ResumeOnboardingProps {
  message: string;
  children?: React.ReactNode;
  onResume?: (onboarding: OnboardingData, userId: number) => void;
  onError: (error: Error, onboardingUid: string | null) => void;
}

export default function ResumeOnboarding({
  message,
  children,
  onResume,
  onError,
}: ResumeOnboardingProps) {
  const [loading, setLoading] = useState(true);

  function hasSessionCookie(): boolean {
    return document.cookie.split(';').some((cookie) => cookie.trim().startsWith('session='));
  }

  async function handleLoading() {
    if (!loading) return;
    const uid = localStorage.getItem('onboardingUid');

    if (!hasSessionCookie()) {
      const error = new Error('Session cookie not found');
      console.error(error.message);
      onError(error, uid);
      return;
    }

    if (!uid) {
      const error = new Error('onboardingUid not found');
      console.error(error.message);
      onError(error, uid);
      return;
    }

    try {
      const onboarding = await getOnboardingAction(uid);
      if (onResume) onResume(onboarding.data as OnboardingData, onboarding.userId!);
    } catch (error) {
      // localStorage.clear();
      console.error('Error loading onboarding', error);
      onError(error as Error, uid);
    }
    setLoading(false);
  }

  return (
    <LoadingForm message={message} onLoad={handleLoading}>
      {children}
    </LoadingForm>
  );
}
