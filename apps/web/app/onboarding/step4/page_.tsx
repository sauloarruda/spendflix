'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { FileUpload, FileUploadHandlerEvent } from 'primereact/fileupload';
import { Button } from 'primereact/button';
import Link from 'next/link';
import { ProgressSpinner } from 'primereact/progressspinner';

// Simula um POST para envio de arquivo com tempo aleatório
async function postTransactionsFile(file: File): Promise<{ success: boolean; message: string }> {
  console.log('file', file);
  return new Promise((resolve) => {
    const randomDelay = Math.floor(Math.random() * (10000 - 500 + 1)) + 500; // 500ms a 10s
    setTimeout(() => {
      const random = Math.random();
      if (random < 0.75) {
        const totalTransactions = Math.floor(Math.random() * 80) + 20;
        const startMonth = Math.floor(Math.random() * 12) + 1;
        const endMonth = startMonth < 12 ? startMonth + 1 : 1;
        const startYear = 2023 + Math.floor(Math.random() * 2);
        const endYear = startMonth === 12 ? startYear + 1 : startYear;
        const formattedStart = `${startMonth.toString().padStart(2, '0')}/${startYear}`;
        const formattedEnd = `${endMonth.toString().padStart(2, '0')}/${endYear}`;

        resolve({
          success: true,
          message: `✅ Pronto! Processamos ${totalTransactions} transações entre ${formattedStart} e ${formattedEnd}.`,
        });
      } else {
        const errors = [
          'Falha no upload. Tente novamente.',
          'Formato inválido. Por favor, envie um arquivo .csv exportado pelo seu banco conforme as instruções.',
          'Este extrato já foi enviado anteriormente.',
          'Erro interno ao processar o arquivo. Tente novamente em alguns minutos.',
        ];
        const errorMessage = errors[Math.floor(Math.random() * errors.length)];
        resolve({
          success: false,
          message: errorMessage,
        });
      }
    }, randomDelay);
  });
}

type UploadStatus = {
  success: boolean | null;
  message: string;
};

export default function OnboardingStep4() {
  const router = useRouter();
  const inputRefsConta = useRef<(HTMLInputElement | null)[]>([]);
  const inputRefsCartao = useRef<(HTMLInputElement | null)[]>([]);

  const [uploadsConta, setUploadsConta] = useState<UploadStatus[]>(
    Array(6).fill({ success: null, message: '' }),
  );
  const [uploadsCartao, setUploadsCartao] = useState<UploadStatus[]>(
    Array(6).fill({ success: null, message: '' }),
  );
  const [loadingConta, setLoadingConta] = useState<boolean[]>(Array(6).fill(false));
  const [loadingCartao, setLoadingCartao] = useState<boolean[]>(Array(6).fill(false));

  const handleUpload = async (
    event: FileUploadHandlerEvent,
    index: number,
    tipo: 'conta' | 'cartao',
  ) => {
    const file = event.files[0];

    if (file.type !== 'text/csv') {
      updateUploadStatus(index, false, 'Apenas arquivos .csv são aceitos.', tipo);
      return;
    }

    setLoading(index, true, tipo);

    const response = await postTransactionsFile(file);

    setLoading(index, false, tipo);
    updateUploadStatus(index, response.success, response.message, tipo);
  };

  const setLoading = (index: number, value: boolean, tipo: 'conta' | 'cartao') => {
    if (tipo === 'conta') {
      setLoadingConta((prev) => {
        const updated = [...prev];
        updated[index] = value;
        return updated;
      });
    } else {
      setLoadingCartao((prev) => {
        const updated = [...prev];
        updated[index] = value;
        return updated;
      });
    }
  };

  const updateUploadStatus = (
    index: number,
    success: boolean,
    message: string,
    tipo: 'conta' | 'cartao',
  ) => {
    if (tipo === 'conta') {
      setUploadsConta((prev) => {
        const updated = [...prev];
        updated[index] = { success, message };
        return updated;
      });
    } else {
      setUploadsCartao((prev) => {
        const updated = [...prev];
        updated[index] = { success, message };
        return updated;
      });
    }
  };

  const handleRetry = (index: number, tipo: 'conta' | 'cartao') => {
    const input = tipo === 'conta' ? inputRefsConta.current[index] : inputRefsCartao.current[index];
    input?.click();
  };

  const handleContinue = () => {
    const totalSuccess = [...uploadsConta, ...uploadsCartao].filter(
      (upload) => upload.success === true,
    ).length;
    if (totalSuccess >= 3) {
      router.push('/onboarding/step5');
    }
  };

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
            {uploadsConta.map((upload, index) => (
              <div key={`conta-${index}`} className="flex flex-col mb-4">
                <label className="block text-sm text-gray-600 mb-1">{`Arquivo do mês ${index + 1}`}</label>

                {loadingConta[index] && (
                  <div className="p-3 bg-gray-100 text-gray-700 rounded-lg text-sm animate-pulse">
                    <ProgressSpinner
                      style={{ width: '12px', height: '12px' }}
                      strokeWidth="8"
                      fill="var(--surface-ground)"
                      animationDuration="1s"
                    />
                    <span className="ml-2">Processando arquivo...</span>
                  </div>
                )}

                {!loadingConta[index] && upload.success === null && (
                  <FileUpload
                    mode="basic"
                    name="file"
                    customUpload
                    uploadHandler={(e) => handleUpload(e, index, 'conta')}
                    chooseLabel="Selecionar Arquivo"
                    accept=".csv"
                    className="w-full"
                    maxFileSize={1000000}
                    auto
                    ref={(el) => {
                      inputRefsCartao.current[index] = el?.getInput?.() || null;
                    }}
                  />
                )}

                {upload.success === true && (
                  <div className="p-3 bg-green-100 text-green-700 rounded-lg text-sm">
                    {upload.message}
                  </div>
                )}

                {upload.success === false && (
                  <div className="flex flex-col gap-2">
                    <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                      {upload.message}
                    </div>
                    <Button
                      label="Selecionar outro arquivo"
                      className="w-full p-button-outlined p-button-sm"
                      onClick={() => handleRetry(index, 'conta')}
                    />
                  </div>
                )}
              </div>
            ))}
          </AccordionTab>

          <AccordionTab
            header={
              <div className="flex justify-between items-center w-full">
                <span>Cartão de Crédito</span>
                <Link href="#" className="text-blue-500 text-xs hover:underline">
                  Como obter o extrato?
                </Link>
              </div>
            }
          >
            {uploadsCartao.map((upload, index) => (
              <div key={`cartao-${index}`} className="flex flex-col mb-4">
                <label className="block text-sm text-gray-600 mb-1">{`Arquivo do mês ${index + 1}`}</label>

                {loadingCartao[index] && (
                  <div className="p-3 bg-gray-100 text-gray-700 rounded-lg text-sm text-center animate-pulse">
                    Processando arquivo...
                  </div>
                )}

                {!loadingCartao[index] && upload.success === null && (
                  <FileUpload
                    mode="basic"
                    name="file"
                    customUpload
                    uploadHandler={(e) => handleUpload(e, index, 'cartao')}
                    chooseLabel="Selecionar Arquivo"
                    accept=".csv"
                    className="w-full"
                    maxFileSize={1000000}
                    auto
                    ref={(el) => {
                      inputRefsCartao.current[index] = el?.getInput?.() || null;
                    }}
                  />
                )}

                {upload.success === true && (
                  <div className="p-3 bg-green-100 text-green-700 rounded-lg text-sm">
                    {upload.message}
                  </div>
                )}

                {upload.success === false && (
                  <div className="flex flex-col gap-2">
                    <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                      {upload.message}
                    </div>
                    <Button
                      label="Selecionar outro arquivo"
                      className="w-full p-button-outlined p-button-sm"
                      onClick={() => handleRetry(index, 'cartao')}
                    />
                  </div>
                )}
              </div>
            ))}
          </AccordionTab>
        </Accordion>
      </div>

      <div className="w-full max-w-md">
        <Button
          label="Continuar"
          className="w-full"
          disabled={
            [...uploadsConta, ...uploadsCartao].filter((upload) => upload.success === true).length <
            3
          }
          onClick={handleContinue}
        />
      </div>
    </>
  );
}
