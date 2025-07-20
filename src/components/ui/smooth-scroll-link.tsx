"use client";

import { useLenis } from "@/hooks/use-lenis";
import { cn } from "@/lib/utils";

interface SmoothScrollLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  duration?: number;
  offset?: number;
}

export function SmoothScrollLink({
  href,
  children,
  className,
  duration = 1.5,
  offset = 0,
}: SmoothScrollLinkProps) {
  const { scrollTo } = useLenis();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (href.startsWith("#")) {
      const target = document.querySelector(href);
      if (target) {
        scrollTo(target as HTMLElement, { duration, offset });
      }
    } else {
      // For external links, use normal navigation
      window.location.href = href;
    }
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className={cn("cursor-pointer", className)}
    >
      {children}
    </a>
  );
}