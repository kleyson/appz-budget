import { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'success'
  | 'ghost'
  | 'add'
  | 'add-success';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: ReactNode;
  children: ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  danger: 'btn-danger',
  success: 'btn-success',
  ghost: 'btn-ghost',
  add: 'btn-add',
  'add-success': 'btn-add-success',
};

export const Button = ({
  variant = 'primary',
  icon,
  children,
  fullWidth,
  className = '',
  disabled,
  ...props
}: ButtonProps) => {
  return (
    <button
      className={`${variantClasses[variant]} ${fullWidth ? 'w-full' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
};

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'ghost';
  icon: ReactNode;
  title?: string;
}

const iconVariantClasses = {
  primary: 'icon-btn-primary',
  danger: 'icon-btn-danger',
  ghost: 'icon-btn-ghost',
};

export const IconButton = ({
  variant = 'ghost',
  icon,
  className = '',
  ...props
}: IconButtonProps) => {
  return (
    <button className={`${iconVariantClasses[variant]} ${className}`} {...props}>
      {icon}
    </button>
  );
};
