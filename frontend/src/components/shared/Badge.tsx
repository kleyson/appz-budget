import { ReactNode } from 'react';

export type BadgeVariant = 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'muted';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  primary: 'badge badge-primary',
  success: 'badge badge-success',
  danger: 'badge badge-danger',
  warning: 'badge badge-warning',
  info: 'badge badge-info',
  muted: 'badge badge-muted',
};

export const Badge = ({ variant = 'primary', children, icon, className = '' }: BadgeProps) => {
  return (
    <span className={`${variantClasses[variant]} ${className}`}>
      {icon && <span className="mr-1">{icon}</span>}
      {children}
    </span>
  );
};

interface ColorChipProps {
  color: string;
  children: ReactNode;
  className?: string;
}

export const ColorChip = ({ color, children, className = '' }: ColorChipProps) => {
  const isDark = isColorDark(color);
  return (
    <span
      className={`color-chip ${className}`}
      style={{
        backgroundColor: color,
        color: isDark ? '#ffffff' : '#111827',
      }}
    >
      {children}
    </span>
  );
};

// Helper to determine if color is dark
function isColorDark(hexColor: string): boolean {
  const hex = hexColor.replace('#', '');
  if (hex.length !== 6) return false;
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
}
