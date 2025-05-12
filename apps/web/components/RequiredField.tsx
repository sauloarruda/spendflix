import { InputText } from 'primereact/inputtext';
import React, { useState } from 'react';

interface RequiredFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  message?: string;
  customValidation?: (value: string) => { isValid: boolean; message?: string };
}

export default function RequiredField({
  id,
  label,
  value,
  onChange,
  message,
  customValidation,
}: RequiredFieldProps) {
  const [error, setError] = useState<string>('');
  const [touched, setTouched] = useState<boolean>(false);

  const validate = (inputValue: string) => {
    if (customValidation) {
      const result = customValidation(inputValue);
      setError(result.message || '');
      return result.isValid;
    }

    if (!inputValue.trim()) {
      setError(message || 'Este campo é obrigatório.');
      return false;
    }
    setError('');
    return true;
  };

  const handleChange = (newValue: string) => {
    validate(newValue);
    onChange(newValue);
  };

  const handleBlur = () => {
    setTouched(true);
    validate(value);
  };

  const showValidationIcon = touched && value.trim().length > 0;
  const isValid = !error && value.trim().length > 0;

  return (
    <div className="flex flex-col">
      <span className="p-float-label relative">
        <InputText
          id={id}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          className={`w-full ${touched && error ? 'p-invalid' : ''}`}
        />
        <label htmlFor={id}>{label}</label>
        {showValidationIcon && (
          <i
            className={`absolute right-3 top-1/2 -translate-y-1/2 pi ${isValid ? 'pi-check text-green-500' : 'pi-times text-red-500'}`}
            style={{ fontSize: 18 }}
          />
        )}
      </span>
      {touched && error && <small className="text-red-500 mt-1">{error}</small>}
    </div>
  );
}
