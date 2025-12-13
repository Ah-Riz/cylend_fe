"use client";

import React, { useId, useMemo, useSyncExternalStore } from 'react';
import { cn } from '@/lib/utils';

interface CryptoOrbProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'accent';
  seed?: number; // Optional seed for deterministic randomness
}

export function CryptoOrb({ className, size = 'md', variant = 'primary', seed }: CryptoOrbProps) {
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const uniqueId = useId();

  const computedValues = useMemo(() => {
    const hashString = (value: string) => {
      let hash = 0;
      for (let i = 0; i < value.length; i++) {
        hash = (hash * 31 + value.charCodeAt(i)) | 0;
      }
      return Math.abs(hash);
    };

    const baseSeed = typeof seed === 'number' ? seed : hashString(uniqueId);

    const rnd = (index: number) => {
      const x = Math.sin((baseSeed + 1) * (index + 1) * 9999) * 10000;
      return x - Math.floor(x);
    };

    return {
      middleSpin: 6 + rnd(1) * 12,
      coreSpin: 2 + rnd(2) * 4,
      orbitSpin: 5 + rnd(3) * 10,
      dataSpin: 12 + rnd(4) * 16,
      spinDirection: rnd(5) > 0.5 ? 1 : -1,
      orbitDirection: rnd(6) > 0.5 ? 1 : -1,
      pulseDelay: rnd(7) * 2,
      scale: 0.85 + rnd(8) * 0.3,
    };
  }, [seed, uniqueId]);

  const randomValues = hydrated
    ? computedValues
    : {
        middleSpin: 12,
        coreSpin: 4,
        orbitSpin: 10,
        dataSpin: 20,
        spinDirection: 1,
        orbitDirection: 1,
        pulseDelay: 0,
        scale: 1,
      };

  const sizeClasses = {
    sm: 'w-20 h-20',
    md: 'w-32 h-32',
    lg: 'w-48 h-48'
  };

  const colors = {
    primary: 'from-primary/20 via-primary/10 to-transparent',
    secondary: 'from-secondary/20 via-secondary/10 to-transparent',
    accent: 'from-accent/20 via-accent/10 to-transparent'
  };

  // Unique gradient ID using React's useId hook for SSR compatibility
  const gradientId = `orbGradient-${uniqueId}`;

  return (
    <div 
      className={cn(
        "relative",
        sizeClasses[size],
        "animate-float",
        className
      )}
      style={{
        transform: `scale(${randomValues.scale})`,
      }}
    >
      {/* Outer glow */}
      <div 
        className={cn(
          "absolute inset-0 rounded-full blur-xl",
          "bg-gradient-radial",
          colors[variant],
          "animate-pulse"
        )}
        style={{
          background: `radial-gradient(circle, var(--color-${variant}) 0%, transparent 70%)`,
          animationDelay: `${randomValues.pulseDelay}s`,
        }}
      />
      
      {/* Middle layer */}
      <div 
        className="absolute inset-4 rounded-full blur-md bg-gradient-to-br from-primary/30 to-accent/30"
        style={{ 
          animation: `spin ${randomValues.middleSpin}s linear infinite`,
          animationDirection: randomValues.spinDirection > 0 ? 'normal' : 'reverse',
        }}
      />
      
      {/* Core */}
      <div 
        className="absolute inset-8 rounded-full bg-gradient-to-tr from-primary to-accent animate-pulse"
        style={{ animationDelay: `${randomValues.pulseDelay * 0.5}s` }}
      >
        <div 
          className="absolute inset-0 rounded-full bg-gradient-to-br from-transparent via-white/20 to-transparent"
          style={{ 
            animation: `spin ${randomValues.coreSpin}s linear infinite`,
            animationDirection: randomValues.spinDirection > 0 ? 'reverse' : 'normal',
          }}
        />
      </div>
      
      {/* Orbiting particles */}
      <div 
        className="absolute inset-0"
        style={{ 
          animation: `spin ${randomValues.orbitSpin}s linear infinite`,
          animationDirection: randomValues.orbitDirection > 0 ? 'normal' : 'reverse',
        }}
      >
        <div className="absolute top-0 left-1/2 w-1 h-1 bg-white rounded-full shadow-lg shadow-primary/50" />
        <div className="absolute bottom-0 left-1/2 w-1 h-1 bg-white rounded-full shadow-lg shadow-accent/50" />
      </div>
      
      {/* Data streams */}
      <svg className="absolute inset-0 w-full h-full" style={{ filter: 'blur(0.5px)' }}>
        <circle
          cx="50%"
          cy="50%"
          r="40%"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="1"
          strokeDasharray="5 10"
          style={{ 
            animation: `spin ${randomValues.dataSpin}s linear infinite`,
            animationDirection: randomValues.spinDirection > 0 ? 'normal' : 'reverse',
            transformOrigin: 'center'
          }}
        />
        <defs>
          <linearGradient id={gradientId}>
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.5" />
            <stop offset="50%" stopColor="var(--color-accent)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.5" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
