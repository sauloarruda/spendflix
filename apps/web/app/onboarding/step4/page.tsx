'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { createAccountAction } from '@/actions/accounts';
import { autorizeAction } from '@/actions/serverActions';
import AccountAccordion from '@/components/onboarding/AccountAccordion';
import OnboardingNavigation from '@/components/onboarding/OnboardingNavigation';
import { useOnboarding } from '@/components/onboarding/ResumeOnboarding';
import { Account, SourceType } from '@/prisma';
import { getSessionCookie } from '@/utils/cookie';

export default function OnboardingStep4() {
  const router = useRouter();
  const [monthsCount, setMonthsCount] = useState(0);
  const [nubankAccountId, setNubankAccountId] = useState<Account>();
  const [nubankCreditCardId, setNubankCreditCardId] = useState<Account>();
  const { userId, updateOnboarding } = useOnboarding();

  function sumMonthsCount(updatedMonthsCount: number) {
    setMonthsCount(monthsCount + updatedMonthsCount);
  }

  useEffect(() => {
    async function findOrCreateAccounts() {
      if (!userId) return;
      setNubankAccountId(
        await autorizeAction(getSessionCookie(), () =>
          createAccountAction({
            userId,
            bankNumber: '260', // only nubank now
            name: 'Conta Corrente',
            color: 'green-500',
            sourceType: SourceType.NUBANK_ACCOUNT_CSV,
          }),
        ),
      );

      setNubankCreditCardId(
        await autorizeAction(getSessionCookie(), () =>
          createAccountAction({
            userId,
            bankNumber: '260', // only nubank now
            name: 'Cartão de Crédito',
            color: 'orange-500',
            sourceType: SourceType.NUBANK_CREDIT_CARD_CSV,
          }),
        ),
      );
    }
    findOrCreateAccounts();
  }, [userId]);

  async function handleContinue() {
    await updateOnboarding({ step: 5 });
    router.push('/onboarding/step5');
  }

  return (
    <>
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
    </>
  );
}
