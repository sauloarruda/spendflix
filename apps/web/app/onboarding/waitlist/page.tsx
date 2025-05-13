'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import onboardingActions from '@/actions/onboarding';

export default function WaitlistPage() {
  const router = useRouter();
  const [name, setName] = useState<string>('');

  useEffect(() => {
    if (localStorage.getItem('onboardingUid') === null) {
      router.push('/onboarding/step1');
      return;
    }
    setName(localStorage.getItem('name') || '');
    const updateWaitlistStatus = async () => {
      await onboardingActions.updateOnboarding(localStorage.getItem('onboardingUid')!, {
        waitlist: true,
        finishedAt: new Date().toISOString(),
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
