import React, { useEffect, useCallback, useState } from 'react';

import RequiredField from './RequiredField';

interface EmailFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (email: string, isValid: boolean) => void;
  message?: string;
}

export default function EmailField({ id, label, value, onChange, message }: EmailFieldProps) {
  const [isValid, setIsValid] = useState<boolean>(false);

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

  useEffect(() => {
    const storedEmail = localStorage.getItem('email') || '';
    if (storedEmail && !value) {
      const validation = validateEmail(storedEmail);
      setIsValid(validation.isValid);
      onChange(storedEmail, validation.isValid);
    }
  }, [value, validateEmail, onChange]);

  const handleChange = (newValue: string) => {
    const validation = validateEmail(newValue);
    setIsValid(validation.isValid);
    onChange(newValue, validation.isValid);
  };

  return (
    <RequiredField
      id={id}
      label={label}
      type="email"
      value={value}
      onChange={handleChange}
      customValidation={validateEmail}
      isValid={isValid}
    />
  );
}
