// src/hooks/useInView.ts
// IntersectionObserver-based hook — the modern React way to trigger animations.
// Returns a ref to attach + a boolean that flips true when the element enters the viewport.

import { useRef, useState, useEffect } from 'react';
import type { RefObject } from 'react';

interface Options {
  threshold?: number;
  rootMargin?: string;
  /** If true, stops observing after first intersection (fire-once). Default: true */
  once?: boolean;
}

export function useInView<T extends HTMLElement = HTMLDivElement>(
  options: Options = {},
): { ref: RefObject<T | null>; inView: boolean } {
  const { threshold = 0.12, rootMargin = '0px', once = true } = options;
  const ref    = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return { ref, inView };
}
