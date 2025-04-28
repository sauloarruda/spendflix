'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import Link from 'next/link';

// 1) Importa o tipo "paths" gerado
import type { paths } from 'types/api';

// 2) Extrai os tipos corretos
type SignupRequest = paths['/auth/signup']['post']['requestBody']['content']['application/json'];
type SignupResponse =
  paths['/auth/signup']['post']['responses']['201']['content']['application/json'];

export default function Page() {
  const router = useRouter();

  const [name, setName] = useState<SignupRequest['name']>('');
  const [email, setEmail] = useState<SignupRequest['email']>('');
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [apiError, setApiError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const validate = (): boolean => {
    const newErrors: { name?: string; email?: string } = {};
    if (!name.trim()) newErrors.name = 'Por favor, nos diga como podemos te chamar.';
    if (!email.trim()) newErrors.email = 'Por favor, insira seu email.';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email inválido. Tente novamente.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = async () => {
    if (!validate()) return;

    setLoading(true);
    setApiError('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_AUTH_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email } as SignupRequest),
      });

      if (res.status === 201) {
        const data = (await res.json()) as SignupResponse;
        console.log(data);
        // opcional: usar data.userId, data.message, etc.
        router.push('/onboarding/step2');
      } else if (res.status === 400) {
        const err = (await res.json()) as { message?: string };
        setApiError(err.message ?? 'Dados inválidos.');
      } else {
        setApiError('Ocorreu um erro no servidor. Tente novamente mais tarde.');
      }
    } catch {
      setApiError('Não foi possível conectar à API.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50">
      <div className="text-sm text-gray-500 mb-4">Etapa 1 de 7</div>
      <h2 className="text-xl font-semibold mb-4 text-center">Descubra, Organize, Realize</h2>
      <p className="text-gray-600 text-center mb-6">
        Em menos de 20 minutos, você dará seu primeiro passo para descobrir para onde está indo seu
        dinheiro todo mês.
      </p>

      <div className="w-full max-w-md space-y-6">
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
          <small className="text-gray-400 mt-1">
            Assim você consegue continuar de onde parou caso precise.
          </small>
          {errors.email && <small className="text-red-500 mt-1">{errors.email}</small>}
        </div>
      </div>

      {apiError && <div className="w-full max-w-md mt-4 text-center text-red-600">{apiError}</div>}

      <div className="w-full max-w-md mt-6">
        <Button
          label={loading ? 'Enviando...' : 'Continuar'}
          className="w-full"
          onClick={handleContinue}
          disabled={loading}
        />
      </div>

      <p className="text-xs text-gray-400 mt-4 text-center max-w-sm">
        Seu nome nos ajuda a personalizar sua experiência. Seu email está seguro conosco e nunca
        será compartilhado. Leia nossa{' '}
        <Link href="/privacy" className="text-primary underline">
          Política de Privacidade
        </Link>{' '}
        para mais informações sobre como usamos e armazenamos seus dados.
      </p>
    </div>
  );
}
