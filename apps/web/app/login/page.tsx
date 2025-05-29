'use client';

import { useRouter } from 'next/navigation';
import React from 'react';

import Login from '@/components/auth/Login';

export default function LoginPage() {
  const router = useRouter();

  function handleLoginSuccess() {
    router.push('/');
  }

  return <Login onSuccess={handleLoginSuccess} />;
}
