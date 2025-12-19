import { InputHTMLAttributes, ReactNode } from 'react';
import { InputLabel } from './Typography';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: ReactNode;
  error?: string;
  required?: boolean;
}

export const FormInput = ({
  label,
  icon,
  error,
  required,
  className = '',
  ...props
}: FormInputProps) => {
  return (
    <div className="form-group">
      {label && <InputLabel required={required}>{label}</InputLabel>}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
            {icon}
          </div>
        )}
        <input
          className={`input-field ${icon ? 'pl-10' : ''} ${error ? 'border-red-500 focus:ring-red-500/30' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
    </div>
  );
};

interface FormSelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  label?: string;
  icon?: ReactNode;
  error?: string;
  required?: boolean;
  children: ReactNode;
}

export const FormSelect = ({
  label,
  icon,
  error,
  required,
  children,
  className = '',
  ...props
}: FormSelectProps) => {
  return (
    <div className="form-group">
      {label && <InputLabel required={required}>{label}</InputLabel>}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
            {icon}
          </div>
        )}
        <select
          className={`input-field ${icon ? 'pl-10' : ''} ${error ? 'border-red-500 focus:ring-red-500/30' : ''} ${className}`}
          {...props}
        >
          {children}
        </select>
      </div>
      {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
    </div>
  );
};
