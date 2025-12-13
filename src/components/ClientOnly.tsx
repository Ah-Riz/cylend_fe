"use client";

import { useSyncExternalStore } from "react";

interface ClientOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * ClientOnly component ensures children are only rendered on the client side
 * to prevent hydration mismatches for components that rely on browser APIs
 */
export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const hasMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!hasMounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
