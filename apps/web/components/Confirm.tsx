import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import React, { useState } from 'react';

import { confirmAction, signupAction } from '@/actions/auth';
import { updateOnboardingAction } from '@/actions/onboarding';
import ApiError from '@/components/ApiError';
import RequiredField from './RequiredField';

interface ConfirmProps {
  name: string;
  email: string;
  onSuccess: () => void;
}

const ConfirmErrorMessages = {
  ExpiredCodeException:
    'O código de confirmação digitado está expirado. Verifique seu email novamente ou solicite um novo código.',
  UserNotFoundException: 'O email cadastrado não foi encontrado.',
  NotAuthorizedException:
    'Já existe um usuário com o email informado. TODO: Redirecionando para login.',
  CodeMismatchException:
    'O código de confirmação é inválido. Verifique seu email novamente ou solicite um novo código.',
};

function translateError(err: unknown): string {
  const error = err as Error;
  return (
    ConfirmErrorMessages[error.name as keyof typeof ConfirmErrorMessages] ??
    'Ocorreu um erro ao confirmar o email.'
  );
}

export default function Confirm({ name, email, onSuccess }: ConfirmProps) {
  const [code, setCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isFormValid, setIsFormValid] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string>();

  async function handleConfirm() {
    setLoading(true);
    try {
      await confirmAction(email, code);
      await updateOnboardingAction(localStorage.getItem('onboardingUid')!, {
        step: 2,
      });
      onSuccess();
    } catch (error) {
      setApiError(translateError(error));
      setLoading(false);
    }
  }

  async function handleResend() {
    setLoading(true);
    try {
      await signupAction(name, email);
    } catch (error) {
      setApiError(translateError(error));
    } finally {
      setLoading(false);
    }
  }

  function validateCode(value: string) {
    if (!/^\d{6}$/.test(value)) {
      return { isValid: false, message: 'Informe o código de 6 dígitos.' };
    }
    return { isValid: true };
  }

  return (
    <>
      <h2 className="text-xl font-semibold mb-6 text-center">Confirme seu email</h2>
      <p className="text-gray-600 text-center mb-6">
        Olá {name}, enviamos um código de confirmação para <strong>{email}</strong>. Por favor,
        digite o código abaixo:
      </p>
      <div className="flex flex-col gap-8 my-8">
        <RequiredField
          id="code"
          label="Código de confirmação"
          value={code}
          customValidation={validateCode}
          onChange={(newValue: string, isValid: boolean) => {
            setCode(newValue);
            setIsFormValid(isValid);
          }}
          maxLength={6}
        />
      </div>
      <ApiError error={apiError} />
      <Button
        label={loading ? 'Confirmando...' : 'Confirmar'}
        onClick={handleConfirm}
        disabled={loading || !isFormValid}
        className="w-full mt-8"
      />
      <p className="text-sm text-center mt-4">
        Não recebeu?{' '}
        <button className="text-primary underline" onClick={handleResend} disabled={loading}>
          Reenviar código
        </button>
      </p>
    </>
  );
}
