"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { CryptoGlitch } from "@/components/animations/CryptoGlitch";
import { CryptoOrb } from "@/components/animations/CryptoOrb";
import { FloatingParticles } from "@/components/animations/FloatingParticles";

const LandingHero = () => {
  const mounted = true;

  const scrollToArchitecture = () => {
    const element = document.getElementById("architecture");
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 gradient-animate opacity-30" />

      {/* Enhanced background grid with fade */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--primary)/0.1)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--primary)/0.1)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />

      {/* Floating data particles */}
      <FloatingParticles />

      {/* Floating Crypto Orbs with deterministic seeds */}
      <div className="absolute top-20 left-10 md:left-20 animate-float" style={{ animationDelay: '0s' }}>
        <CryptoOrb size="sm" variant="primary" seed={1} />
      </div>
      <div className="absolute bottom-20 right-10 md:right-20 animate-float" style={{ animationDelay: '2s' }}>
        <CryptoOrb size="md" variant="accent" seed={2} />
      </div>
      <div className="absolute top-1/2 left-10 hidden md:block animate-float" style={{ animationDelay: '4s' }}>
        <CryptoOrb size="sm" variant="secondary" seed={3} />
      </div>
      <div className="absolute top-1/3 right-1/4 hidden lg:block animate-float" style={{ animationDelay: '1s' }}>
        <CryptoOrb size="sm" variant="primary" seed={4} />
      </div>

      {/* Multiple layered glows */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full blur-[250px]"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 50%)",
          transition: "all 2s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />
      <div
        className="absolute top-1/3 left-1/3 w-[600px] h-[600px] rounded-full blur-[180px]"
        style={{
          background: "radial-gradient(circle, hsl(var(--accent) / 0.08) 0%, transparent 60%)",
          transition: "all 2.5s cubic-bezier(0.4, 0, 0.2, 1) 0.3s",
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8">
        {/* Badge with glow */}
        <div
          className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-primary/30 bg-primary/5 backdrop-blur-md text-sm text-foreground shadow-lg shadow-primary/10"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0) scale(1)" : "translateY(-20px) scale(0.95)",
            transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
          </span>
          <span className="font-medium">Privacy-First Lending Protocol</span>
          <span className="text-xs text-muted-foreground px-2 py-0.5 bg-background/50 rounded-full">Beta</span>
        </div>

        {/* Main headline with gradient */}
        <h1
          className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.1]"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(30px)",
            transition: "all 1s cubic-bezier(0.4, 0, 0.2, 1) 0.2s",
          }}
        >
          <span className="inline-block text-glow hover:scale-105 transition-transform duration-300 cursor-default">Lend.</span>{" "}
          <span className="inline-block text-glow hover:scale-105 transition-transform duration-300 cursor-default">Borrow.</span>{" "}
          <br className="hidden sm:block" />
          <span className="inline-block bg-gradient-to-r from-primary via-cyan-400 to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient hover:scale-105 transition-transform duration-300 cursor-default">
            Privately.
          </span>
        </h1>

        {/* Subtext with better styling */}
        <p
          className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(20px)",
            transition: "all 1s cubic-bezier(0.4, 0, 0.2, 1) 0.4s",
          }}
        >
          Institutional-grade lending with{" "}
          <span className="text-foreground font-medium">confidential terms</span>.{" "}
          <br className="hidden md:block" />
          Transparent settlement,{" "}
          <span className="text-primary font-medium">private negotiations</span>.
        </p>

        {/* Feature pills removed per branding direction (no AI-like icon rows) */}

        {/* Stats row - Enhanced with glass morphism */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6 py-6 max-w-4xl mx-auto px-2 sm:px-0"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0) scale(1)" : "translateY(20px) scale(0.95)",
            transition: "all 1s cubic-bezier(0.4, 0, 0.2, 1) 0.6s",
          }}
        >
          {[
            { value: "$2,450,120", label: "Total Value Locked", prefix: "$", suffix: "", highlight: true },
            { value: "8.4%", label: "Supply APY", prefix: "", suffix: "%", highlight: false },
            { value: "12.5%", label: "Borrow APY", prefix: "", suffix: "%", highlight: false },
          ].map((stat, i) => (
            <div
              key={i}
              className={`
                relative group
                bg-gradient-to-b from-card/30 to-card/10
                backdrop-blur-md
                border border-border/30
                rounded-xl sm:rounded-2xl
                p-4 sm:p-5 md:p-6
                hover:border-primary/30
                hover:bg-card/40
                transition-all duration-500
                hover:scale-105
                hover:shadow-xl hover:shadow-primary/10
                min-h-[120px] sm:min-h-[140px]
                flex items-center justify-center
              `}
              style={{
                animationDelay: `${0.6 + i * 0.1}s`,
              }}
            >
              {/* Glow effect on hover */}
              <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-b from-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Animated border gradient */}
              <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 animate-shimmer" />

              <div className="relative w-full">
                <div className="flex items-baseline justify-center gap-0.5 sm:gap-1 mb-1.5 sm:mb-2 flex-wrap">
                  {stat.prefix && <span className="text-lg sm:text-xl md:text-2xl text-primary/80">{stat.prefix}</span>}
                  <CryptoGlitch
                    text={stat.value.replace(/[$%]/g, '')}
                    className={`text-3xl sm:text-4xl md:text-5xl font-bold ${stat.highlight ? 'text-primary' : 'text-foreground'} group-hover:scale-110 transition-transform duration-300`}
                  />
                  {stat.suffix && <span className="text-lg sm:text-xl md:text-2xl text-primary/80">{stat.suffix}</span>}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground font-medium uppercase tracking-wider text-center px-1">
                  {stat.label}
                </div>
                {/* Subtle pulse dot */}
                <div className="absolute -top-1 sm:-top-2 -right-1 sm:-right-2 w-2.5 sm:w-3 h-2.5 sm:h-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/30 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 sm:h-3 w-2.5 sm:w-3 bg-primary/50" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTAs - Enhanced with better styling */}
        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(20px)",
            transition: "all 1s cubic-bezier(0.4, 0, 0.2, 1) 0.8s",
          }}
        >
          <Link href="/app">
            <Button
              size="lg"
              className="relative px-10 h-14 text-base font-semibold group overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                Start Lending
                <svg
                  className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
              {/* Shimmer effect */}
              <div className="absolute inset-0 -z-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-200%] group-hover:animate-shimmer" />
            </Button>
          </Link>
          <Link href="/app/allocate">
            <Button
              size="lg"
              variant="outline"
              className="relative px-10 h-14 text-base font-semibold group overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                Request Credit
                <svg
                  className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            </Button>
          </Link>
        </div>

        {/* Learn more link - Enhanced */}
        <button
          onClick={scrollToArchitecture}
          className="relative text-sm text-muted-foreground hover:text-primary transition-all duration-300 flex items-center gap-3 mx-auto group mt-4"
          style={{
            opacity: mounted ? 0.9 : 0,
            transition: "all 1s cubic-bezier(0.4, 0, 0.2, 1) 1s",
          }}
        >
          <span className="relative">
            Learn how it works
            <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-primary group-hover:w-full transition-all duration-300" />
          </span>
          <div className="relative flex items-center justify-center w-6 h-6 rounded-full border border-muted-foreground/30 group-hover:border-primary/50 transition-colors">
            <ChevronDown className="h-3 w-3 group-hover:translate-y-0.5 transition-transform duration-300" />
          </div>
        </button>

        {/* Built on Mantle - PREMIUM PROMINENT VERSION */}
        <div
          className="flex flex-col items-center gap-4 sm:gap-6 mt-8 sm:mt-12 md:mt-16 px-4 sm:px-6 md:px-8"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0) scale(1)" : "translateY(20px) scale(0.95)",
            transition: "all 1s cubic-bezier(0.4, 0, 0.2, 1) 1.1s",
          }}
        >
          {/* Decorative divider with glow */}
          <div className="relative w-32 sm:w-40 md:w-48 h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent">
            <div className="absolute inset-0 blur-sm bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          </div>

          {/* Main prominent badge with multiple effects */}
          <div className="relative group w-full max-w-md sm:max-w-lg md:max-w-xl px-2 sm:px-0">
            {/* Simple subtle glow effect */}
            <div className="absolute -inset-4 bg-primary/5 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            {/* Main content card - Simplified */}
            <div className="relative flex flex-col items-center gap-4 sm:gap-5 px-8 sm:px-12 md:px-16 py-6 sm:py-8 md:py-10 rounded-3xl border border-primary/20 bg-card/50 backdrop-blur-sm hover:border-primary/40 transition-all duration-500 hover:shadow-lg hover:shadow-primary/5">

              {/* "BUILT ON" text with enhanced styling */}
              <div className="flex items-center gap-3">
                <div className="h-[1px] w-8 sm:w-12 bg-gradient-to-r from-transparent to-primary/50" />
                <span className="text-sm sm:text-base md:text-lg text-primary font-bold uppercase tracking-[0.3em] sm:tracking-[0.4em]">
                  Built on
                </span>
                <div className="h-[1px] w-8 sm:w-12 bg-gradient-to-l from-transparent to-primary/50" />
              </div>

              {/* Mantle Logo - MUCH LARGER */}
              <div className="relative h-16 sm:h-20 md:h-24 lg:h-28 w-32 sm:w-40 md:w-48 lg:w-56">
                <Image
                  src="/mantle logo white.png"
                  alt="Mantle Network"
                  fill
                  className="object-contain filter brightness-100 group-hover:brightness-110 transition-all duration-500 drop-shadow-[0_0_20px_rgba(0,255,255,0.3)]"
                  priority
                />
                {/* Additional glow behind logo */}
                <div className="absolute inset-0 blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-500">
                  <Image
                    src="/mantle logo white.png"
                    alt=""
                    fill
                    className="object-contain"
                  />
                </div>
              </div>

              {/* Animated pulse indicators */}
              <div className="flex gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary shadow-lg shadow-primary/50" />
                </span>
                <span className="text-xs sm:text-sm text-muted-foreground font-medium">
                  High-Performance L2
                </span>
              </div>

              {/* Corner accent decorations */}
              <div className="absolute top-3 left-3 w-6 h-6 border-l-2 border-t-2 border-primary/40 rounded-tl-lg" />
              <div className="absolute top-3 right-3 w-6 h-6 border-r-2 border-t-2 border-primary/40 rounded-tr-lg" />
              <div className="absolute bottom-3 left-3 w-6 h-6 border-l-2 border-b-2 border-primary/40 rounded-bl-lg" />
              <div className="absolute bottom-3 right-3 w-6 h-6 border-r-2 border-b-2 border-primary/40 rounded-br-lg" />
            </div>
          </div>
        </div>
      </div>


    </section>
  );
};

export default LandingHero;
