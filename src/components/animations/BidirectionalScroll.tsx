"use client";

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface BidirectionalScrollProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right' | 'zoom' | 'rotate';
  intensity?: 'subtle' | 'normal' | 'intense';
}

export function BidirectionalScroll({ 
  children, 
  className,
  direction = 'up',
  intensity = 'normal'
}: BidirectionalScrollProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isInView, setIsInView] = useState(false);
  const isInViewRef = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Intersection Observer for visibility
    const observer = new IntersectionObserver(
      ([entry]) => {
        isInViewRef.current = entry.isIntersecting;
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.1, rootMargin: '-50px 0px' }
    );
    observer.observe(element);

    // Scroll handler for parallax effect
    let rafId = 0;
    const update = () => {
      rafId = 0;
      if (!element) return;
      if (!isInViewRef.current) return;

      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const elementHeight = rect.height;

      const center = rect.top + elementHeight / 2;
      const windowCenter = windowHeight / 2;
      const distance = center - windowCenter;
      const maxDistance = windowHeight / 2 + elementHeight / 2;

      const progress = Math.max(-1, Math.min(1, distance / maxDistance));
      setScrollProgress(progress);
    };

    const handleScroll = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(update);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  const intensityMultiplier = {
    subtle: 0.5,
    normal: 1,
    intense: 1.5
  }[intensity];

  const getTransform = () => {
    const offset = scrollProgress * 30 * intensityMultiplier;
    const scale = 1 - Math.abs(scrollProgress) * 0.05 * intensityMultiplier;
    const rotation = scrollProgress * 5 * intensityMultiplier;
    
    switch (direction) {
      case 'up':
        return `translateY(${offset}px) scale(${scale})`;
      case 'down':
        return `translateY(${-offset}px) scale(${scale})`;
      case 'left':
        return `translateX(${offset}px) scale(${scale})`;
      case 'right':
        return `translateX(${-offset}px) scale(${scale})`;
      case 'zoom':
        return `scale(${1 + Math.abs(scrollProgress) * 0.1 * intensityMultiplier})`;
      case 'rotate':
        return `rotate(${rotation}deg) scale(${scale})`;
      default:
        return '';
    }
  };

  return (
    <div
      ref={elementRef}
      className={cn(
        "transition-all duration-500 ease-out",
        className
      )}
      style={{
        transform: getTransform(),
        opacity: isInView ? 1 : 0,
        filter: isInView ? 'blur(0)' : 'blur(4px)',
      }}
    >
      {children}
    </div>
  );
}

// Wrapper for entire sections with background parallax
export function ParallaxSection({ 
  children, 
  className,
  backgroundImage,
  overlay = true
}: {
  children: React.ReactNode;
  className?: string;
  backgroundImage?: string;
  overlay?: boolean;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [backgroundOffset, setBackgroundOffset] = useState(0);

  useEffect(() => {
    let rafId = 0;

    const update = () => {
      rafId = 0;
      if (!sectionRef.current) return;

      const rect = sectionRef.current.getBoundingClientRect();
      const speed = 0.5; // Parallax speed
      const yPos = rect.top * speed;

      setBackgroundOffset(yPos);
    };

    const handleScroll = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(update);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className={cn("relative overflow-hidden", className)}
    >
      {backgroundImage && (
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transform: `translateY(${backgroundOffset}px)`,
            willChange: 'transform',
          }}
        />
      )}
      
      {overlay && backgroundImage && (
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/80 z-10" />
      )}
      
      <div className="relative z-20">
        {children}
      </div>
    </section>
  );
}
