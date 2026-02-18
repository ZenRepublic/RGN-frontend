import type { ChangeEvent, InputHTMLAttributes } from 'react';
import './InputField.css';

interface InputFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function InputField({ label, value, onChange, ...props }: InputFieldProps) {
  return (
    <div className="input-field">
      <label>{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        {...props}
      />
    </div>
  );
}
