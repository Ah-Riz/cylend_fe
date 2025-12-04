"use client";

import { useEffect, useRef, useState } from "react";

interface UseScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export const useScrollAnimation = (options: UseScrollAnimationOptions = {}) => {
  const { threshold = 0.1, rootMargin = "-50px 0px", triggerOnce = false } = options;
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce]);

  return { ref, isVisible };
};

// Component wrapper for scroll animations
interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  animation?: "fade-up" | "fade-in" | "slide-left" | "slide-right" | "scale-up" | "blur-in";
  delay?: number;
  duration?: number;
  threshold?: number;
  triggerOnce?: boolean;
  rootMargin?: string;
}

export const ScrollReveal = ({
  children,
  className = "",
  animation = "fade-up",
  delay = 0,
  duration = 0.8,
  threshold = 0.1,
  triggerOnce = false,
  rootMargin = "-50px 0px",
}: ScrollRevealProps) => {
  const { ref, isVisible } = useScrollAnimation({ threshold, triggerOnce, rootMargin });

  const baseStyles: React.CSSProperties = {
    transition: `all ${duration}s cubic-bezier(0.4, 0, 0.2, 1) ${delay}s`,
    willChange: "opacity, transform, filter",
  };

  const animationStyles: Record<string, React.CSSProperties> = {
    "fade-up": {
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? "translateY(0) scale(1)" : "translateY(40px) scale(0.98)",
    },
    "fade-in": {
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? "scale(1)" : "scale(0.95)",
    },
    "slide-left": {
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? "translateX(0) rotate(0deg)" : "translateX(60px) rotate(2deg)",
    },
    "slide-right": {
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? "translateX(0) rotate(0deg)" : "translateX(-60px) rotate(-2deg)",
    },
    "scale-up": {
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? "scale(1) rotate(0deg)" : "scale(0.9) rotate(5deg)",
    },
    "blur-in": {
      opacity: isVisible ? 1 : 0,
      filter: isVisible ? "blur(0) brightness(1)" : "blur(10px) brightness(0.7)",
      transform: isVisible ? "scale(1)" : "scale(0.95)",
    },
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{ ...baseStyles, ...animationStyles[animation] }}
    >
      {children}
    </div>
  );
};
