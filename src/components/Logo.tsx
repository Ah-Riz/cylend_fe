"use client";

import React from "react";

type LogoProps = {
  variant?: "primary" | "secondary";
  className?: string;
  alt?: string;
};

export function Logo({ variant = "primary", className = "h-6 w-auto", alt = "Cylend logo" }: LogoProps) {
  const src = variant === "secondary" ? "/logo/secondary.svg" : "/logo/primary.svg";
  return <img src={src} alt={alt} className={className} />;
}

export default Logo;
