'use client';

import { OnboardingData } from '@/modules/users';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { TabPanel, TabView } from 'primereact/tabview';
import { useState } from 'react';

import { updateOnboardingAction } from '@/actions/onboarding';
import ResumeOnboarding from '@/components/ResumeOnboarding';
import ExpensesReport from '@/components/reports/ExpensesReport';
import RevenueReport from '@/components/reports/RevenueReport';
import { TransactionsProvider } from '@/contexts/TransactionsContext';

export default function OnboardingStep6() {
  const router = useRouter();
  const [userId, setUserId] = useState<number>();
  const [activeIndex, setActiveIndex] = useState<number>(0);
  function handleResumeOnboarding(_onboarding: OnboardingData, onboardingUserId: number) {
    setUserId(onboardingUserId);
  }

  async function handleContinue() {
    await updateOnboardingAction(localStorage.getItem('onboardingUid')!, { step: 7 });
    router.push('/onboarding/step7');
  }

  return (
    <ResumeOnboarding message="Preparando para continuar..." onResume={handleResumeOnboarding}>
      <h2 className="text-xl font-semibold mb-6 text-center">
        Parabéns! Agora suas finanças estão organizadas!
        <br />
        Vamos analisar seus dados.
      </h2>
      <p className="text-gray-600 text-center mb-8 max-w-md">
        Nós dividimos seus lançamentos em 3 grandes categorias: Receitas, Despesas e Resultado.
        Navegue pelas sessões e analise se os dados estão corretos. Você pode corrigir categorias e
        ignorar lançamentos neste momento.
      </p>
      {userId && (
        <TransactionsProvider userId={userId}>
          <TabView
            className="border-1 border-gray-300"
            activeIndex={activeIndex}
            onTabChange={(e) => setActiveIndex(e.index)}
          >
            <TabPanel header="Receitas">
              <RevenueReport />
            </TabPanel>
            <TabPanel header="Despesas">
              <ExpensesReport />
            </TabPanel>
            <TabPanel header="Resultado"></TabPanel>
          </TabView>
        </TransactionsProvider>
      )}
      <div className="w-full max-w-md mt-4">
        <Button label="Continuar" className="w-full" onClick={handleContinue} />
      </div>
    </ResumeOnboarding>
  );
}
