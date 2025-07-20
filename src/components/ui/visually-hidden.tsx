"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface VisuallyHiddenProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode
}

/**
 * VisuallyHidden component that hides content visually but keeps it accessible to screen readers
 */
export function VisuallyHidden({ children, className, ...props }: VisuallyHiddenProps) {
  return (
    <span
      className={cn(
        "absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0",
        "clip-path-[inset(50%)]", // Modern browsers
        className
      )}
      style={{
        clipPath: "inset(50%)",
        clip: "rect(0 0 0 0)", // Fallback for older browsers
      }}
      {...props}
    >
      {children}
    </span>
  )
}
