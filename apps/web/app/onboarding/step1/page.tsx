'use client';

import { OnboardingData } from '@/modules/users';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

import { getOnboardingAction, startOnboardingAction } from '@/actions/onboarding';
import Login from '@/components/auth/Login';
import Confirm from '@/components/onboarding/Confirm';
import Signup from '@/components/onboarding/Signup';
import ApiError from '@/components/utils/ApiError';
import LoadingForm from '@/components/utils/LoadingForm';
import { hasSessionCookie } from '@/utils/auth';

export default function Page() {
  const router = useRouter();
  const [step, setStep] = useState<'signup' | 'confirm' | 'login'>('signup');
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [apiError, setApiError] = useState<string>();

  async function checkIfOnboardingIsStarted() {
    const onboardingData = (await getOnboardingAction(localStorage.getItem('onboardingUid') || ''))
      ?.data as OnboardingData;
    if (!onboardingData) {
      try {
        const onboarding = await startOnboardingAction();
        localStorage.setItem('onboardingUid', onboarding.id);
      } catch (error) {
        setApiError((error as Error).message);
      }
    } else if (onboardingData.step && onboardingData.step > 1) {
      if (!hasSessionCookie()) {
        router.push('/401');
        return;
      }
      router.push(`/onboarding/step${onboardingData.step}`);
    }
  }

  const handleSignupSuccess = async (responseName: string, responseEmail: string) => {
    setName(responseName);
    setEmail(responseEmail);
    localStorage.setItem('email', responseEmail);
    localStorage.setItem('name', responseName);
    setStep('confirm');
  };

  const handleLoginRedirect = (responseEmail: string) => {
    setEmail(responseEmail);
    setStep('login');
  };

  const handleConfirmSuccess = async () => {
    router.push('/onboarding/step2');
  };

  return (
    <LoadingForm message="Preparando pra começar..." onLoad={checkIfOnboardingIsStarted}>
      {step === 'signup' && (
        <Signup onSuccess={handleSignupSuccess} onLoginRedirect={handleLoginRedirect} />
      )}
      {step === 'confirm' && <Confirm name={name} email={email} onSuccess={handleConfirmSuccess} />}
      {step === 'login' && <Login onSuccess={handleConfirmSuccess} />}
      <ApiError error={apiError} />
    </LoadingForm>
  );
}
