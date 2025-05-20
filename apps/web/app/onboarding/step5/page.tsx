'use client';

import { UncategorizedTransaction } from '@/modules/transactions';
import { OnboardingData } from '@/modules/users';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { getUncategorizedTransactionsAction } from '@/actions/transactions';
import ResumeOnboarding from '@/components/ResumeOnboarding';
import UncategorizedTransactions from '@/components/UncategorizedTransactions';

export default function OnboardingStep5() {
  const router = useRouter();
  const [result, setResult] = useState<{
    categorizedPercent: number;
    transactions: UncategorizedTransaction[];
  }>();

  async function handleLoadTransactions(_onboarding: OnboardingData, userId: number) {
    setResult(await getUncategorizedTransactionsAction(userId));
  }

  return (
    <ResumeOnboarding
      message="Preparando para continuar..."
      onResume={handleLoadTransactions}
      onError={() => router.push('/onboarding/step1')}
    >
      <h2 className="text-xl font-semibold mb-6 text-center">
        Excelente! Agora vamos organizar seus lançamentos
      </h2>

      <p className="text-gray-600 text-center mb-8 max-w-md">
        Nós conseguimos categorizar
        <strong className="mx-1">
          {result?.categorizedPercent.toLocaleString('pt-BR', { style: 'percent' })}
        </strong>
        dos seus lançamentos.
        <br /> Tire um tempo para escolher a categoria de mais alguns abaixo para melhorar o
        resultado das análises.
      </p>

      <UncategorizedTransactions transactions={result?.transactions} />
    </ResumeOnboarding>
  );
}
