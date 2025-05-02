'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ConfirmResultTokens } from '@/lib/dau/auth';
import Signup from '@/components/Signup';
import Confirm from '@/components/Confirm';
import Login from '@/components/Login';
import { updateOnboardingStep, getOnboardingData } from '@/lib/dau/onboarding';

export default function Page() {
  const router = useRouter();
  const [step, setStep] = useState<'signup' | 'confirm' | 'login'>('signup');
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');

  const handleSignupSuccess = async (responseName: string, responseEmail: string) => {
    setName(responseName);
    setEmail(responseEmail);
    localStorage.setItem('email', responseEmail);
    setStep('confirm');
  };

  const handleLoginRedirect = (responseEmail: string) => {
    setEmail(responseEmail);
    setStep('login');
  };

  const handleConfirmSuccess = async (tokens: ConfirmResultTokens) => {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('idToken', tokens.idToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    router.push('/onboarding/step2');
  };

  return (
    <>
      {step === 'signup' && (
        <Signup onSuccess={handleSignupSuccess} onLoginRedirect={handleLoginRedirect} />
      )}
      {step === 'confirm' && (
        <Confirm
          name={name}
          email={email}
          onSuccess={handleConfirmSuccess}
          onResend={() => setStep('signup')}
        />
      )}
      {/* {step === 'login' && <Login onSuccess={handleConfirmSuccess} />} */}
    </>
  );
}
