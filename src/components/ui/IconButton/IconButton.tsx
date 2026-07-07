// src/components/ui/IconButton/IconButton.tsx
import type { ButtonHTMLAttributes } from 'react';
import { Icon, type IconName } from '../Icon/Icon';
import styles from './IconButton.module.css';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName;
  variant?: 'ghost' | 'danger' | 'primary';
  size?: number;
}

export function IconButton({ icon, variant = 'ghost', size = 16, className = '', ...rest }: Props) {
  return (
    <button className={`${styles.btn} ${styles[variant]} ${className}`} {...rest}>
      <Icon name={icon} size={size} />
    </button>
  );
}
