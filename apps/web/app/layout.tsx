'use client';

import { PrimeReactProvider } from 'primereact/api';
import './globals.css';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PrimeReactProvider>
      <html lang="pt-BR">
        <body>{children}</body>
      </html>
    </PrimeReactProvider>
  );
}
