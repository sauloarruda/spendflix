'use client';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const step = pathname?.includes('step') ? parseInt(pathname.split('step')[1], 10) : 1;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-2">
          <Image src="/spendflix-logo.svg" alt="Spendflix" width={200} height={50} priority />
        </div>
        <div className="w-full text-sm text-gray-500 mb-4 mt-8 text-center">Etapa {step} de 7</div>
        {children}
      </div>
    </div>
  );
}
