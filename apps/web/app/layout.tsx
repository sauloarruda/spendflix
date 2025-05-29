'use client';

import Image from 'next/image';
import { PrimeReactProvider } from 'primereact/api';

import './globals.css';
import ResumeOnboarding from '@/components/onboarding/ResumeOnboarding';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PrimeReactProvider>
      <html lang="pt-BR">
        <head>
          <title>Spendflix - Descubra, Organize, Realize</title>
        </head>
        <body suppressHydrationWarning>
          <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50">
            <div className="w-full ">
              <div className="flex justify-center mb-2">
                <Image src="/spendflix-logo.svg" alt="Spendflix" width={200} height={50} priority />
              </div>
              <ResumeOnboarding>{children}</ResumeOnboarding>
            </div>
          </div>
        </body>
      </html>
    </PrimeReactProvider>
  );
}
