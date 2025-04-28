'use client';

import React, { useState } from 'react';
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

  const baseUrl = process.env.NEXT_PUBLIC_API_AUTH_URL;

  function validateSignup() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Por favor, nos diga como podemos te chamar.';
    if (!email.trim()) e.email = 'Por favor, insira seu email.';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Email inválido.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateCode() {
    const e: Record<string, string> = {};
    if (!/^\d{6}$/.test(code)) e.code = 'Informe o código de 6 dígitos.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

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
        console.log(body);
        // e.g. localStorage.setItem('accessToken', body.accessToken)
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
            <div className="text-sm text-gray-500 mb-4">Step 1 of 7</div>
            <h2 className="text-xl font-semibold mb-4 text-center">Cadastro</h2>

            <div className="space-y-6">
              <div className="flex flex-col">
                <span className="p-float-label">
                  <InputText
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full ${errors.name ? 'p-invalid' : ''}`}
                  />
                  <label htmlFor="name">Como podemos te chamar?</label>
                </span>
                {errors.name && <small className="text-red-500 mt-1">{errors.name}</small>}
              </div>

              <div className="flex flex-col">
                <span className="p-float-label">
                  <InputText
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full ${errors.email ? 'p-invalid' : ''}`}
                  />
                  <label htmlFor="email">Seu melhor email</label>
                </span>
                {errors.email && <small className="text-red-500 mt-1">{errors.email}</small>}
              </div>
            </div>

            {apiError && <div className="text-red-600 mt-4 text-center">{apiError}</div>}

            <Button
              className="w-full mt-6"
              label={loading ? 'Enviando...' : 'Continuar'}
              onClick={handleSignup}
              disabled={loading}
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
            <h2 className="text-xl font-semibold mb-4 text-center">Confirme seu Email</h2>

            <p className="text-gray-600 text-center mb-6">
              Informe o código de 6 dígitos que enviamos para <strong>{email}</strong>.
            </p>

            <div className="flex flex-col">
              <span className="p-float-label">
                <InputText
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className={`w-full ${errors.code ? 'p-invalid' : ''}`}
                />
                <label htmlFor="code">Código de confirmação</label>
              </span>
              {errors.code && <small className="text-red-500 mt-1">{errors.code}</small>}
            </div>

            {apiError && <div className="text-red-600 mt-4 text-center">{apiError}</div>}

            <Button
              className="w-full mt-6"
              label={loading ? 'Confirmando...' : 'Confirmar Email'}
              onClick={handleConfirm}
              disabled={loading}
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
