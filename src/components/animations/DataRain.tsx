"use client";

import React, { useEffect, useRef } from 'react';

export function DataRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const chars = '01₿ΞℌⱮ◈☰⟠⬢ABCDEFabcdef0123456789';

    let width = 0;
    let height = 0;
    let fontSize = 14;
    let drops: number[] = [];

    const setup = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;

      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      fontSize = width < 768 ? 10 : 14;
      const columns = Math.max(1, Math.floor(width / fontSize));
      drops = Array.from({ length: columns }, () => Math.random() * -100);
      ctx.font = `${fontSize}px monospace`;
    };

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const y = drops[i] * fontSize;
        const opacity = Math.max(0, 1 - y / height);
        ctx.fillStyle = `hsla(188, 95%, 48%, ${opacity})`;
        ctx.fillText(char, i * fontSize, y);

        if (y > height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    setup();

    const onResize = () => {
      setup();
    };
    window.addEventListener('resize', onResize);

    let animationId = 0;
    let lastFrameTime = 0;
    const frame = (time: number) => {
      if (time - lastFrameTime >= 35) {
        draw();
        lastFrameTime = time;
      }
      animationId = requestAnimationFrame(frame);
    };
    animationId = requestAnimationFrame(frame);

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none opacity-20 z-0"
      style={{ background: 'transparent' }}
    />
  );
}
