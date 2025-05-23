'use client';

import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

import ForgotPassword from '@/components/auth/ForgotPassword';
import ResetPassword from '@/components/auth/ResetPassword';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [step, setStep] = useState<'email' | 'reset'>('email');

  function handleForgotPasswordSuccess(userEmail: string) {
    setEmail(userEmail);
    setStep('reset');
  }

  function handleResetSuccess() {
    router.push('/login');
  }

  if (step === 'reset') {
    return <ResetPassword email={email} onSuccess={handleResetSuccess} />;
  }

  return <ForgotPassword onSuccess={handleForgotPasswordSuccess} />;
}
