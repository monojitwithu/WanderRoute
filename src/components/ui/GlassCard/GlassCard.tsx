// src/components/ui/GlassCard/GlassCard.tsx
import type { ReactNode } from 'react';
import styles from './GlassCard.module.css';

interface Props {
  children: ReactNode;
  className?: string;
  focusHighlight?: boolean;
}

export function GlassCard({ children, className = '', focusHighlight = false }: Props) {
  return (
    <div className={`${styles.card} ${focusHighlight ? styles.focusHighlight : ''} ${className}`}>
      {children}
    </div>
  );
}
