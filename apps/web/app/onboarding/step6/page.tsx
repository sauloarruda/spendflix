'use client';

import { useRouter } from 'next/navigation';
import { TabPanel, TabView } from 'primereact/tabview';
import { useState } from 'react';

import OnboardingNavigation from '@/components/onboarding/OnboardingNavigation';
import ExpensesReport from '@/components/reports/ExpensesReport';
import RevenueReport from '@/components/reports/RevenueReport';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { TransactionsProvider } from '@/contexts/TransactionsContext';

export default function OnboardingStep6() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const { userId, updateOnboarding } = useOnboarding();

  async function handleContinue() {
    await updateOnboarding({ step: 7 });
    router.push('/onboarding/step7');
  }

  return (
    <>
      <h2 className="text-xl font-semibold mb-6 text-center">
        Parabéns!
        <br /> Agora suas finanças estão{' '}
        <strong className="font-extrabold text-green-700">organizadas</strong>!
      </h2>
      <p className="text-gray-600 text-center mb-8 max-w-md mx-auto">
        Avalie os totais para cada mês e categoria, confira se os lançamentos foram corretamente
        categorizados e altere se precisar. Use os filtros pra ver com mais detalhes alguma
        categoria ou mês.
      </p>
      {userId && (
        <TransactionsProvider userId={userId}>
          <TabView
            className="border-1 border-gray-300 lg:w-5/6 md:w-full mx-auto"
            activeIndex={activeIndex}
            onTabChange={(e) => setActiveIndex(e.index)}
          >
            <TabPanel header="Receitas">
              <RevenueReport />
            </TabPanel>
            <TabPanel header="Despesas">
              <ExpensesReport />
            </TabPanel>
          </TabView>
        </TransactionsProvider>
      )}
      <OnboardingNavigation onClick={handleContinue} />
    </>
  );
}
