'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';

export default function OnboardingStep2() {
  const router = useRouter();
  const [goal, setGoal] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | null | undefined>(undefined);

  const handleContinue = () => {
    if (!goal || !description.trim() || amount === undefined || amount === null || amount <= 0) {
      return;
    }
    router.push('/onboarding/step3');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50">
      <div className="text-sm text-gray-500 mb-4">Etapa 2 de 7</div>

      <h2 className="text-xl font-semibold mb-6 text-center">O que te trouxe até aqui?</h2>

      <div className="grid grid-cols-2 gap-4 w-full max-w-md mb-12">
        <div
          className={`border rounded-lg p-4 text-center cursor-pointer transition
          ${goal === 'dream' ? 'bg-primary/20 border-primary' : 'border-gray-300 bg-white'}`}
          onClick={() => setGoal('dream')}
        >
          <div className="text-2xl mb-2">🏖️</div>
          <div className="font-semibold mb-1">Quero realizar um sonho</div>
          <div className="text-sm text-gray-600">
            Guardar para viajar, comprar algo importante, mudar de vida.
          </div>
        </div>

        <div
          className={`border rounded-lg p-4 text-center cursor-pointer transition
          ${goal === 'debt' ? 'bg-primary/20 border-primary' : 'border-gray-300 bg-white'}`}
          onClick={() => setGoal('debt')}
        >
          <div className="text-2xl mb-2">💳</div>
          <div className="font-semibold mb-1">Quero sair das dívidas</div>
          <div className="text-sm text-gray-600">
            Organizar minhas contas e retomar o controle financeiro.
          </div>
        </div>
      </div>

      {goal && (
        <div className="w-full max-w-md space-y-6 mb-6">
          <div className="flex flex-col">
            <span className="p-float-label">
              <InputText
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full"
              />
              <label htmlFor="description">
                {goal === 'dream' ? 'Qual é o seu sonho?' : 'Qual é a dívida?'}
              </label>
            </span>
          </div>

          <div className="flex flex-col">
            <span className="p-float-label">
              <InputNumber
                id="amount"
                value={amount}
                onValueChange={(e) => setAmount(e.value)}
                mode="currency"
                currency="BRL"
                locale="pt-BR"
                minFractionDigits={2}
                maxFractionDigits={2}
                className="w-full"
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
            !goal || !description.trim() || amount === undefined || amount === null || amount <= 0
          }
          onClick={handleContinue}
        />
      </div>
    </div>
  );
}
