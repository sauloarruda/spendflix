'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateOnboardingStep, getOnboardingData } from '@/app/actions/onboarding';

export default function WaitlistPage() {
  const router = useRouter();
  const [name, setName] = useState<string>('');

  useEffect(() => {
    const email = localStorage.getItem('email');
    if (!email) {
      router.push('/onboarding/step1');
      return;
    }

    const updateWaitlistStatus = async () => {
      const existingData = await getOnboardingData(email);
      if (!existingData) {
        router.push('/onboarding/step1');
        return;
      }

      setName(existingData.name || '');
      await updateOnboardingStep(email, {
        ...existingData,
        waitlist: true,
        finishedAt: new Date(),
      });
    };

    updateWaitlistStatus();
  }, [router]);

  return (
    <>
      <h2 className="text-xl font-semibold mb-6 mt-8 text-center">Que pena {name}...</h2>

      <p className="text-gray-600 text-center mb-4 max-w-md">
        Ainda não suportamos seu banco, mas estamos trabalhando para expandir.
      </p>
      <p className="text-gray-600 text-center mt-4 max-w-md">
        Seu email já está cadastrado na lista de espera e{' '}
        <strong>avisaremos assim que estiver disponível!</strong>
      </p>
      <p className="text-gray-600 text-center mt-4 max-w-md">Desejamos sucesso!</p>
    </>
  );
}
