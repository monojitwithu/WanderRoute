// src/components/ParticleCanvas/ParticleCanvas.tsx
// Persistent ambient canvas — rendered once in App.tsx, never unmounts.

import { useRef, useEffect, createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useMousePosition } from '../../hooks/useMousePosition';
import { useParticleEngine } from '../../hooks/useParticleEngine';

// ── Context: share registerEl/unregisterEl with any descendant ────────────────

interface EngineContextValue {
  registerEl: (el: HTMLElement) => void;
  unregisterEl: (el: HTMLElement) => void;
  mouseRef: ReturnType<typeof useMousePosition>;
}

const EngineContext = createContext<EngineContextValue | null>(null);

export function useEngine() {
  const ctx = useContext(EngineContext);
  if (!ctx) throw new Error('useEngine must be used within <ParticleCanvas>');
  return ctx;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props { children: ReactNode }

export function ParticleCanvas({ children }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const orbRef    = useRef<HTMLDivElement>(null);
  const mouseRef  = useMousePosition();
  const { registerEl, unregisterEl } = useParticleEngine(canvasRef, mouseRef);

  // Move orb on mouse move
  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!orbRef.current) return;
      orbRef.current.style.left = `${e.clientX}px`;
      orbRef.current.style.top  = `${e.clientY}px`;
      orbRef.current.classList.add('visible');
    }
    function onLeave() {
      orbRef.current?.classList.remove('visible');
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <EngineContext.Provider value={{ registerEl, unregisterEl, mouseRef }}>
      <canvas id="particle-canvas" ref={canvasRef} aria-hidden="true" />
      <div id="cursor-orb" ref={orbRef} aria-hidden="true" />
      <div id="app-shell">{children}</div>
    </EngineContext.Provider>
  );
}
