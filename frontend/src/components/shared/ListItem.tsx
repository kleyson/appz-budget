import { ReactNode } from 'react';
import { IconButton } from './Button';
import { ColorChip } from './Badge';
import { EditIcon, TrashIcon } from './Icons';

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
          <IconButton
            variant="primary"
            icon={<EditIcon className="w-4 h-4" />}
            onClick={onEdit}
            title="Edit"
          />
        )}
        {onDelete && (
          <IconButton
            variant="danger"
            icon={<TrashIcon className="w-4 h-4" />}
            onClick={onDelete}
            title="Delete"
          />
        )}
      </div>
    </div>
  );
};
