"use client";

import React, { useEffect, useRef } from 'react';

class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  pulsePhase: number;

  constructor(width: number, height: number) {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.vx = (Math.random() - 0.5) * 0.5;
    this.vy = (Math.random() - 0.5) * 0.5;
    this.radius = Math.random() * 3 + 1;
    this.color = `hsl(188, 95%, ${50 + Math.random() * 20}%)`;
    this.pulsePhase = Math.random() * Math.PI * 2;
  }

  update(width: number, height: number) {
    this.x += this.vx;
    this.y += this.vy;
    this.pulsePhase += 0.05;

    if (this.x < 0) this.x = width;
    if (this.x > width) this.x = 0;
    if (this.y < 0) this.y = height;
    if (this.y > height) this.y = 0;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const pulse = Math.sin(this.pulsePhase) * 0.5 + 0.5;
    const currentRadius = this.radius + pulse * 2;

    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, currentRadius * 3);
    gradient.addColorStop(0, this.color);
    gradient.addColorStop(0.5, 'hsla(188, 95%, 48%, 0.2)');
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, currentRadius * 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function Web3Background() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    let width = 0;
    let height = 0;

    const setupCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;

      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    setupCanvas();

    // Create particles
    let particles: Particle[] = [];
    const initParticles = () => {
      const particleCount = window.innerWidth < 768 ? 30 : 50; // Less particles on mobile
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle(width, height));
      }
    };
    initParticles();

    const onResize = () => {
      setupCanvas();
      initParticles();
    };
    window.addEventListener('resize', onResize);

    // Animation loop
    let animationId: number;
    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
      ctx.fillRect(0, 0, width, height);

      // Update and draw particles
      particles.forEach(particle => {
        particle.update(width, height);
        particle.draw(ctx);
      });

      // Draw connections
      particles.forEach((particle, i) => {
        particles.slice(i + 1).forEach(other => {
          const dx = particle.x - other.x;
          const dy = particle.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 150) {
            ctx.strokeStyle = `hsla(188, 95%, 48%, ${0.2 * (1 - distance / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        });
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none opacity-30 z-0"
      style={{ background: 'transparent' }}
    />
  );
}
