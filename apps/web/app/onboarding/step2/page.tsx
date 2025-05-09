'use client';

import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { useState, useEffect, useRef } from 'react';

import { getOnboardingAction, updateOnboardingAction } from '@/actions/onboarding';

type Step2FormData = {
  goal: 'dream' | 'debt' | '';
  goalDescription: string;
  goalValue: number | null | undefined;
};

export default function OnboardingStep2() {
  const router = useRouter();
  const [name, setName] = useState<string>('');
  const descriptionInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Step2FormData>({
    goal: '',
    goalDescription: '',
    goalValue: undefined,
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const uid = localStorage.getItem('onboardingUid');
    if (!uid) return router.push('/onboarding/step1');

    const name = localStorage.getItem('name');
    setName(name || '');

    const getOnboarding = async () => {
      const onboarding = await getOnboardingAction(uid);
      setFormData({
        goal: onboarding.goal as 'dream' | 'debt',
        goalDescription: onboarding.goalDescription || '',
        goalValue: onboarding.goalValue || undefined,
      });
    };
    getOnboarding();
    setIsLoading(false);
  }, [router]);

  const handleGoalSelect = (goal: 'dream' | 'debt') => {
    setFormData((prev) => ({ ...prev, goal }));
    // Focus the description input after a short delay to ensure it's rendered
    setTimeout(() => {
      descriptionInputRef.current?.focus();
    }, 0);
  };

  const handleContinue = async () => {
    if (
      !formData.goal ||
      !formData.goalDescription.trim() ||
      formData.goalValue === undefined ||
      formData.goalValue === null ||
      formData.goalValue <= 0
    ) {
      return;
    }

    if (typeof window !== 'undefined') {
      const onboardingUid = localStorage.getItem('onboardingUid');
      if (onboardingUid) {
        await updateOnboardingAction(onboardingUid, {
          goal: formData.goal as 'dream' | 'debt',
          goalDescription: formData.goalDescription,
          goalValue: formData.goalValue,
          step: 3,
        });
      }
    }

    router.push('/onboarding/step3');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center">
        <strong className="mb-4">Preparando pra continuar...</strong>
        <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <h2 className="text-xl font-semibold mb-6 text-center">
        Olá {name}, muito prazer! <br />
        Me conta, o que te trouxe até aqui?
      </h2>

      <div className="grid grid-cols-2 gap-4 w-full max-w-md mb-12">
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
        <div className="w-full max-w-md space-y-8 mb-8">
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

      <div className="w-full max-w-md mt-4">
        <Button
          label="Continuar"
          className="w-full"
          disabled={
            !formData.goal ||
            !formData.goalDescription.trim() ||
            formData.goalValue === undefined ||
            formData.goalValue === null ||
            formData.goalValue <= 0
          }
          onClick={handleContinue}
        />
      </div>
    </>
  );
}
