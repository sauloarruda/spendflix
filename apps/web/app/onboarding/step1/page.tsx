'use client';

import { OnboardingData } from '@/modules/users';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

import {
  getOnboardingAction,
  getOnboardingFromEmailAction,
  startOnboardingAction,
} from '@/actions/onboarding';
import Login from '@/components/auth/Login';
import Confirm from '@/components/onboarding/Confirm';
import Signup from '@/components/onboarding/Signup';
import ApiError from '@/components/utils/ApiError';
import LoadingForm from '@/components/utils/LoadingForm';
import { hasSessionCookie } from '@/utils/cookie';

export default function Page() {
  const router = useRouter();
  const [step, setStep] = useState<'signup' | 'confirm' | 'login'>('signup');
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [apiError, setApiError] = useState<string>();

  async function checkIfOnboardingIsStarted() {
    let onboarding = await getOnboardingAction(localStorage.getItem('onboardingUid') || '');
    const onboardingData = onboarding?.data as OnboardingData;
    if (!onboarding || !onboardingData) {
      try {
        onboarding = await startOnboardingAction();
        localStorage.setItem('onboardingUid', onboarding.id);
      } catch (error) {
        setApiError((error as Error).message);
      }
    } else if (!onboarding?.userId) {
      if (onboardingData?.step && onboardingData?.step > 1) {
        setApiError(
          'Não foi possível continuar de onde parou. Você pode começar novamente ou contatar o suporte',
        );
        localStorage.removeItem('onboardingUid');
      }
      // show form
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
    setApiError('');
    setEmail(responseEmail);
    localStorage.setItem('email', responseEmail);
    setStep('login');
  };

  const handleConfirmSuccess = async () => {
    router.push('/onboarding/step2');
  };

  async function handleLoginSuccess() {
    const onboarding = await getOnboardingFromEmailAction(email);
    if (onboarding) {
      localStorage.setItem('onboardingUid', onboarding?.id);
      const { step: currentStep } = onboarding.data as OnboardingData;
      router.push(`/onboarding/step${currentStep ?? 2}`);
      return;
    }
    router.push('/');
  }

  return (
    <LoadingForm message="Preparando pra começar..." onLoad={checkIfOnboardingIsStarted}>
      <ApiError error={apiError} />
      {step === 'signup' && (
        <Signup onSuccess={handleSignupSuccess} onLoginRedirect={handleLoginRedirect} />
      )}
      {step === 'confirm' && <Confirm name={name} email={email} onSuccess={handleConfirmSuccess} />}
      {step === 'login' && (
        <div className="max-w-md mx-auto">
          <h2 className="text-xl font-semibold mb-6 text-center">Entre na sua conta</h2>
          <p className="text-gray-600 text-center mb-6">
            Identificamos que você já tem cadastro. Informe seu email e senha ou escolha a opção
            &quote;Esqueci minha senha&quote; para cadastrar caso não tenha.
          </p>
          <Login onSuccess={handleLoginSuccess} />
        </div>
      )}
    </LoadingForm>
  );
}
