'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { autorizeAction } from '@/actions/serverActions';
import { getUncategorizedTransactionsAction } from '@/actions/transactions';
import UncategorizedTransactions from '@/components/forms/UncategorizedTransactions';
import OnboardingNavigation from '@/components/onboarding/OnboardingNavigation';
import LoadingForm from '@/components/utils/LoadingForm';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { getSessionCookie } from '@/utils/cookie';

type UncategorizedTransactionFetch = Awaited<ReturnType<typeof getUncategorizedTransactionsAction>>;

export default function OnboardingStep5() {
  const router = useRouter();
  const [result, setResult] = useState<UncategorizedTransactionFetch>();
  const [edited, setEdited] = useState<string[]>([]);
  const { userId, updateOnboarding } = useOnboarding();

  async function fetchUncategorizedTransactions() {
    console.log('loading uncategorized transactions', userId, result);
    if (!userId || result) return;
    setResult(
      await autorizeAction(getSessionCookie(), () => getUncategorizedTransactionsAction(userId)),
    );
  }

  function shouldContinue() {
    if (!result) return false;
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

  async function handleContinue() {
    await updateOnboarding({ step: 6 });
    router.push('/onboarding/step6');
  }

  return (
    <LoadingForm message="Buscando lançamentos..." onLoad={fetchUncategorizedTransactions}>
      <h2 className="text-xl font-semibold mb-6 text-center">
        Excelente! Agora vamos <br />
        organizar seus lançamentos
      </h2>

      <p className="text-gray-600 text-center mb-8 max-w-md mx-auto">
        Nós conseguimos categorizar
        <strong className="mx-1">
          {result?.categorizedPercent.toLocaleString('pt-BR', { style: 'percent' })}
        </strong>
        dos seus lançamentos. Tire um tempo para escolher a categoria de mais alguns abaixo para
        melhorar o resultado das análises.
      </p>
      {result && (
        <UncategorizedTransactions
          onChange={handleCategoryUpdate}
          transactions={result.transactions}
        />
      )}

      <OnboardingNavigation disabled={!shouldContinue} onClick={handleContinue} />
    </LoadingForm>
  );
}
