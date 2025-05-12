import { InputText } from 'primereact/inputtext';
import React, { useState } from 'react';

interface RequiredFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  message: string;
  className?: string;
}

export default function RequiredField({
  id,
  label,
  value,
  onChange,
  message,
  className = '',
}: RequiredFieldProps) {
  const [touched, setTouched] = useState(false);
  const hasError = touched && !value.trim();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleBlur = () => {
    setTouched(true);
  };

  return (
    <div className="flex flex-col">
      <span className="p-float-label">
        <InputText
          id={id}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`w-full ${hasError ? 'p-invalid' : ''} ${className}`}
        />
        <label htmlFor={id}>{label}</label>
      </span>
      {hasError && <small className="text-red-500 mt-1">{message}</small>}
    </div>
  );
}
