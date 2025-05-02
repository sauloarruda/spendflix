'use client';

import React, { useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { confirm, ConfirmResultTokens, signup } from '@/lib/dau/auth';
import ApiError from '@/components/ApiError';

interface ConfirmProps {
  name: string;
  email: string;
  onSuccess: (tokens: ConfirmResultTokens) => void;
  onResend: () => void;
}

export default function Confirm({ name, email, onSuccess }: ConfirmProps) {
  const [code, setCode] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [isFormValid, setIsFormValid] = useState<boolean>(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [apiError, setApiError] = useState<string>();

  function validateCode(value: string = code) {
    const validationErrors: Record<string, string> = {};
    if (!/^\d{6}$/.test(value)) validationErrors.code = 'Informe o código de 6 dígitos.';
    setErrors(validationErrors);
    setIsFormValid(Object.keys(validationErrors).length === 0);
    return Object.keys(validationErrors).length === 0;
  }

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateCode();
  };

  async function handleConfirm() {
    if (!validateCode()) return;
    setLoading(true);
    try {
      const result = await confirm(email, code, localStorage.getItem('onboardingUid')!);
      if (result.success) onSuccess(result.tokens!);
      else setApiError(result.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setLoading(true);
    try {
      const result = await signup(name, email);
      if (!result.success) setApiError(result.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h2 className="text-xl font-semibold mb-6 text-center">Confirme seu Email</h2>

      <p className="text-gray-600 text-center mb-6">
        Informe o código de 6 dígitos que enviamos para <strong>{email}</strong>.
      </p>

      <div className="flex flex-col my-8">
        <span className="p-float-label">
          <InputText
            id="code"
            value={code}
            onChange={(e) => {
              const newValue = e.target.value;
              setCode(newValue);
              validateCode(newValue);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && isFormValid) {
                handleConfirm();
              }
            }}
            onBlur={() => handleBlur('code')}
            className={`w-full ${touched.code && errors.code ? 'p-invalid' : ''}`}
            maxLength={6}
          />
          <label htmlFor="code">Código de confirmação</label>
        </span>
        {touched.code && errors.code && <small className="text-red-500 mt-1">{errors.code}</small>}
      </div>

      <ApiError error={apiError} />

      <Button
        className="w-full mt-8"
        label={loading ? 'Confirmando...' : 'Confirmar'}
        onClick={handleConfirm}
        disabled={loading || !isFormValid}
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
