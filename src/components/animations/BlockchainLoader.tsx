"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface BlockchainLoaderProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function BlockchainLoader({ className, size = 'md' }: BlockchainLoaderProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      {/* Central block */}
      <div className="absolute inset-2 bg-primary rounded animate-pulse" />
      
      {/* Rotating ring */}
      <svg
        className="absolute inset-0 animate-spin"
        style={{ animationDuration: '3s' }}
        viewBox="0 0 50 50"
      >
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="31.4 31.4"
          className="text-primary/30"
        />
      </svg>
      
      {/* Orbiting dots */}
      <div className="absolute inset-0 animate-spin" style={{ animationDuration: '2s' }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rounded-full" />
      </div>
      <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse' }}>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-accent rounded-full" />
      </div>
      <div className="absolute inset-0 animate-spin" style={{ animationDuration: '4s' }}>
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-2 h-2 bg-secondary rounded-full" />
      </div>
    </div>
  );
}
