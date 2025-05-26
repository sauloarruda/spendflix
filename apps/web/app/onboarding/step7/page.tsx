'use client';

import { OnboardingData } from '@/modules/users';
import { TabPanel, TabView } from 'primereact/tabview';
import { useState } from 'react';

import OnboardingNavigation from '@/components/onboarding/OnboardingNavigation';
import ResumeOnboarding from '@/components/onboarding/ResumeOnboarding';
import BudgetReport from '@/components/reports/BudgetReport';
import ResultsReport from '@/components/reports/ResultsReport';
import { ResultsReportProvider } from '@/contexts/ResultsReportContext';
import { TransactionsProvider } from '@/contexts/TransactionsContext';

export default function OnboardingStep7() {
  const [userId, setUserId] = useState<number>();
  const [activeIndex, setActiveIndex] = useState<number>(0);

  function handleResumeOnboarding(_onboarding: OnboardingData, onboardingUserId: number) {
    setUserId(onboardingUserId);
  }

  function handleContinue() {
    alert('TODO');
  }

  return (
    <ResumeOnboarding message="Carregando nosso último passso!" onResume={handleResumeOnboarding}>
      <h2 className="text-xl font-semibold mb-6 text-center">
        Muito bem!
        <br /> Agora chegou a hora de{' '}
        <strong className="font-extrabold text-green-700">realizar</strong>!
      </h2>
      <p className="text-gray-600 text-center mb-8 max-w-md mx-auto">
        Vamos analisar sua capacidade financeira em <strong>resultados</strong> e propor uma
        primeira versão do seu <strong>orçamento</strong>.
      </p>
      {userId && (
        <TransactionsProvider userId={userId}>
          <TabView
            className="border-1 border-gray-300"
            activeIndex={activeIndex}
            onTabChange={(e) => setActiveIndex(e.index)}
          >
            <TabPanel header="Resultados">
              <ResultsReportProvider>
                <ResultsReport />
              </ResultsReportProvider>
            </TabPanel>
            <TabPanel header="Orçamento">
              <BudgetReport />
            </TabPanel>
          </TabView>
        </TransactionsProvider>
      )}

      <OnboardingNavigation onClick={handleContinue} />
    </ResumeOnboarding>
  );
}
