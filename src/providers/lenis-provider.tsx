"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";

interface LenisProviderProps {
  children: React.ReactNode;
}

export function LenisProvider({ children }: LenisProviderProps) {
  const lenisRef = useRef<Lenis | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // Initialize Lenis
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: "vertical",
      gestureDirection: "vertical",
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
      normalizeWheel: true,
      wheelMultiplier: 1,
    });

    lenisRef.current = lenis;

    // Expose lenis instance globally for use in other components
    (window as any).lenis = lenis;

    // Add lenis class to html element
    document.documentElement.classList.add('lenis');

    // Animation frame loop
    function raf(time: number) {
      lenis.raf(time);
      rafRef.current = requestAnimationFrame(raf);
    }

    rafRef.current = requestAnimationFrame(raf);

    // Handle route changes - stop smooth scroll during navigation
    const handleRouteChange = () => {
      lenis.stop();
      setTimeout(() => lenis.start(), 100);
    };

    // Listen for navigation events
    window.addEventListener('beforeunload', handleRouteChange);

    // Cleanup
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      window.removeEventListener('beforeunload', handleRouteChange);
      document.documentElement.classList.remove('lenis');
      lenis.destroy();
      delete (window as any).lenis;
    };
  }, []);

  return <>{children}</>;
}