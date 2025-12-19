interface ProgressBarProps {
  progress: number;
  color?: 'primary' | 'success' | 'danger' | 'warning';
  showPercentage?: boolean;
  className?: string;
}

const colorClasses = {
  primary: 'bg-primary-500',
  success: 'bg-emerald-500',
  danger: 'bg-red-500',
  warning: 'bg-amber-500',
};

const trackColorClasses = {
  primary: 'bg-primary-100 dark:bg-primary-900/30',
  success: 'bg-emerald-100 dark:bg-emerald-900/30',
  danger: 'bg-red-100 dark:bg-red-900/30',
  warning: 'bg-amber-100 dark:bg-amber-900/30',
};

export const ProgressBar = ({
  progress,
  color = 'primary',
  showPercentage = false,
  className = '',
}: ProgressBarProps) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`flex-1 h-1.5 rounded-full ${trackColorClasses[color]} overflow-hidden`}>
        <div
          className={`h-full rounded-full ${colorClasses[color]} transition-all duration-500 ease-out`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      {showPercentage && (
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums min-w-[3ch]">
          {Math.round(clampedProgress)}%
        </span>
      )}
    </div>
  );
};
