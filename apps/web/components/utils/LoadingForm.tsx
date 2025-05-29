import React, { useEffect, useState } from 'react';

interface LoadingFormProps {
  message: string;
  onLoad: () => Promise<void>;
  children: React.ReactNode;
}

export default function LoadingForm({ message, onLoad, children }: LoadingFormProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isLoading) return;
    const load = async () => {
      await onLoad();
      setIsLoading(false);
    };
    load();
  }, [onLoad, isLoading]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center">
        <strong className="mb-4">{message}</strong>
        <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return <>{children}</>;
}
