'use client';

import Link from 'next/link';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Button } from 'primereact/button';

import SourceFile from '@/components/SourceFile';

export default function OnboardingStep4() {
  function handleContinue() {}

  return (
    <>
      <h2 className="text-xl font-semibold mb-6 text-center">Prepare seus extratos</h2>

      <p className="text-gray-600 text-center mb-8 max-w-md">
        Para descobrir sobre suas finanças, precisamos dos extratos da sua Conta Corrente e do seu
        Cartão de Crédito Nubank.
        <br />
        Envie pelo menos 3 meses. O ideal são 6 meses!
      </p>

      <div className="w-full max-w-md mb-8">
        <Accordion multiple activeIndex={null}>
          <AccordionTab
            header={
              <div className="flex justify-between items-center w-full">
                <span>Conta Corrente</span>
                <Link href="#" className="text-blue-500 text-xs hover:underline">
                  Como obter o extrato?
                </Link>
              </div>
            }
          >
            {/* {uploadsConta.map((upload, index) => (

                ))} */}
            <SourceFile />
          </AccordionTab>
        </Accordion>
      </div>

      <div className="w-full max-w-md">
        <Button
          label="Continuar"
          className="w-full"
          disabled={
            true
            // [...uploadsConta, ...uploadsCartao].filter((upload) => upload.success === true).length <
            // 3
          }
          onClick={handleContinue}
        />
      </div>
    </>
  );
}
