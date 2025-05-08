'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Signup from '@/components/Signup';
import Confirm from '@/components/Confirm';
import { UserTokens } from '@/modules/users';
import { startOnboardingAction } from '@/actions/onboarding';

export default function Page() {
  const router = useRouter();
  const [step, setStep] = useState<'signup' | 'confirm' | 'login'>('signup');
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const startOnboarding = async () => {
      console.log('Starting onboarding...');
      if (!localStorage.getItem('onboardingUid')) {
        try {
          const onboarding = await startOnboardingAction();
          localStorage.setItem('onboardingUid', onboarding.id);
        } catch (error) {
          console.error('Error starting onboarding', error);
        }
      }
      console.log('Onboarding completed, setting loading to false');
      setIsLoading(false);
    };
    startOnboarding();
  }, []);

  console.log('Current loading state:', isLoading);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center">
        <strong className="mb-4">Preparando pra começar...</strong>
        <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
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
    <>
      {step === 'signup' && (
        <Signup onSuccess={handleSignupSuccess} onLoginRedirect={handleLoginRedirect} />
      )}
      {step === 'confirm' && <Confirm name={name} email={email} onSuccess={handleConfirmSuccess} />}
      {/* {step === 'login' && <Login onSuccess={handleConfirmSuccess} />} */}
    </>
  );
}
