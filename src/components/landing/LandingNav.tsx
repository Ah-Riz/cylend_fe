"use client";

import { Shield } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

const LandingNav = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/80 backdrop-blur-lg border-b border-border"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto max-w-7xl px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <Shield className="h-5 w-5 text-primary transition-transform group-hover:scale-110" />
            <span className="font-medium text-foreground">Cylend</span>
          </Link>

          {/* CTA */}
          <Link href="/app">
            <Button size="sm" className="hover:shadow-lg hover:shadow-primary/20">
              Enter App
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default LandingNav;
