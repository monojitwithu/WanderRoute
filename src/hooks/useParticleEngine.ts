// src/hooks/useParticleEngine.ts
// Drives the ambient particle canvas animation loop.
// Accepts a canvas ref and mouse position ref.
// Returns a registerEl / unregisterEl API for physics-driven UI elements.

import { useEffect, useRef, useCallback } from 'react';
import type { RefObject } from 'react';
import type { MousePosition } from '../types';

// ── Config ───────────────────────────────────────────────────────────────────

const CONFIG = {
  particleCount: 300,
  colors: ['#00ffff', '#00bfff', '#007fff', '#4db8ff', '#ffffff'],
  mouseRepelRadius: 150,
  mouseRepelForce: 2,
  btnRepelRadius: 200,
  btnRepelForce: 80,
  breatheAmplitude: 0.3,
};

// ── Mote class ────────────────────────────────────────────────────────────────

class Mote {
  x: number = 0;
  y: number = 0;
  baseSize: number = 0;
  size: number = 0;
  speedY: number = 0;
  speedX: number = 0;
  swayOffset: number = 0;
  breathOffset: number = 0;
  breathSpeed: number = 0;
  baseOpacity: number = 0;
  color: string = '';
  private w: number;
  private h: number;

  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.reset(true);
  }

  reset(randomY = false) {
    this.x = Math.random() * this.w;
    this.y = randomY ? Math.random() * this.h : this.h + 50;
    this.baseSize = Math.random() * 3 + 1;
    this.size = this.baseSize;
    this.speedY = Math.random() * 0.5 + 0.1;
    this.speedX = (Math.random() - 0.5) * 0.3;
    this.swayOffset = Math.random() * Math.PI * 2;
    this.breathOffset = Math.random() * Math.PI * 2;
    this.breathSpeed = Math.random() * 0.015 + 0.005;
    this.baseOpacity = Math.random() * 0.5 + 0.2;
    this.color = CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];
  }

  update(time: number, mouse: MousePosition) {
    this.y -= this.speedY;
    this.x += this.speedX + Math.sin(time * 0.001 + this.swayOffset) * 0.4;

    const dx = mouse.x - this.x;
    const dy = mouse.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < CONFIG.mouseRepelRadius && dist > 0) {
      const force = (CONFIG.mouseRepelRadius - dist) / CONFIG.mouseRepelRadius;
      this.x -= (dx / dist) * force * CONFIG.mouseRepelForce;
      this.y -= (dy / dist) * force * CONFIG.mouseRepelForce;
      this.size = this.baseSize + force * 5;
    } else {
      this.size = this.baseSize;
    }

    if (this.y < -50 || this.x < -50 || this.x > this.w + 50) this.reset(false);
  }

  draw(ctx: CanvasRenderingContext2D, time: number) {
    const opacity =
      this.baseOpacity +
      Math.sin(time * this.breathSpeed + this.breathOffset) * CONFIG.breatheAmplitude;

    ctx.globalAlpha = Math.max(0.05, opacity);
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Interactive element physics ───────────────────────────────────────────────

interface PhysicsItem {
  el: HTMLElement;
  physics: { x: number; y: number; scale: number };
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useParticleEngine(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  mouseRef: RefObject<MousePosition>,
) {
  const particlesRef = useRef<Mote[]>([]);
  const interactiveRef = useRef<PhysicsItem[]>([]);
  const rafRef = useRef<number>(0);

  const initParticles = useCallback((w: number, h: number) => {
    particlesRef.current = Array.from(
      { length: CONFIG.particleCount },
      () => new Mote(w, h),
    );
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles(canvas.width, canvas.height);
    };

    resize();
    window.addEventListener('resize', resize);

    function animate(time: number) {
      const w = canvas!.width;
      const h = canvas!.height;
      const mouse = mouseRef.current;

      // Background gradient
      const pulse = w * 0.6 + Math.sin(time * 0.001) * (w * 0.05);
      const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, pulse);
      grad.addColorStop(0, '#1a2235');
      grad.addColorStop(1, '#0d0f12');
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Particles
      for (const p of particlesRef.current) {
        p.update(time, mouse);
        p.draw(ctx, time);
      }
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;

      // Interactive element physics
      for (const item of interactiveRef.current) {
        const rect = item.el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = mouse.x - cx;
        const dy = mouse.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let tx = 0, ty = 0, ts = 1;
        if (dist < CONFIG.btnRepelRadius && dist > 0 && mouse.x !== -1000) {
          const force = (CONFIG.btnRepelRadius - dist) / CONFIG.btnRepelRadius;
          tx = -(dx / dist) * force * CONFIG.btnRepelForce;
          ty = -(dy / dist) * force * CONFIG.btnRepelForce;
          ts = 1 + force * 0.15;
        }

        const p = item.physics;
        p.x += (tx - p.x) * 0.1;
        p.y += (ty - p.y) * 0.1;
        p.scale += (ts - p.scale) * 0.1;
        item.el.style.transform = `translate(${p.x.toFixed(2)}px,${p.y.toFixed(2)}px) scale(${p.scale.toFixed(4)})`;
      }

      rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [canvasRef, mouseRef, initParticles]);

  const registerEl = useCallback((el: HTMLElement) => {
    if (!interactiveRef.current.find((i) => i.el === el)) {
      interactiveRef.current.push({ el, physics: { x: 0, y: 0, scale: 1 } });
    }
  }, []);

  const unregisterEl = useCallback((el: HTMLElement) => {
    interactiveRef.current = interactiveRef.current.filter((i) => {
      if (i.el === el) { i.el.style.transform = ''; return false; }
      return true;
    });
  }, []);

  return { registerEl, unregisterEl };
}
