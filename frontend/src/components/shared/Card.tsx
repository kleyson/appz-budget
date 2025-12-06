import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  variant?: 'default' | 'glass';
  hover?: boolean;
  className?: string;
}

export const Card = ({ children, variant = 'default', hover = false, className = '' }: CardProps) => {
  const baseClass = variant === 'glass' ? 'card-glass' : 'card';
  const hoverClass = hover ? 'card-hover' : '';

  return <div className={`${baseClass} ${hoverClass} ${className}`}>{children}</div>;
};

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export const CardHeader = ({ children, className = '' }: CardHeaderProps) => {
  return (
    <div className={`p-5 lg:p-6 border-b border-slate-200 dark:border-slate-800 ${className}`}>
      {children}
    </div>
  );
};

interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

export const CardBody = ({ children, className = '' }: CardBodyProps) => {
  return <div className={`p-5 lg:p-6 ${className}`}>{children}</div>;
};
