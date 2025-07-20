"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";
import { useLenis } from "@/hooks/use-lenis";
import { cn } from "@/lib/utils";

interface ScrollToTopProps {
  className?: string;
  showAfter?: number;
}

export function ScrollToTop({ className, showAfter = 400 }: ScrollToTopProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { scrollToTop } = useLenis();

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > showAfter) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);

    return () => window.removeEventListener("scroll", toggleVisibility);
  }, [showAfter]);

  if (!isVisible) {
    return null;
  }

  return (
    <Button
      onClick={() => scrollToTop({ duration: 1.5 })}
      size="icon"
      className={cn(
        "fixed bottom-8 right-8 z-50 rounded-full shadow-lg transition-all duration-300 hover:shadow-xl",
        className
      )}
      aria-label="Scroll to top"
    >
      <ArrowUp className="h-4 w-4" />
    </Button>
  );
}