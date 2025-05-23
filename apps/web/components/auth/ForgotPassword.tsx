'use client';

import { Button } from 'primereact/button';
import React, { useState } from 'react';

import { forgotPasswordAction } from '@/actions/auth';
import EmailField from '@/components/inputs/EmailField';
import ApiError from '@/components/utils/ApiError';

interface ForgotPasswordProps {
  onSuccess: (email: string) => void;
}

export default function ForgotPassword({ onSuccess }: ForgotPasswordProps) {
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isEmailValid, setIsEmailValid] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string>();

  type ForgotPasswordErrorType = 'UserNotFoundException';
  const ForgotPasswordErrorMessages: Record<ForgotPasswordErrorType, string> = {
    UserNotFoundException: 'Usuário não encontrado',
  };

  async function handleForgotPassword() {
    if (!isEmailValid) return;
    setLoading(true);
    try {
      await forgotPasswordAction(email);
      onSuccess(email);
    } catch (error) {
      const errorName = (error as Error).name as ForgotPasswordErrorType;
      setApiError(ForgotPasswordErrorMessages[errorName] || 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }

  function handleEmailChange(value: string, isValid: boolean) {
    setEmail(value);
    setIsEmailValid(isValid);
  }

  return (
    <>
      <h2 className="text-xl font-semibold mb-6 mt-8 text-center">Esqueceu sua senha?</h2>
      <p className="text-gray-600 text-center mb-6">
        Informe seu email para receber instruções de como redefinir sua senha.
      </p>

      <div className="flex flex-col gap-8 my-8">
        <EmailField label="Email" id="email" value={email} onChange={handleEmailChange} />
      </div>

      <ApiError error={apiError} />

      <Button
        className="w-full mt-8"
        label={loading ? 'Enviando...' : 'Enviar instruções'}
        onClick={handleForgotPassword}
        disabled={loading || !isEmailValid}
      />
    </>
  );
}
