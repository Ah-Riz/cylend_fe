"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { CryptoGlitch } from "@/components/animations/CryptoGlitch";
import { CryptoOrb } from "@/components/animations/CryptoOrb";
import { BlockchainLoader } from "@/components/animations/BlockchainLoader";

const LandingHero = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const scrollToArchitecture = () => {
    const element = document.getElementById("architecture");
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 gradient-animate opacity-30" />
      
      {/* Subtle background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:6rem_6rem] opacity-10" />
      
      {/* Floating Crypto Orbs */}
      <div className="absolute top-20 left-10 md:left-20 animate-float" style={{ animationDelay: '0s' }}>
        <CryptoOrb size="sm" variant="primary" />
      </div>
      <div className="absolute bottom-20 right-10 md:right-20 animate-float" style={{ animationDelay: '2s' }}>
        <CryptoOrb size="md" variant="accent" />
      </div>
      <div className="absolute top-1/2 left-10 hidden md:block animate-float" style={{ animationDelay: '4s' }}>
        <CryptoOrb size="sm" variant="secondary" />
      </div>
      
      {/* Central glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[200px]"
        style={{
          background: `radial-gradient(circle, hsl(var(--primary) / ${mounted ? 0.12 : 0}) 0%, transparent 60%)`,
          transition: "all 1.5s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto text-center space-y-10">
        {/* Badge */}
        <div 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border/50 bg-card/50 backdrop-blur-sm text-sm text-muted-foreground"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(-10px)",
            transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          Private Credit Protocol
        </div>

        {/* Main headline */}
        <h1 
          className="text-5xl md:text-7xl lg:text-8xl font-medium tracking-tight"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(20px)",
            transition: "all 1s cubic-bezier(0.4, 0, 0.2, 1) 0.2s",
          }}
        >
          <span className="text-glow">Lend.</span>{" "}
          <span className="text-glow">Borrow.</span>{" "}
          <span className="text-primary">Privately.</span>
        </h1>

        {/* Subtext */}
        <p 
          className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(20px)",
            transition: "all 1s cubic-bezier(0.4, 0, 0.2, 1) 0.4s",
          }}
        >
          Institutional-grade lending with confidential terms. 
          Public settlement. Private negotiations.
        </p>

        {/* Stats row */}
        <div 
          className="flex flex-wrap items-center justify-center gap-8 md:gap-16 py-4"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(20px)",
            transition: "all 1s cubic-bezier(0.4, 0, 0.2, 1) 0.6s",
          }}
        >
          <div className="text-center">
            <CryptoGlitch 
              text="$0" 
              className="text-3xl md:text-4xl font-medium text-primary"
            />
            <div className="text-sm text-muted-foreground">Total Value Locked</div>
          </div>
          <div className="h-12 w-px bg-border hidden md:block" />
          <div className="text-center">
            <CryptoGlitch 
              text="0%" 
              className="text-3xl md:text-4xl font-medium"
            />
            <div className="text-sm text-muted-foreground">Supply APY</div>
          </div>
          <div className="h-12 w-px bg-border hidden md:block" />
          <div className="text-center">
            <CryptoGlitch 
              text="0%" 
              className="text-3xl md:text-4xl font-medium"
            />
            <div className="text-sm text-muted-foreground">Borrow APY</div>
          </div>
        </div>

        {/* CTAs */}
        <div 
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(20px)",
            transition: "all 1s cubic-bezier(0.4, 0, 0.2, 1) 0.8s",
          }}
        >
          <Link href="/app">
            <Button size="lg" className="px-8 h-12 text-base">
              Start Lending
            </Button>
          </Link>
          <Link href="/app/allocate">
            <Button size="lg" variant="outline" className="px-8 h-12 text-base">
              Request Credit
            </Button>
          </Link>
        </div>

        {/* Learn more link */}
        <button
          onClick={scrollToArchitecture}
          className="text-sm text-muted-foreground hover:text-foreground transition-all duration-300 flex items-center gap-2 mx-auto group"
          style={{
            opacity: mounted ? 0.7 : 0,
            transition: "all 1s cubic-bezier(0.4, 0, 0.2, 1) 1s",
          }}
        >
          Learn how it works
          <ChevronDown className="h-4 w-4 group-hover:translate-y-1 transition-transform duration-300" />
        </button>
      </div>

      {/* Scroll indicator */}
      <div 
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        style={{
          opacity: mounted ? 0.4 : 0,
          transition: "all 1s cubic-bezier(0.4, 0, 0.2, 1) 1.2s",
        }}
      >
        <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
};

export default LandingHero;
