"use client";

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface CryptoOrbProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'accent';
}

export function CryptoOrb({ className, size = 'md', variant = 'primary' }: CryptoOrbProps) {
  // Generate random values for each orb instance
  const randomValues = useMemo(() => ({
    middleSpin: 6 + Math.random() * 12, // 6-18s
    coreSpin: 2 + Math.random() * 4, // 2-6s
    orbitSpin: 5 + Math.random() * 10, // 5-15s
    dataSpin: 12 + Math.random() * 16, // 12-28s
    spinDirection: Math.random() > 0.5 ? 1 : -1, // clockwise or counter
    orbitDirection: Math.random() > 0.5 ? 1 : -1,
    pulseDelay: Math.random() * 2, // 0-2s delay
    scale: 0.85 + Math.random() * 0.3, // 0.85-1.15 scale
  }), []);

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

  // Unique gradient ID to avoid conflicts between orb instances
  const gradientId = useMemo(() => `orbGradient-${Math.random().toString(36).substr(2, 9)}`, []);

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
