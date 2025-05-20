import { Button } from 'primereact/button';
import { FileUpload, FileUploadHandlerEvent } from 'primereact/fileupload';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useState } from 'react';

import { putSourceFile } from '../actions/sources';

interface SourceFileProps {
  onSuccess: (accountId: string) => void;
  accountId: string;
}

export default function SourceFile({ onSuccess, accountId }: SourceFileProps) {
  const [loading, setLoading] = useState(false);
  const [upload, setUpload] = useState<{ success: boolean | null; message: string }>({
    success: null,
    message: '',
  });
  const index = 0;

  async function handleUpload(event: FileUploadHandlerEvent) {
    setLoading(true);
    try {
      const result = await putSourceFile(event.files[0], accountId);
      setUpload({ success: true, message: `${result} lançamentos processados` });
      onSuccess(accountId);
    } catch (error) {
      console.error('Error uploading file:', (error as Error).name);
      if ((error as Error).name === 'InvalidSourceTypeError') {
        setUpload({
          success: false,
          message:
            'Tipo de arquivo inválido. Verifique se o arquivo corresponde ao tipo da conta (ex: cartão de crédito ou conta corrente)',
        });
      } else {
        setUpload({ success: false, message: 'Erro desconhecido ao processar o arquivo' });
      }
    } finally {
      setLoading(false);
    }
  }

  function handleRetry() {
    setUpload({ success: null, message: '' });
  }

  return (
    <div key={`source-${index}`} className="flex flex-col mb-4">
      {loading && (
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

      {!loading && upload.success !== false && (
        <FileUpload
          mode="basic"
          name="file"
          customUpload
          uploadHandler={(e) => handleUpload(e)}
          chooseLabel="Selecionar Arquivo"
          accept=".csv"
          className="w-full"
          maxFileSize={1_000_000}
          auto
        />
      )}

      {!loading && upload.success === true && (
        <div className="mt-2 p-3 bg-green-100 text-green-700 rounded-lg text-sm">
          {upload.message}
        </div>
      )}

      {!loading && upload.success === false && (
        <div className="flex flex-col gap-2">
          <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{upload.message}</div>
          <Button
            label="Selecionar outro arquivo"
            className="w-full p-button-outlined p-button-sm"
            onClick={() => handleRetry()}
          />
        </div>
      )}
    </div>
  );
}
