'use client';

import React, { useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import Link from 'next/link';
import { signup, SignupErrorMessages } from '@/lib/dau/auth';
import ApiError from '@/components/ApiError';

interface SignupProps {
  onSuccess: (name: string, email: string) => void;
  onLoginRedirect: (email: string) => void;
}

export default function Signup({ onSuccess, onLoginRedirect }: SignupProps) {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [isFormValid, setIsFormValid] = useState<boolean>(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [apiError, setApiError] = useState<string>();

  function validateSignup() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Por favor, nos diga como podemos te chamar.';
    if (!email.trim()) e.email = 'Por favor, insira seu email.';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Email inválido.';
    setErrors(e);
    setIsFormValid(Object.keys(e).length === 0);
    return Object.keys(e).length === 0;
  }

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateSignup();
  };

  async function handleSignup() {
    if (!validateSignup()) return;
    setLoading(true);
    try {
      const result = await signup(name, email);
      if (result.success) onSuccess(name, email);
      else if (result.error === SignupErrorMessages.UsernameExistsException) onLoginRedirect(email);
      else setApiError(result.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="text-sm text-gray-500 mb-4">Etapa 1 de 7</div>
      <h2 className="text-xl font-semibold mb-6 text-center">Descubra, Organize, Realize</h2>

      <p className="text-gray-600 text-center mb-6">
        Em menos de 20 minutos, você dará seu primeiro passo para descobrir para onde está indo seu
        dinheiro todo mês.
      </p>

      <div className="flex flex-col gap-8 my-8">
        <div className="flex flex-col">
          <span className="p-float-label">
            <InputText
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                validateSignup();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && isFormValid) {
                  handleSignup();
                }
              }}
              onBlur={() => handleBlur('name')}
              className={`w-full ${touched.name && errors.name ? 'p-invalid' : ''}`}
            />
            <label htmlFor="name">Como podemos te chamar?</label>
          </span>
          {touched.name && errors.name && (
            <small className="text-red-500 mt-1">{errors.name}</small>
          )}
        </div>

        <div className="flex flex-col">
          <span className="p-float-label">
            <InputText
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                validateSignup();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && isFormValid) {
                  handleSignup();
                }
              }}
              onBlur={() => handleBlur('email')}
              className={`w-full ${touched.email && errors.email ? 'p-invalid' : ''}`}
            />
            <label htmlFor="email">Seu melhor email</label>
          </span>
          {touched.email && errors.email && (
            <small className="text-red-500 mt-1">{errors.email}</small>
          )}
        </div>
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
