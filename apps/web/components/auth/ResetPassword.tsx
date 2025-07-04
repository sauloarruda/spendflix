'use client';

import { Button } from 'primereact/button';
import React, { useState } from 'react';

import { resetPasswordAction } from '@/actions/auth';
import RequiredField from '@/components/inputs/RequiredField';
import ApiError from '@/components/utils/ApiError';

interface ResetPasswordProps {
  email: string;
  onSuccess: () => void;
}

export default function ResetPassword({ email, onSuccess }: ResetPasswordProps) {
  const [code, setCode] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isCodeValid, setIsCodeValid] = useState<boolean>(false);
  const [isPasswordValid, setIsPasswordValid] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string>();

  type ResetPasswordErrorType = 'CodeMismatchException' | 'InvalidPasswordException';
  const ResetPasswordErrorMessages: Record<ResetPasswordErrorType, string> = {
    CodeMismatchException: 'Código inválido',
    InvalidPasswordException: 'Senha inválida conforme a política de senhas',
  };

  async function handleResetPassword() {
    setLoading(true);
    try {
      await resetPasswordAction(email, code, password);
      onSuccess();
    } catch (error) {
      const errorName = (error as Error).name as ResetPasswordErrorType;
      setApiError(ResetPasswordErrorMessages[errorName] || 'Erro desconhecido');
      setLoading(false);
    }
  }

  function handleCodeChange(value: string, isValid: boolean) {
    setCode(value);
    setIsCodeValid(isValid);
  }

  function handlePasswordChange(value: string, isValid: boolean) {
    setPassword(value);
    setIsPasswordValid(isValid);
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-6 mt-8 text-center">Redefinir senha</h2>
      <p className="text-gray-600 text-center mb-6">
        Informe o código de 6 dígitos enviado para seu email e sua nova senha.
      </p>

      <div className="flex flex-col gap-8 my-8">
        <RequiredField
          label="Código de verificação"
          id="code"
          value={code}
          onChange={handleCodeChange}
          message="Por favor, insira o código de 6 dígitos"
          customValidation={(value) => ({
            isValid: /^\d{6}$/.test(value),
            message: 'O código deve conter 6 dígitos',
          })}
        />

        <RequiredField
          label="Nova senha"
          type="password"
          id="password"
          value={password}
          onChange={handlePasswordChange}
          message="Por favor, insira sua nova senha"
        />
      </div>

      <ApiError error={apiError} />

      <Button
        className="w-full mt-8"
        label={loading ? 'Redefinindo...' : 'Redefinir senha'}
        onClick={handleResetPassword}
        disabled={loading || !isCodeValid || !isPasswordValid}
      />
    </div>
  );
}
