import { ReactNode } from 'react';

interface SectionTitleProps {
  children: ReactNode;
  icon?: ReactNode;
  iconBgClass?: string;
  className?: string;
}

export const SectionTitle = ({
  children,
  icon,
  iconBgClass = 'bg-primary-500/10 dark:bg-primary-500/15 text-primary-600 dark:text-primary-400',
  className = '',
}: SectionTitleProps) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {icon && <div className={`p-2 rounded-lg ${iconBgClass}`}>{icon}</div>}
      <h3 className="section-title">{children}</h3>
    </div>
  );
};

interface PageTitleProps {
  children: ReactNode;
  subtitle?: string;
  className?: string;
}

export const PageTitle = ({ children, subtitle, className = '' }: PageTitleProps) => {
  return (
    <div className={className}>
      <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">{children}</h2>
      {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
    </div>
  );
};

interface InputLabelProps {
  children: ReactNode;
  required?: boolean;
  className?: string;
}

export const InputLabel = ({ children, required, className = '' }: InputLabelProps) => {
  return (
    <label className={`input-label ${className}`}>
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
};

interface ValueDisplayProps {
  label: string;
  value: string | number;
  valueColor?: string;
  align?: 'left' | 'right';
  className?: string;
}

export const ValueDisplay = ({
  label,
  value,
  valueColor,
  align = 'right',
  className = '',
}: ValueDisplayProps) => {
  return (
    <div className={`${align === 'right' ? 'text-right' : ''} ${className}`}>
      <p className="value-label">{label}</p>
      <p className={`value-amount ${valueColor || ''}`}>{value}</p>
    </div>
  );
};
