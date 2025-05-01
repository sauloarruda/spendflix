'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ConfirmResultTokens } from '@/lib/dau/auth';
import Signup from '@/components/Signup';
import Confirm from '@/components/Confirm';
import Login from '@/components/Login';
import { updateOnboardingStep, getOnboardingData } from '@/app/actions/onboarding';

export default function Page() {
  const router = useRouter();
  const [step, setStep] = useState<'signup' | 'confirm' | 'login'>('signup');
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');

  useEffect(() => {
    const email = localStorage.getItem('email');
    if (email) {
      getOnboardingData(email).then(async (data) => {
        if (!data) {
          // Only set startedAt if no record exists
          await updateOnboardingStep(email, {
            startedAt: new Date(),
            step: 1,
          });
        }
      });
    }
  }, []);

  const handleSignupSuccess = async (responseName: string, responseEmail: string) => {
    setName(responseName);
    setEmail(responseEmail);
    localStorage.setItem('email', responseEmail);

    // Check if record exists before setting startedAt
    const existingData = await getOnboardingData(responseEmail);
    if (!existingData) {
      await updateOnboardingStep(responseEmail, {
        startedAt: new Date(),
        step: 1,
      });
    }

    setStep('confirm');
  };

  const handleLoginRedirect = (responseEmail: string) => {
    setEmail(responseEmail);
    localStorage.setItem('email', responseEmail);
    setStep('login');
  };

  const handleConfirmSuccess = async (tokens: ConfirmResultTokens) => {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('idToken', tokens.idToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);

    // Save the name in the database
    await updateOnboardingStep(email, {
      name,
      step: 1,
    });

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
      {step === 'login' && <Login onSuccess={() => router.push('/onboarding/step2')} />}
    </>
  );
}
