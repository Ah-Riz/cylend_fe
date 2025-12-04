"use client";

import { ScrollReveal } from "@/hooks/use-scroll-animation";
import { BidirectionalScroll } from "@/components/animations/BidirectionalScroll";
import { AlertTriangle, Eye, TrendingDown } from "lucide-react";

const LandingProblem = () => {
  const problems = [
    {
      icon: Eye,
      title: "Exposed Positions",
      description: "Every loan, every counterparty, every amount is public on-chain.",
    },
    {
      icon: AlertTriangle,
      title: "Strategy Leakage",
      description: "Competitors can front-run your moves and copy your strategies.",
    },
    {
      icon: TrendingDown,
      title: "Market Impact",
      description: "Large positions create price movements before you can execute.",
    },
  ];

  return (
    <section className="py-32 px-6 border-t border-border">
      <div className="container mx-auto max-w-6xl">
        <div className="space-y-16">
          {/* Headline */}
          <BidirectionalScroll direction="up" intensity="normal">
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-medium">
                DeFi lending has a privacy problem
              </h2>
              <p className="text-lg text-muted-foreground">
                Traditional on-chain lending exposes your entire financial strategy to the world.
              </p>
            </div>
          </BidirectionalScroll>

          {/* Problem cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {problems.map((problem, index) => (
              <BidirectionalScroll
                key={index}
                direction={index === 0 ? 'left' : index === 1 ? 'zoom' : 'right'}
                intensity="normal"
              >
                <div className="bg-destructive/5 border border-destructive/30 rounded-xl p-8 space-y-5 h-full hover:border-destructive/30 transition-colors duration-500">
                  <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <problem.icon className="h-5 w-5 text-destructive" />
                  </div>
                  <h3 className="text-lg font-medium">{problem.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {problem.description}
                  </p>
                </div>
              </BidirectionalScroll>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingProblem;
