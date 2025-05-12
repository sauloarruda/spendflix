'use client';

import { useRouter } from 'next/navigation';
import React from 'react';

import Login from '@/components/Login';

export default function LoginPage() {
  const router = useRouter();

  function handleLoginSuccess() {
    router.push('/dashboard');
  }

  return <Login onSuccess={handleLoginSuccess} />;
}
