"use client"

import * as React from "react"
import { XIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  className?: string
}

interface ModalContentProps {
  children: React.ReactNode
  className?: string
  showCloseButton?: boolean
  onClose?: () => void
}

interface ModalHeaderProps {
  children: React.ReactNode
  className?: string
}

interface ModalFooterProps {
  children: React.ReactNode
  className?: string
}

interface ModalTitleProps {
  children: React.ReactNode
  className?: string
}

interface ModalDescriptionProps {
  children: React.ReactNode
  className?: string
}

function Modal({ open, onOpenChange, children, className }: ModalProps) {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false)
      }
    }

    if (open) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      {/* Modal Content */}
      <div className={cn("relative z-10", className)}>
        {children}
      </div>
    </div>
  )
}

function ModalContent({
  children,
  className,
  showCloseButton = true,
  onClose
}: ModalContentProps) {
  return (
    <div
      className={cn(
        "bg-background rounded-xl border border-border/50 shadow-2xl",
        "backdrop-blur-sm bg-background/95 supports-[backdrop-filter]:bg-background/80",
        "animate-in fade-in-0 zoom-in-95 slide-in-from-top-[2%] duration-300",
        "max-h-[95vh] overflow-hidden flex flex-col",
        className
      )}
    >
      {children}
      {showCloseButton && onClose && (
        <button
          className="absolute top-4 right-4 rounded-xs opacity-70 transition-all duration-200 hover:opacity-100 hover:bg-accent hover:scale-110 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none disabled:pointer-events-none p-2"
          onClick={onClose}
        >
          <XIcon className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      )}
    </div>
  )
}

function ModalHeader({ children, className }: ModalHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 text-center sm:text-left px-8 pt-6 pb-4",
        "border-b border-border/50 bg-muted/20",
        className
      )}
    >
      {children}
    </div>
  )
}

function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-3 sm:flex-row sm:justify-end px-8 py-6",
        "border-t border-border/50 bg-muted/10",
        className
      )}
    >
      {children}
    </div>
  )
}

function ModalTitle({ children, className }: ModalTitleProps) {
  return (
    <h2
      className={cn(
        "text-xl font-semibold leading-tight tracking-tight text-foreground",
        className
      )}
    >
      {children}
    </h2>
  )
}

function ModalDescription({ children, className }: ModalDescriptionProps) {
  return (
    <p
      className={cn(
        "text-muted-foreground text-sm leading-relaxed",
        className
      )}
    >
      {children}
    </p>
  )
}

export {
  Modal,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalTitle,
  ModalDescription,
}
