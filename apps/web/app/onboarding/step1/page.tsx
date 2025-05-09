'use client';

import getLogger from '@/common/logger';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';

import { startOnboardingAction } from '@/actions/onboarding';
import Confirm from '@/components/Confirm';
import Signup from '@/components/Signup';

const logger = getLogger().child({ module: 'onboarding/step1' });

export default function Page() {
  const router = useRouter();
  const [step, setStep] = useState<'signup' | 'confirm' | 'login'>('signup');
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  logger.debug('Loading step 1...');

  function checkIfOnboardingIsStarted() {
    const startOnboarding = async () => {
      if (!localStorage.getItem('onboardingUid')) {
        try {
          const onboarding = await startOnboardingAction();
          localStorage.setItem('onboardingUid', onboarding.id);
        } catch (error) {
          logger.error({ error }, 'Error starting onboarding');
        }
      } else {
        logger.debug({ onboardingUid: localStorage.getItem('onboardingUid') }, 'Resume onboarding');
      }
    };
    return startOnboarding();
  }

  useEffect(() => {
    checkIfOnboardingIsStarted();
    setIsLoading(false);
  }, []);

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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center">
        <strong className="mb-4">Preparando pra começar...</strong>
        <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

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
