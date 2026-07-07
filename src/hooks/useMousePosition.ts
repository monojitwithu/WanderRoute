// src/hooks/useMousePosition.ts
// Shared mouse position tracker using a ref + window event listener.
// Returns a stable ref object — no re-renders on mouse move.

import { useRef, useEffect } from 'react';
import type { MousePosition } from '../types';

export function useMousePosition(): React.RefObject<MousePosition> {
  const posRef = useRef<MousePosition>({ x: -1000, y: -1000 });

  useEffect(() => {
    function onMove(e: MouseEvent) {
      posRef.current = { x: e.clientX, y: e.clientY };
    }
    function onLeave() {
      posRef.current = { x: -1000, y: -1000 };
    }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return posRef;
}
