"use client";

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface CryptoGlitchProps {
  text: string;
  className?: string;
}

export function CryptoGlitch({ text, className }: CryptoGlitchProps) {
  const [glitchedText, setGlitchedText] = useState(text);
  const [isGlitching, setIsGlitching] = useState(false);

  useEffect(() => {
    const cryptoChars = '0123456789ABCDEF₿Ξ◈☰⟠⬢';
    
    const glitchInterval = setInterval(() => {
      setIsGlitching(true);
      
      let iterations = 0;
      const maxIterations = 10;
      
      const scrambleInterval = setInterval(() => {
        setGlitchedText(
          text
            .split('')
            .map((char, index) => {
              if (index < iterations || char === ' ') {
                return text[index];
              }
              return cryptoChars[Math.floor(Math.random() * cryptoChars.length)];
            })
            .join('')
        );
        
        iterations++;
        
        if (iterations > text.length || iterations >= maxIterations) {
          clearInterval(scrambleInterval);
          setGlitchedText(text);
          setIsGlitching(false);
        }
      }, 30);
    }, 3000);

    return () => clearInterval(glitchInterval);
  }, [text]);

  return (
    <span 
      className={cn(
        "inline-block relative font-mono",
        isGlitching && "animate-pulse",
        className
      )}
    >
      {glitchedText}
      {isGlitching && (
        <>
          <span 
            className="absolute inset-0 text-primary/50 blur-sm"
            style={{ 
              transform: 'translateX(2px)',
              clipPath: 'polygon(0 45%, 100% 45%, 100% 55%, 0 55%)'
            }}
          >
            {glitchedText}
          </span>
          <span 
            className="absolute inset-0 text-destructive/30 blur-sm"
            style={{ 
              transform: 'translateX(-2px)',
              clipPath: 'polygon(0 80%, 100% 80%, 100% 100%, 0 100%)'
            }}
          >
            {glitchedText}
          </span>
        </>
      )}
    </span>
  );
}
