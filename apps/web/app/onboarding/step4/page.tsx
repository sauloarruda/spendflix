'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { createAccountsAction } from '@/actions/accounts';
import AccountAccordion from '@/components/onboarding/AccountAccordion';
import OnboardingNavigation from '@/components/onboarding/OnboardingNavigation';
import LoadingForm from '@/components/utils/LoadingForm';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Account } from '@/prisma';
import { getSessionCookie } from '@/utils/cookie';

export default function OnboardingStep4() {
  const router = useRouter();
  const [monthsCount, setMonthsCount] = useState(0);
  const [nubankAccountId, setNubankAccountId] = useState<Account>();
  const [nubankCreditCardId, setNubankCreditCardId] = useState<Account>();
  const { isLoadingOnboarding, userId, updateOnboarding } = useOnboarding();

  function sumMonthsCount(updatedMonthsCount: number) {
    setMonthsCount(monthsCount + updatedMonthsCount);
  }

  async function loadAccounts() {
    if (!userId) return;
    const [nubankAccount, nubankCreditCard] = await createAccountsAction(getSessionCookie(), [
      {
        userId,
        bankNumber: '260', // only nubank now
        name: 'Conta Corrente',
        color: 'green-500',
        sourceTypeId: null,
      },
      {
        userId,
        bankNumber: '260', // only nubank now
        name: 'Cartão de Crédito',
        color: 'orange-500',
        sourceTypeId: null,
      },
    ]);

    setNubankAccountId(nubankAccount);
    setNubankCreditCardId(nubankCreditCard);
  }

  async function handleContinue() {
    await updateOnboarding({ step: 5 });
    router.push('/onboarding/step5');
  }

  if (isLoadingOnboarding) return <></>;

  return (
    <LoadingForm message="Buscando contas..." onLoad={loadAccounts}>
      <h2 className="text-xl font-semibold mb-6 text-center">Prepare seus extratos</h2>

      <p className="text-gray-600 text-center mb-8 max-w-md mx-auto">
        Para descobrir sobre suas finanças, precisamos dos extratos da sua Conta Corrente e do seu
        Cartão de Crédito Nubank.
        <br />
        Envie pelo menos 3 meses. O ideal são 6 meses!
      </p>

      {nubankAccountId && nubankCreditCardId && (
        <div className="mb-8 lg:w-5/6 md:w-full mx-auto">
          <AccountAccordion account={nubankAccountId} onUpdate={sumMonthsCount} />
          <AccountAccordion account={nubankCreditCardId} onUpdate={sumMonthsCount} />
        </div>
      )}

      <OnboardingNavigation disabled={monthsCount < 3} onClick={handleContinue} />
    </LoadingForm>
  );
}
