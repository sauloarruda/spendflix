'use client';

import Link from 'next/link';
import { Button } from 'primereact/button';
import React, { useState } from 'react';

import authActions from '@/actions/auth';

import ApiError from './ApiError';
import EmailField from './EmailField';
import LoadingForm from './LoadingForm';
import RequiredField from './RequiredField';

export default function Login({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isFormValid, setIsFormValid] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string>();
  const [isEmailValid, setIsEmailValid] = useState<boolean>(false);
  const [isPasswordValid, setIsPasswordValid] = useState<boolean>(false);

  type LoginErrorType = 'UserNotFoundException' | 'InvalidPasswordException';
  const LoginErrorMessages: Record<LoginErrorType, string> = {
    UserNotFoundException: 'Usuário não encontrado',
    InvalidPasswordException: 'Senha inválida conforme a política de senhas',
  };

  async function handleLogin() {
    setLoading(true);
    try {
      await authActions.login(email, password);
      onSuccess();
    } catch (error) {
      const errorName = (error as Error).name as LoginErrorType;
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

  async function getEmailFromLocalStorage() {
    // setEmail(localStorage.getItem('email') || '');
  }

  return (
    <LoadingForm message="Preparando pra começar..." onLoad={getEmailFromLocalStorage}>
      <h2 className="text-xl font-semibold mb-6 text-center">Entre na sua conta</h2>
      <p className="text-gray-600 text-center mb-6">Informe seu email e senha para entrar.</p>

      <div className="flex flex-col gap-8 my-8">
        <EmailField label="Email" id="password" value={email} onChange={handleEmailChange} />

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
        <Link href="/forgot-password" className="text-primary underline">
          Esqueci minha senha
        </Link>
      </p>
    </LoadingForm>
  );
}
