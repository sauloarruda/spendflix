'use client';

import { OnboardingData } from '@/modules/users';
import { useRouter } from 'next/navigation';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Button } from 'primereact/button';
import { useState } from 'react';

import { createAccountAction } from '@/actions/accounts';
import { updateOnboardingAction } from '@/actions/onboarding';
import CountTransactionsPerMonth from '@/components/CountTransactionsPerMonth';
import ResumeOnboarding from '@/components/ResumeOnboarding';
import SourceFile from '@/components/SourceFile';
import { SourceType } from '@/prisma';

export default function OnboardingStep4() {
  const router = useRouter();
  const [monthsCount, setMonthsCount] = useState(0);
  const [nubankAccountId, setNubankAccountId] = useState('');
  const [nubankAccountTs, setNubankAccountTs] = useState(0);
  const [nubankCreditCardId, setNubankCreditCardId] = useState('');
  const [nubankCreditCardTs, setNubankCreditCardTs] = useState(0);

  function sumMonthsCount(updatedMonthsCount: number) {
    setMonthsCount(monthsCount + updatedMonthsCount);
  }

  async function handleResumeOnboarding(onboarding: OnboardingData, userId: number) {
    setNubankAccountId(
      await createAccountAction({
        userId,
        bankNumber: '260', // only nubank now
        name: 'Conta Corrente',
        color: 'green-500',
        sourceType: SourceType.NUBANK_ACCOUNT_CSV,
      }),
    );

    setNubankCreditCardId(
      await createAccountAction({
        userId,
        bankNumber: '260', // only nubank now
        name: 'Cartão de Crédito',
        color: 'orange-500',
        sourceType: SourceType.NUBANK_CREDIT_CARD_CSV,
      }),
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

      <div className="w-full max-w-md mb-8">
        <Accordion multiple activeIndex={null}>
          <AccordionTab
            header={
              <div className="flex justify-between items-center w-full">
                <span className="text-green-500">Conta Corrente</span>
                <span className="text-blue-500 text-xs hover:underline">Como obter o extrato?</span>
              </div>
            }
          >
            <SourceFile
              accountId={nubankAccountId}
              onSuccess={() => setNubankAccountTs(new Date().getTime())}
            />
            <CountTransactionsPerMonth
              accountId={nubankAccountId}
              ts={nubankAccountTs}
              onUpdate={sumMonthsCount}
            />
          </AccordionTab>
        </Accordion>
        <Accordion multiple activeIndex={null}>
          <AccordionTab
            header={
              <div className="flex justify-between items-center w-full">
                <span className="text-orange-500">Cartão de Crédito</span>
                <span className="text-blue-500 text-xs hover:underline">Como obter o extrato?</span>
              </div>
            }
          >
            <SourceFile
              accountId={nubankCreditCardId}
              onSuccess={() => setNubankCreditCardTs(new Date().getTime())}
            />
            <CountTransactionsPerMonth
              accountId={nubankCreditCardId}
              ts={nubankCreditCardTs}
              onUpdate={sumMonthsCount}
            />
          </AccordionTab>
        </Accordion>
      </div>

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
