"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";

interface NavLinkProps {
  to: string;
  className?: string;
  activeClassName?: string;
  end?: boolean;
  children?: React.ReactNode;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ className, activeClassName, to, end, children, ...props }, ref) => {
    const pathname = usePathname();
    const isActive = end ? pathname === to : pathname.startsWith(to);
    const { setOpenMobile, isMobile } = useSidebar();

    const handleClick = () => {
      // Auto-close sidebar on mobile after clicking a nav link
      if (isMobile) {
        setOpenMobile(false);
      }
    };

    return (
      <Link
        ref={ref}
        href={to}
        className={cn(className, isActive && activeClassName)}
        onClick={handleClick}
        {...props}
      >
        {children}
      </Link>
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
