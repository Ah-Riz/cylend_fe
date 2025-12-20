"use client";

import React, { useId, useMemo, useSyncExternalStore } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

export function FloatingParticles() {
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const uniqueId = useId();

  const particles = useMemo<Particle[]>(() => {
    let seed = 0;
    for (let i = 0; i < uniqueId.length; i++) {
      seed = (seed * 31 + uniqueId.charCodeAt(i)) | 0;
    }
    seed = Math.abs(seed) + 1;

    const rnd = (index: number) => {
      const x = Math.sin(seed * (index + 1) * 9999) * 10000;
      return x - Math.floor(x);
    };

    const newParticles: Particle[] = [];
    for (let i = 0; i < 50; i++) {
      newParticles.push({
        id: i,
        x: rnd(i * 7 + 1) * 100,
        y: rnd(i * 7 + 2) * 100,
        size: rnd(i * 7 + 3) * 3 + 1,
        duration: rnd(i * 7 + 4) * 20 + 10,
        delay: rnd(i * 7 + 5) * 5,
        opacity: rnd(i * 7 + 6) * 0.5 + 0.1,
      });
    }
    return newParticles;
  }, [uniqueId]);

  if (!hydrated) {
    return null;
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full bg-primary/30 transition-opacity duration-1000"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: particle.opacity,
            animation: `float-up ${particle.duration}s ${particle.delay}s infinite`,
            boxShadow: `0 0 ${particle.size * 2}px hsl(var(--primary) / 0.3)`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes float-up {
          0% {
            transform: translateY(100vh) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) translateX(100px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
