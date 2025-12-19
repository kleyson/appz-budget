import { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h4 className="text-lg font-medium text-slate-900 dark:text-white mb-1">{title}</h4>
      {description && <p className="text-slate-500 dark:text-slate-400 mb-4">{description}</p>}
      {action}
    </div>
  );
};
