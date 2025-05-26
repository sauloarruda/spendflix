'use client';

import { OnboardingData } from '@/modules/users';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { useState } from 'react';

import { createAccountAction } from '@/actions/accounts';
import { updateOnboardingAction } from '@/actions/onboarding';
import { autorizeAction } from '@/actions/serverActions';
import AccountAccordion from '@/components/onboarding/AccountAccordion';
import ResumeOnboarding from '@/components/onboarding/ResumeOnboarding';
import { Account, SourceType } from '@/prisma';
import { getSessionCookie } from '@/utils/cookie';

export default function OnboardingStep4() {
  const router = useRouter();
  const [monthsCount, setMonthsCount] = useState(0);
  const [nubankAccountId, setNubankAccountId] = useState<Account>();
  const [nubankCreditCardId, setNubankCreditCardId] = useState<Account>();

  function sumMonthsCount(updatedMonthsCount: number) {
    setMonthsCount(monthsCount + updatedMonthsCount);
  }

  async function handleResumeOnboarding(onboarding: OnboardingData, userId: number) {
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

  async function handleContinue() {
    await updateOnboardingAction(localStorage.getItem('onboardingUid')!, { step: 5 });
    router.push('/onboarding/step5');
  }

  return (
    <ResumeOnboarding
      message="Preparando para continuar..."
      onResume={handleResumeOnboarding}
      onError={() => router.push('/onboarding/step1')}
    >
      <h2 className="text-xl font-semibold mb-6 text-center">Prepare seus extratos</h2>

      <p className="text-gray-600 text-center mb-8 max-w-md">
        Para descobrir sobre suas finanças, precisamos dos extratos da sua Conta Corrente e do seu
        Cartão de Crédito Nubank.
        <br />
        Envie pelo menos 3 meses. O ideal são 6 meses!
      </p>

      {nubankAccountId && nubankCreditCardId && (
        <div className="w-full max-w-md mb-8">
          <AccountAccordion account={nubankAccountId} onUpdate={sumMonthsCount} />
          <AccountAccordion account={nubankCreditCardId} onUpdate={sumMonthsCount} />
        </div>
      )}

      <div className="w-full max-w-md">
        <Button
          label="Continuar"
          className="w-full"
          disabled={monthsCount < 3}
          onClick={handleContinue}
        />
      </div>
    </ResumeOnboarding>
  );
}
