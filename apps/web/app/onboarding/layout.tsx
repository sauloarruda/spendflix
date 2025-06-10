'use client';

import { usePathname } from 'next/navigation';

import { OnboardingProvider } from '@/contexts/OnboardingContext';

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const step = pathname?.includes('step') ? parseInt(pathname.split('step')[1], 10) : undefined;

  return (
    <OnboardingProvider>
      {step ? (
        <div className="w-full text-sm text-gray-500 mb-4 mt-8 text-center">Etapa {step} de 7</div>
      ) : (
        ''
      )}
      {children}
    </OnboardingProvider>
  );
}
