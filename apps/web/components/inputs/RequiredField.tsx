import { InputText } from 'primereact/inputtext';
import React, { useState } from 'react';

interface RequiredFieldProps {
  id: string;
  label: string;
  value: string;
  type?:
    | 'text'
    | 'email'
    | 'password'
    | 'number'
    | 'month'
    | 'search'
    | 'tel'
    | 'time'
    | 'url'
    | 'week';
  onChange: (value: string, isValid: boolean) => void;
  message?: string;
  customValidation?: (value: string) => { isValid: boolean; message?: string };
  maxLength?: number;
  isValid?: boolean;
}

export default function RequiredField({
  id,
  label,
  value,
  type,
  onChange,
  message,
  customValidation,
  maxLength,
  isValid: externalIsValid,
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
    onChange(newValue, validate(newValue));
  };

  const handleBlur = () => {
    setTouched(true);
    onChange(value, validate(value));
  };

  const showValidationIcon =
    externalIsValid !== undefined ? true : touched && value.trim().length > 0;
  const isValid =
    externalIsValid !== undefined ? externalIsValid : !error && value.trim().length > 0;

  return (
    <div className="flex flex-col">
      <span className="p-float-label relative">
        <InputText
          id={id}
          value={value}
          type={type || 'text'}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          className={`w-full ${touched && error ? 'p-invalid' : ''}`}
          maxLength={maxLength}
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
