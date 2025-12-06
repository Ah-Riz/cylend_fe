"use client";

import { ArrowRight, Lock, Globe, Zap } from "lucide-react";
import { ScrollReveal } from "@/hooks/use-scroll-animation";
import { BidirectionalScroll, ParallaxSection } from "@/components/animations/BidirectionalScroll";

const LandingArchitecture = () => {
  const steps = [
    {
      icon: Globe,
      title: "Mantle",
      subtitle: "Public Layer",
      description: "Escrow contracts hold and disburse funds with full on-chain transparency.",
    },
    {
      icon: Zap,
      title: "Hyperlane",
      subtitle: "Bridge",
      description: "Secure cross-chain messaging connects public and private layers.",
    },
    {
      icon: Lock,
      title: "Sapphire",
      subtitle: "Private Vault",
      description: "Confidential credit logic, terms evaluation, and borrower verification.",
    },
  ];

  return (
    <section id="architecture">
    <ParallaxSection className="py-32 px-6 border-t border-border">
      <div className="container mx-auto max-w-6xl">
        <div className="space-y-20">
          {/* Header */}
          <BidirectionalScroll direction="up" intensity="normal">
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-medium">
                How it works
              </h2>
              <p className="text-lg text-muted-foreground">
                A dual-layer architecture separating public custody from private credit logic.
              </p>
            </div>
          </BidirectionalScroll>

          {/* Architecture flow */}
          <div className="grid md:grid-cols-3 gap-6 relative">
            {/* Connection lines for desktop */}
            <div className="hidden md:block absolute top-1/2 left-[calc(33.33%-1rem)] right-[calc(33.33%-1rem)] h-px bg-gradient-to-r from-border via-primary/30 to-border" />
            
            {steps.map((step, index) => (
              <BidirectionalScroll
                key={index}
                direction={index === 0 ? 'left' : index === 1 ? 'zoom' : 'right'}
                intensity="subtle"
              >
                <div className="relative bg-card border border-border rounded-xl p-8 space-y-4 h-full hover:border-primary/30 transition-all duration-500">
                  {/* Step number */}
                  <div className="absolute -top-3 left-6 px-2 bg-background text-xs text-muted-foreground">
                    Step {index + 1}
                  </div>
                  
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <step.icon className="h-6 w-6 text-primary" />
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-medium">{step.title}</h3>
                    <span className="text-xs text-primary uppercase tracking-wider">{step.subtitle}</span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </BidirectionalScroll>
            ))}
          </div>

          {/* Flow description */}
          <ScrollReveal animation="fade-up" delay={0.3} duration={1}>
            <div className="bg-card/50 border border-border rounded-xl p-8 max-w-3xl mx-auto">
              <div className="flex items-center gap-3 mb-4">
                <ArrowRight className="h-5 w-5 text-primary" />
                <span className="font-medium">The flow</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Lenders deposit into Mantle escrow. Borrowers submit encrypted credit requests via Hyperlane to Sapphire. 
                The vault evaluates terms confidentially, then authorizes Mantle to release funds. 
                The public chain only sees: <span className="text-foreground">Contract → Borrower</span>. 
                Terms, identity, and strategy remain private.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </ParallaxSection>
    </section>
  );
};

export default LandingArchitecture;
