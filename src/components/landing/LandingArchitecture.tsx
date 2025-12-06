"use client";

import { ArrowRight, Lock, Globe, Zap, ChevronRight, Shield, Eye } from "lucide-react";
import { ScrollReveal } from "@/hooks/use-scroll-animation";
import { BidirectionalScroll, ParallaxSection } from "@/components/animations/BidirectionalScroll";
import { useEffect, useState } from "react";

const LandingArchitecture = () => {
  const [mounted, setMounted] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    setMounted(true);
    // Auto-cycle through steps
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const steps = [
    {
      icon: Globe,
      title: "Mantle",
      subtitle: "Public Layer",
      description: "Escrow contracts hold and disburse funds with full on-chain transparency.",
      color: "from-blue-500/20 to-cyan-500/20",
      borderColor: "border-cyan-500/30",
      glowColor: "shadow-cyan-500/20",
    },
    {
      icon: Zap,
      title: "Hyperlane",
      subtitle: "Bridge Layer",
      description: "Secure cross-chain messaging connects public and private layers.",
      color: "from-purple-500/20 to-pink-500/20",
      borderColor: "border-purple-500/30",
      glowColor: "shadow-purple-500/20",
    },
    {
      icon: Lock,
      title: "Sapphire",
      subtitle: "Private Vault",
      description: "Confidential credit logic, terms evaluation, and borrower verification.",
      color: "from-emerald-500/20 to-teal-500/20",
      borderColor: "border-emerald-500/30",
      glowColor: "shadow-emerald-500/20",
    },
  ];

  return (
    <section id="architecture" className="relative py-32 px-6 border-t border-border/50 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--primary)/0.03)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--primary)/0.03)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      
      <div className="relative container mx-auto max-w-7xl">
        <div className="space-y-24">
          {/* Header with animation */}
          <div 
            className="text-center space-y-6 max-w-3xl mx-auto"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? "translateY(0)" : "translateY(20px)",
              transition: "all 1s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/20 text-sm text-primary">
              <Shield className="h-4 w-4" />
              <span>Architecture</span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              How it works
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              A dual-layer architecture separating public custody from private credit logic
            </p>
          </div>

          {/* Enhanced Architecture flow */}
          <div className="relative">
            {/* Animated connection line */}
            <div className="hidden lg:block absolute top-1/2 left-[15%] right-[15%] h-[2px]">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
              <div 
                className="absolute h-full bg-gradient-to-r from-primary/60 via-primary to-primary/60"
                style={{
                  width: '30%',
                  left: `${activeStep * 33.33}%`,
                  transition: 'left 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 0 20px hsl(var(--primary) / 0.5)',
                }}
              />
            </div>

            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={`
                    relative group cursor-pointer
                    ${activeStep === index ? 'scale-105' : 'scale-100 opacity-80'}
                    transition-all duration-500
                  `}
                  onClick={() => setActiveStep(index)}
                  style={{
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? "translateY(0)" : "translateY(30px)",
                    transition: `all 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${0.2 + index * 0.1}s`,
                  }}
                >
                  {/* Card with glassmorphism */}
                  <div className={`
                    relative h-full
                    bg-gradient-to-b ${step.color}
                    backdrop-blur-xl
                    border ${activeStep === index ? step.borderColor : 'border-border/50'}
                    rounded-2xl p-8
                    hover:border-primary/50
                    transition-all duration-500
                    hover:shadow-2xl ${activeStep === index ? step.glowColor : ''}
                    hover:-translate-y-2
                  `}>
                    {/* Active indicator */}
                    {activeStep === index && (
                      <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 opacity-50 blur-sm animate-pulse" />
                    )}
                    
                    {/* Step badge */}
                    <div className="absolute -top-4 left-8 px-3 py-1 bg-background border border-border rounded-full">
                      <span className="text-xs font-medium text-muted-foreground">
                        Step {index + 1}
                      </span>
                    </div>
                    
                    {/* Icon with glow effect */}
                    <div className="relative mb-6">
                      <div className={`
                        h-14 w-14 rounded-xl
                        bg-gradient-to-br ${step.color}
                        border ${step.borderColor}
                        flex items-center justify-center
                        group-hover:scale-110 transition-transform duration-300
                      `}>
                        <step.icon className="h-7 w-7 text-primary" />
                      </div>
                      {activeStep === index && (
                        <div className="absolute inset-0 rounded-xl bg-primary/20 blur-xl animate-pulse" />
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-2xl font-bold text-foreground mb-1">
                          {step.title}
                        </h3>
                        <span className="text-sm font-medium text-primary uppercase tracking-wider">
                          {step.subtitle}
                        </span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </div>

                    {/* Arrow for flow */}
                    {index < steps.length - 1 && (
                      <ChevronRight className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 h-8 w-8 text-primary/30 z-10" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Enhanced Flow description */}
          <div 
            className="relative max-w-4xl mx-auto"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? "translateY(0) scale(1)" : "translateY(20px) scale(0.98)",
              transition: "all 1s cubic-bezier(0.4, 0, 0.2, 1) 0.8s",
            }}
          >
            <div className="relative bg-gradient-to-b from-card/50 to-card/30 backdrop-blur-xl border border-border/50 rounded-2xl p-8 lg:p-10 hover:border-primary/30 transition-all duration-500">
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-primary/0 via-primary/5 to-primary/0 opacity-0 hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Eye className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">The Privacy Flow</h3>
                    <p className="text-sm text-muted-foreground">End-to-end confidential lending</p>
                  </div>
                </div>
                
                <div className="space-y-4 pl-14">
                  {[
                    { icon: "1", text: "Lenders deposit funds into Mantle escrow contracts" },
                    { icon: "2", text: "Borrowers submit encrypted credit requests via Hyperlane" },
                    { icon: "3", text: "Sapphire evaluates terms confidentially and authorizes release" },
                    { icon: "4", text: "Public chain only sees: Contract → Borrower transfer" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 group">
                      <div className="h-7 w-7 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                        <span className="text-xs font-bold text-primary">{item.icon}</span>
                      </div>
                      <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-sm text-foreground">
                    <span className="font-medium text-primary">Result:</span> Terms, identity, and lending strategy remain completely private
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingArchitecture;
