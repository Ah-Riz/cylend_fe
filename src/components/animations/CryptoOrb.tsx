"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface CryptoOrbProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'accent';
}

export function CryptoOrb({ className, size = 'md', variant = 'primary' }: CryptoOrbProps) {
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

  return (
    <div 
      className={cn(
        "relative",
        sizeClasses[size],
        "animate-float",
        className
      )}
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
          background: `radial-gradient(circle, var(--color-${variant}) 0%, transparent 70%)`
        }}
      />
      
      {/* Middle layer */}
      <div 
        className="absolute inset-4 rounded-full blur-md bg-gradient-to-br from-primary/30 to-accent/30 animate-spin"
        style={{ animationDuration: '10s' }}
      />
      
      {/* Core */}
      <div className="absolute inset-8 rounded-full bg-gradient-to-tr from-primary to-accent animate-pulse">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-transparent via-white/20 to-transparent animate-spin" 
          style={{ animationDuration: '3s' }}
        />
      </div>
      
      {/* Orbiting particles */}
      <div className="absolute inset-0 animate-spin" style={{ animationDuration: '8s' }}>
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
          stroke="url(#orbGradient)"
          strokeWidth="1"
          strokeDasharray="5 10"
          className="animate-spin"
          style={{ 
            animationDuration: '20s',
            transformOrigin: 'center'
          }}
        />
        <defs>
          <linearGradient id="orbGradient">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.5" />
            <stop offset="50%" stopColor="var(--color-accent)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.5" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
