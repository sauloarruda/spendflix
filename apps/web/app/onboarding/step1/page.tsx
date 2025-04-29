'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import Link from 'next/link';

import type { paths } from 'types/api';

// types for /signup
type SignupRequest = paths['/auth/signup']['post']['requestBody']['content']['application/json'];

// types for /confirm
type ConfirmRequest = paths['/auth/confirm']['post']['requestBody']['content']['application/json'];
type ConfirmResponse =
  paths['/auth/confirm']['post']['responses']['200']['content']['application/json'];

export default function Page() {
  const router = useRouter();

  // form state
  const [step, setStep] = useState<'signup' | 'confirm'>('signup');
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isFormValid, setIsFormValid] = useState<boolean>(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const baseUrl = process.env.NEXT_PUBLIC_API_AUTH_URL;

  function validateSignup() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Por favor, nos diga como podemos te chamar.';
    if (!email.trim()) e.email = 'Por favor, insira seu email.';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Email inválido.';
    setErrors(e);
    setIsFormValid(Object.keys(e).length === 0);
    return Object.keys(e).length === 0;
  }

  function validateCode() {
    const e: Record<string, string> = {};
    if (!/^\d{6}$/.test(code)) e.code = 'Informe o código de 6 dígitos.';
    setErrors(e);
    setIsFormValid(Object.keys(e).length === 0);
    return Object.keys(e).length === 0;
  }

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Add useEffect for real-time validation
  useEffect(() => {
    if (step === 'signup') {
      validateSignup();
    } else {
      validateCode();
    }
  }, [name, email, code, step]);

  async function handleSignup() {
    if (!validateSignup()) return;
    setLoading(true);
    setApiError('');
    try {
      const res = await fetch(`${baseUrl}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email } as SignupRequest),
      });
      if (res.status === 201) {
        setStep('confirm');
      } else {
        const body = await res.json();
        setApiError(body.message || 'Erro no cadastro.');
      }
    } catch {
      setApiError('Não foi possível conectar.');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!validateCode()) return;
    setLoading(true);
    setApiError('');
    try {
      const res = await fetch(`${baseUrl}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code } as ConfirmRequest),
      });
      if (res.status === 200) {
        // you can grab tokens here:
        const body = (await res.json()) as ConfirmResponse;
        localStorage.setItem('accessToken', body.accessToken!);
        localStorage.setItem('refreshToken', body.refreshToken!);
        router.push('/onboarding/step2');
      } else {
        const body = await res.json();
        setApiError(body.message || 'Erro na confirmação.');
      }
    } catch {
      setApiError('Não foi possível conectar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50">
      <div className="w-full max-w-md">
        {step === 'signup' ? (
          <>
            <div className="text-sm text-gray-500 mb-4">Etapa 1 de 7</div>
            <h2 className="text-xl font-semibold mb-6 text-center">Descubra, Organize, Realize</h2>

            <p className="text-gray-600 text-center mb-6">
              Em menos de 20 minutos, você dará seu primeiro passo para descobrir para onde está
              indo seu dinheiro todo mês.
            </p>

            <div className="flex flex-col gap-8 my-8">
              <div className="flex flex-col">
                <span className="p-float-label">
                  <InputText
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
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
                    onChange={(e) => setEmail(e.target.value)}
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

            {apiError && <div className="text-red-600 my-4 text-center">{apiError}</div>}

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
        ) : (
          <>
            <div className="text-sm text-gray-500 mb-4">Step 2 of 7</div>
            <h2 className="text-xl font-semibold mb-6 text-center">Confirme seu Email</h2>

            <p className="text-gray-600 text-center mb-6">
              Informe o código de 6 dígitos que enviamos para <strong>{email}</strong>.
            </p>

            <div className="flex flex-col my-8">
              <span className="p-float-label">
                <InputText
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onBlur={() => handleBlur('code')}
                  className={`w-full ${touched.code && errors.code ? 'p-invalid' : ''}`}
                />
                <label htmlFor="code">Código de confirmação</label>
              </span>
              {touched.code && errors.code && (
                <small className="text-red-500 mt-1">{errors.code}</small>
              )}
            </div>

            {apiError && <div className="text-red-600 my-4 text-center">{apiError}</div>}

            <Button
              className="w-full mt-8"
              label={loading ? 'Confirmando...' : 'Confirmar Email'}
              onClick={handleConfirm}
              disabled={loading || !isFormValid}
            />

            <p className="text-sm text-center mt-4">
              Não recebeu?{' '}
              <button className="text-primary underline" onClick={handleSignup} disabled={loading}>
                Reenviar código
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
