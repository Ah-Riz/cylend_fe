"use client";

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface HolographicCardProps {
  children: React.ReactNode;
  className?: string;
}

export function HolographicCard({ children, className }: HolographicCardProps) {
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePosition({ x, y });
  };

  return (
    <div
      className={cn(
        "relative group",
        "transform-gpu transition-all duration-300",
        isHovered && "scale-105",
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setMousePosition({ x: 50, y: 50 });
      }}
      style={{
        transform: isHovered 
          ? `perspective(1000px) rotateY(${(mousePosition.x - 50) * 0.1}deg) rotateX(${(50 - mousePosition.y) * 0.1}deg)`
          : 'perspective(1000px) rotateY(0deg) rotateX(0deg)'
      }}
    >
      {/* Holographic gradient overlay */}
      <div 
        className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10"
        style={{
          background: `
            linear-gradient(
              ${mousePosition.x + mousePosition.y}deg,
              transparent 20%,
              hsla(188, 95%, 48%, 0.3) 40%,
              hsla(280, 95%, 48%, 0.3) 60%,
              transparent 80%
            )
          `,
          filter: 'blur(20px)',
        }}
      />
      
      {/* Shimmer effect */}
      <div 
        className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-20"
        style={{
          background: `
            linear-gradient(
              105deg,
              transparent 40%,
              hsla(188, 95%, 70%, 0.2) 50%,
              transparent 60%
            )
          `,
          transform: `translateX(${(mousePosition.x - 50) * 2}px)`,
        }}
      />
      
      {/* Border glow */}
      <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div 
          className="absolute inset-0 rounded-lg"
          style={{
            background: `
              linear-gradient(
                ${mousePosition.x + mousePosition.y}deg,
                hsl(188, 95%, 48%),
                hsl(280, 95%, 48%),
                hsl(188, 95%, 48%)
              )
            `,
            padding: '1px',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        />
      </div>
      
      {/* Main content */}
      <div className="relative z-30 bg-card/90 backdrop-blur-sm rounded-lg border border-border/50 overflow-hidden">
        {children}
      </div>
      
      {/* Particle effects */}
      {isHovered && (
        <div className="absolute inset-0 pointer-events-none z-40">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-primary rounded-full animate-ping"
              style={{
                left: `${mousePosition.x}%`,
                top: `${mousePosition.y}%`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: '1s',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
