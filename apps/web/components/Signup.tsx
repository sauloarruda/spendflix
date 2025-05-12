import Link from 'next/link';
import { Button } from 'primereact/button';
import React, { useState } from 'react';

import { signup } from '@/actions/auth';
import { updateOnboardingAction } from '@/actions/onboarding';
import ApiError from '@/components/ApiError';
import RequiredField from '@/components/RequiredField';

import EmailField from '@/components/EmailField';

const SignupErrorMessages = {
  UsernameExistsException:
    'Já existe um usuário com o email informado. TODO: Redirecionando para login.',
  NotAuthorizedException: 'Já existe um usuário com o email informado.',
  CodeDeliveryFailureException:
    'Erro ao enviar o código de confirmação. Verifique se o email digitado está correto.',
  TooManyRequestsException: 'Muitas tentativas, tente novamente mais tarde.',
};

interface SignupProps {
  onSuccess: (name: string, email: string) => void;
  onLoginRedirect: (email: string) => void;
}

export default function Signup({ onSuccess, onLoginRedirect }: SignupProps) {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isFormValid, setIsFormValid] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string>();

  const handleNameChange = (value: string) => {
    setName(value);
    const isNameValid = value.trim().length > 0;
    setIsFormValid(isFormValid && isNameValid);
  };

  const handleEmailChange = (newEmail: string, isEmailValid: boolean) => {
    setEmail(newEmail);
    setIsFormValid(isFormValid && isEmailValid);
  };

  async function handleSignup() {
    setLoading(true);
    try {
      await signup(name, email);
      updateOnboardingAction(localStorage.getItem('onboardingUid')!, { step: 1 });
      onSuccess(name, email);
    } catch (err) {
      const error = err as Error;
      if (error.message === SignupErrorMessages.UsernameExistsException) onLoginRedirect(email);
      else setApiError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h2 className="text-xl font-semibold mb-6 text-center">Descubra, Organize, Realize</h2>

      <p className="text-gray-600 text-center mb-6">
        Em menos de 20 minutos, você dará seu primeiro passo para descobrir para onde está indo seu
        dinheiro todo mês.
      </p>

      <div className="flex flex-col gap-8 my-8">
        <RequiredField
          id="name"
          label="Como podemos te chamar?"
          value={name}
          onChange={handleNameChange}
          message="Por favor, nos diga como podemos te chamar."
        />

        <EmailField
          id="email"
          label="Seu melhor email"
          value={email}
          onChange={handleEmailChange}
        />
      </div>

      <ApiError error={apiError} />

      <Button
        className="w-full mt-8"
        label={loading ? 'Enviando...' : 'Continuar'}
        onClick={handleSignup}
        disabled={loading || !isFormValid}
      />

      <p className="text-xs text-gray-400 mt-4 text-center">
        Seu email é usado para envio do código. Leia nossa{' '}
        <Link href="/privacy" className="text-primary underline">
          Política de Privacidade
        </Link>
        .
      </p>
    </>
  );
}
