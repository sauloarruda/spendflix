'use client';

import { useRouter } from 'next/navigation';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { useState, useRef } from 'react';

import OnboardingNavigation from '@/components/onboarding/OnboardingNavigation';
import { useOnboarding } from '@/contexts/OnboardingContext';

type Step2FormData = {
  goal: 'dream' | 'debt' | '';
  goalDescription: string;
  goalValue: number | null | undefined;
};

// eslint-disable-next-line max-lines-per-function, complexity
export default function OnboardingStep2() {
  const router = useRouter();
  const descriptionInputRef = useRef<HTMLInputElement>(null);
  const { updateOnboarding, onboardingData } = useOnboarding();
  const [isLoading, setIsLoading] = useState(false);

  // Inicializa o estado local apenas na primeira renderização
  const [formData, setFormData] = useState<Step2FormData>({
    goal: onboardingData?.goal || '',
    goalDescription: onboardingData?.goalDescription || '',
    goalValue: onboardingData?.goalValue ?? undefined,
  });

  const handleGoalSelect = (goal: 'dream' | 'debt') => {
    setFormData((prev) => ({ ...prev, goal }));
    setTimeout(() => {
      descriptionInputRef.current?.focus();
    }, 0);
  };

  const handleContinue = async () => {
    setIsLoading(true);
    await updateOnboarding({
      goal: formData.goal as 'dream' | 'debt',
      goalDescription: formData.goalDescription,
      goalValue: formData.goalValue!,
      step: 3,
    });
    router.push('/onboarding/step3');
  };

  return (
    <>
      <h2 className="text-xl font-semibold mb-6 text-center">
        Olá {onboardingData?.name || ''}, muito prazer! <br />
        Me conta, o que te trouxe até aqui?
      </h2>

      <div className="grid grid-cols-2 gap-4 w-full max-w-md mb-12 mx-auto">
        <div
          className={`border rounded-lg p-4 text-center cursor-pointer transition
          ${formData.goal === 'dream' ? 'bg-primary/20 border-primary' : 'border-gray-300 bg-white'}`}
          onClick={() => handleGoalSelect('dream')}
        >
          <div className="text-2xl mb-2">🏖️</div>
          <div className="font-semibold mb-1">Quero realizar um sonho</div>
          <div className="text-sm text-gray-600">
            Guardar para viajar, comprar algo importante, mudar de vida.
          </div>
        </div>

        <div
          className={`border rounded-lg p-4 text-center cursor-pointer transition
          ${formData.goal === 'debt' ? 'bg-primary/20 border-primary' : 'border-gray-300 bg-white'}`}
          onClick={() => handleGoalSelect('debt')}
        >
          <div className="text-2xl mb-2">💳</div>
          <div className="font-semibold mb-1">Quero sair das dívidas</div>
          <div className="text-sm text-gray-600">
            Organizar minhas contas e retomar o controle financeiro.
          </div>
        </div>
      </div>

      {formData.goal && (
        <div className="w-full max-w-md space-y-8 mb-8 mx-auto">
          <div className="flex flex-col">
            <span className="p-float-label">
              <InputText
                ref={descriptionInputRef}
                id="description"
                value={formData.goalDescription}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, goalDescription: e.target.value }))
                }
                className="w-full"
              />
              <label htmlFor="description">
                {formData.goal === 'dream' ? 'Qual é o seu sonho?' : 'Qual é a dívida?'}
              </label>
            </span>
          </div>

          <div className="flex flex-col">
            <span className="p-float-label">
              <InputNumber
                id="amount"
                value={formData.goalValue}
                onValueChange={(e) => {
                  setFormData((prev) => ({ ...prev, goalValue: e.value }));
                }}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, goalValue: e.value }));
                }}
                mode="currency"
                currency="BRL"
                locale="pt-BR"
                minFractionDigits={2}
                maxFractionDigits={2}
                className="w-full"
                autoFocus
              />
              <label htmlFor="amount">Quanto você precisa?</label>
            </span>
          </div>
        </div>
      )}

      <OnboardingNavigation
        disabled={
          isLoading ||
          !formData.goal ||
          !formData.goalDescription.trim() ||
          formData.goalValue === undefined ||
          formData.goalValue === null ||
          formData.goalValue <= 0
        }
        onClick={handleContinue}
      />
    </>
  );
}
