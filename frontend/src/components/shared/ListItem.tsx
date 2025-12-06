import { ReactNode } from 'react';
import { IconButton } from './Button';
import { ColorChip } from './Badge';

interface ListItemProps {
  name: string;
  color?: string;
  subtitle?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  actions?: ReactNode;
  className?: string;
}

export const ListItem = ({
  name,
  color,
  subtitle,
  onEdit,
  onDelete,
  actions,
  className = '',
}: ListItemProps) => {
  return (
    <div className={`list-item ${className}`}>
      <div className="flex items-center gap-3">
        {color && <ColorChip color={color}>{name}</ColorChip>}
        {!color && (
          <div>
            <p className="font-medium text-slate-900 dark:text-white">{name}</p>
            {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        {actions}
        {onEdit && (
          <IconButton variant="primary" icon={<EditIcon />} onClick={onEdit} title="Edit" />
        )}
        {onDelete && (
          <IconButton variant="danger" icon={<TrashIcon />} onClick={onDelete} title="Delete" />
        )}
      </div>
    </div>
  );
};

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
    />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);
