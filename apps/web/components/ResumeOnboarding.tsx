import { OnboardingData } from '@/modules/users';
import { useState } from 'react';

import { getOnboardingAction } from '@/actions/onboarding';

import LoadingForm from './LoadingForm';

interface ResumeOnboardingProps {
  message: string;
  children: React.ReactNode;
  onResume?: (onboarding: OnboardingData) => void;
  onError: (error: Error) => void;
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

    if (!hasSessionCookie()) {
      const error = new Error('Session cookie not found');
      console.error(error.message);
      onError(error);
      return;
    }

    const uid = localStorage.getItem('onboardingUid');
    if (!uid) {
      const error = new Error('onboardingUid not found');
      console.error(error.message);
      onError(error);
      return;
    }

    try {
      const onboarding = await getOnboardingAction(uid);
      console.log(onboarding);
      onResume(onboarding);
    } catch (error) {
      localStorage.clear();
      console.error('Error loading onboarding', error);
      onError(error as Error);
    }
    setLoading(false);
  }

  return (
    <LoadingForm message={message} onLoad={handleLoading}>
      {children}
    </LoadingForm>
  );
}
