import { ReactNode } from 'react';

interface ButtonProps {
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  children: ReactNode;
}

export function Button({ className, onClick, disabled, title, children }: ButtonProps) {
  return (
    <button
      className={className}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  );
}
