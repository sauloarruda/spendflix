import React, { useEffect, useCallback } from 'react';

import RequiredField from './RequiredField';

interface EmailFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (email: string, isValid: boolean) => void;
  message?: string;
}

export default function EmailField({ id, label, value, onChange, message }: EmailFieldProps) {
  const validateEmail = useCallback(
    (email: string) => {
      if (!email.trim()) {
        return { isValid: false, message: message || 'Por favor, insira seu email.' };
      }
      if (!/\S+@\S+\.\S+/.test(email)) {
        return { isValid: false, message: 'Email inválido.' };
      }
      return { isValid: true };
    },
    [message],
  );

  // Only load stored email on initial mount
  useEffect(() => {
    const storedEmail = localStorage.getItem('email') || '';
    if (storedEmail && !value) {
      const { isValid } = validateEmail(storedEmail);
      onChange(storedEmail, isValid);
    }
  }, []); // Empty dependency array means this only runs once on mount

  const handleChange = (newValue: string) => {
    const { isValid } = validateEmail(newValue);
    onChange(newValue, isValid);
  };

  return (
    <RequiredField
      id={id}
      label={label}
      value={value}
      onChange={handleChange}
      customValidation={validateEmail}
    />
  );
}
