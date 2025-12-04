"use client";

import { Shield, Landmark, FileCheck } from "lucide-react";
import { ScrollReveal } from "@/hooks/use-scroll-animation";

const LandingSolution = () => {
  const features = [
    {
      icon: Landmark,
      title: "Supply Liquidity",
      description: "Deposit assets into privacy-preserving pools. Earn yield without revealing your positions.",
      cta: "Start earning",
    },
    {
      icon: Shield,
      title: "Borrow Privately",
      description: "Access credit with confidential terms. Your strategy stays yours.",
      cta: "Get credit",
    },
    {
      icon: FileCheck,
      title: "Transparent Settlement",
      description: "All settlements are verifiable on-chain. Trust the math, not the middleman.",
      cta: "View records",
    },
  ];

  return (
    <section className="py-32 px-6 border-t border-border bg-card/30">
      <div className="container mx-auto max-w-6xl">
        <div className="space-y-16">
          {/* Headline */}
          <ScrollReveal animation="fade-up" duration={1}>
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-medium">
                Lending reimagined for institutions
              </h2>
              <p className="text-lg text-muted-foreground">
                The same liquidity efficiency as AAVE, with institutional-grade privacy.
              </p>
            </div>
          </ScrollReveal>

          {/* Feature cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <ScrollReveal
                key={index}
                animation="fade-up"
                delay={index * 0.1}
                duration={0.8}
              >
                <div className="bg-card glow-border rounded-lg p-8 space-y-5 h-full flex flex-col">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-2 flex-1">
                    <h3 className="text-xl font-medium">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                  <span className="text-sm text-primary hover:text-primary/80 transition-colors cursor-pointer">
                    {feature.cta} →
                  </span>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingSolution;
