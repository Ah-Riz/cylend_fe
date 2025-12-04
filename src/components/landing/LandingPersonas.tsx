"use client";

import { Building2, Wallet, TrendingUp } from "lucide-react";
import { ScrollReveal } from "@/hooks/use-scroll-animation";
import { BidirectionalScroll } from "@/components/animations/BidirectionalScroll";

const LandingPersonas = () => {
  const personas = [
    {
      icon: Building2,
      title: "Institutional Lenders",
      description: "Deploy capital into yield-generating pools without exposing your allocation strategy to competitors.",
      tags: ["Funds", "Family Offices", "Treasuries"],
    },
    {
      icon: Wallet,
      title: "Private Borrowers",
      description: "Access credit with confidential terms. No public exposure of your financial position or counterparties.",
      tags: ["DAOs", "Protocols", "Enterprises"],
    },
    {
      icon: TrendingUp,
      title: "Credit Desks",
      description: "Facilitate OTC deals with on-chain settlement but off-chain confidentiality of relationships and terms.",
      tags: ["Market Makers", "OTC Desks", "Facilitators"],
    },
  ];

  return (
    <section className="py-32 px-6 border-t border-border bg-card/30">
      <div className="container mx-auto max-w-6xl">
        <div className="space-y-16">
          {/* Header */}
          <BidirectionalScroll direction="up" intensity="normal">
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-medium">
                Built for institutions
              </h2>
              <p className="text-lg text-muted-foreground">
                Designed for sophisticated participants who need privacy without sacrificing transparency.
              </p>
            </div>
          </BidirectionalScroll>

          {/* Persona cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {personas.map((persona, index) => (
              <BidirectionalScroll
                key={index}
                direction={index === 0 ? 'left' : index === 1 ? 'up' : 'right'}
                intensity="normal"
              >
                <div className="bg-card glow-border rounded-xl p-8 space-y-5 h-full">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <persona.icon className="h-6 w-6 text-primary" />
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-xl font-medium">{persona.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {persona.description}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {persona.tags.map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </BidirectionalScroll>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingPersonas;
