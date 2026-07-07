// src/components/ui/Icon/Icon.tsx
// Tiny typed SVG icon atom — DRY replacement for repeated inline SVGs.

import type { SVGProps } from 'react';

export type IconName =
  | 'arrow-left'
  | 'arrow-right'
  | 'plus'
  | 'x'
  | 'check'
  | 'map-pin'
  | 'calendar'
  | 'refresh'
  | 'info';

const PATHS: Record<IconName, string> = {
  'arrow-left':  'M19 12H5M12 19l-7-7 7-7',
  'arrow-right': 'M5 12h14M12 5l7 7-7 7',
  'plus':        'M12 5v14M5 12h14',
  'x':           'M18 6L6 18M6 6l12 12',
  'check':       'M20 6L9 17l-5-5',
  'map-pin':     'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 10m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0',
  'calendar':    'M3 4h18v18H3zM16 2v4M8 2v4M3 10h18',
  'refresh':     'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8 M3 3v5h5',
  'info':        'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 16v-4 M12 8h.01',
};

interface Props extends SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 16, ...rest }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
