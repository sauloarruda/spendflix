'use client';

import Link from 'next/link';
import { Button } from 'primereact/button';
import React, { useState } from 'react';

import { loginAction } from '@/actions/auth';
import EmailField from '@/components/inputs/EmailField';
import RequiredField from '@/components/inputs/RequiredField';
import ApiError from '@/components/utils/ApiError';

export default function Login({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isFormValid, setIsFormValid] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string>();
  const [isEmailValid, setIsEmailValid] = useState<boolean>(false);
  const [isPasswordValid, setIsPasswordValid] = useState<boolean>(false);

  const LoginErrorMessages: Record<string, string> = {
    UserNotFoundException: 'Usuário não encontrado',
    InvalidPasswordException: 'Usuário ou senha inválidos',
    NotAuthorizedException: 'Usuário ou senha inválidos',
  };

  async function handleLogin() {
    setLoading(true);
    try {
      await loginAction(email, password);
      onSuccess();
    } catch (error) {
      const errorName = (error as Error).name as keyof typeof LoginErrorMessages;
      setApiError(LoginErrorMessages[errorName] || 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }

  function handlePasswordChange(value: string, isValid: boolean) {
    setPassword(value);
    setIsPasswordValid(isValid);
    setIsFormValid(isEmailValid && isValid);
  }

  function handleEmailChange(value: string, isValid: boolean) {
    setEmail(value);
    setIsEmailValid(isValid);
    setIsFormValid(isValid && isPasswordValid);
  }

  return (
    <>
      <h2 className="text-xl font-semibold mb-6 text-center">Entre na sua conta</h2>
      <p className="text-gray-600 text-center mb-6">Informe seu email e senha para entrar.</p>

      <div className="flex flex-col gap-8 my-8">
        <EmailField label="Email" id="email" value={email} onChange={handleEmailChange} />

        <RequiredField
          label="Senha"
          type="password"
          id="password"
          value={password}
          message="Por favor, insira sua senha"
          onChange={handlePasswordChange}
        />
      </div>

      <ApiError error={apiError} />

      <Button
        className="w-full mt-8"
        label={loading ? 'Validando...' : 'Entrar'}
        onClick={handleLogin}
        disabled={loading || !isFormValid}
      />

      <p className="text-sm text-center mt-4">
        <Link
          href="/forgot-password"
          className="text-primary underline"
          onClick={() => setLoading(true)}
        >
          Esqueci minha senha
        </Link>
      </p>
    </>
  );
}
