// src/components/ui/FadeInView/FadeInView.tsx
// Reusable animation wrapper — uses IntersectionObserver (useInView) to play
// a fade+slide animation the moment the element scrolls into view.
// Zero CSS keyframes needed in parent components.

import type { ReactNode, ElementType } from 'react';
import { useInView } from '../../../hooks/useInView';
import styles from './FadeInView.module.css';

type Direction = 'up' | 'down' | 'left' | 'right' | 'none';

interface Props {
  children: ReactNode;
  /** Stagger delay in ms (e.g. delay={i * 80} for list items) */
  delay?: number;
  direction?: Direction;
  className?: string;
  /** Render as any HTML element */
  as?: ElementType;
  threshold?: number;
}

export function FadeInView({
  children,
  delay = 0,
  direction = 'up',
  className = '',
  as: Tag = 'div',
  threshold = 0.1,
}: Props) {
  const { ref, inView } = useInView<HTMLElement>({ threshold, once: true });

  return (
    <Tag
      ref={ref}
      className={[
        styles.base,
        styles[direction],
        inView ? styles.visible : '',
        className,
      ].join(' ')}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}
