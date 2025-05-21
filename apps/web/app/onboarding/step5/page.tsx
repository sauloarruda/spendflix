'use client';

import { UncategorizedTransaction } from '@/modules/transactions';
import { OnboardingData } from '@/modules/users';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { useState } from 'react';

import { getUncategorizedTransactionsAction } from '@/actions/transactions';
import ResumeOnboarding from '@/components/ResumeOnboarding';
import UncategorizedTransactions from '@/components/UncategorizedTransactions';

export default function OnboardingStep5() {
  const router = useRouter();
  const [result, setResult] = useState<{
    categorizedPercent: number;
    transactions: UncategorizedTransaction[];
  }>({ categorizedPercent: 0, transactions: [] });
  const [edited, setEdited] = useState<string[]>([]);

  async function handleLoadTransactions(_onboarding: OnboardingData, userId: number) {
    setResult(await getUncategorizedTransactionsAction(userId));
  }

  function shouldContinue() {
    // non pending
    if (result.transactions.length === 0) return true;
    // all pending transactions edited
    if (result.transactions.length === edited.length) return true;
    // at least 10 edited
    if (edited.length > 10) return true;
    return false;
  }

  function handleCategoryUpdate(editedUpdate: string[]) {
    setEdited(editedUpdate);
  }

  function handleContinue() {
    router.push('/onboarding/step6');
  }

  return (
    <ResumeOnboarding
      message="Preparando para continuar..."
      onResume={handleLoadTransactions}
      onError={() => router.push('/onboarding/step1')}
    >
      <h2 className="text-xl font-semibold mb-6 text-center">
        Excelente! Agora vamos <br />
        organizar seus lançamentos
      </h2>

      <p className="text-gray-600 text-center mb-8 max-w-md">
        Nós conseguimos categorizar
        <strong className="mx-1">
          {result?.categorizedPercent.toLocaleString('pt-BR', { style: 'percent' })}
        </strong>
        dos seus lançamentos. Tire um tempo para escolher a categoria de mais alguns abaixo para
        melhorar o resultado das análises.
      </p>

      <UncategorizedTransactions
        onChange={handleCategoryUpdate}
        transactions={result.transactions}
      />

      <div className="w-full max-w-md mt-4">
        <Button
          label="Continuar"
          className="w-full"
          disabled={!shouldContinue}
          onClick={handleContinue}
        />
      </div>
    </ResumeOnboarding>
  );
}
