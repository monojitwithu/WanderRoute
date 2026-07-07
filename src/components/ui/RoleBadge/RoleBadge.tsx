// src/components/ui/RoleBadge/RoleBadge.tsx
import type { StopRole } from '../../../types';
import styles from './RoleBadge.module.css';

interface Props {
  role: StopRole;
  className?: string;
}

const CONFIG = {
  start: { icon: '🚀', label: 'Start' },
  stop:  { icon: '📍', label: 'Stop' },
  end:   { icon: '🏁', label: 'End' },
};

export function RoleBadge({ role, className = '' }: Props) {
  const { icon, label } = CONFIG[role];
  return (
    <span className={`${styles.badge} ${styles[role]} ${className}`}>
      {icon} {label}
    </span>
  );
}
