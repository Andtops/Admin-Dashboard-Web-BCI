"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog"
import { Button } from "./button"
import { Loader2 } from "lucide-react"

interface EnhancedDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl"
  loading?: boolean
}

const sizeClasses = {
  sm: "w-full max-w-sm mx-4 sm:mx-auto",
  md: "w-full max-w-md mx-4 sm:mx-auto",
  lg: "w-full max-w-lg mx-4 sm:mx-auto",
  xl: "w-full max-w-xl mx-4 sm:mx-auto",
  "2xl": "w-full max-w-2xl mx-4 sm:mx-auto",
  "3xl": "w-full max-w-3xl mx-4 sm:mx-auto",
  "4xl": "w-full max-w-4xl mx-4 sm:mx-auto",
  "5xl": "w-full max-w-5xl mx-4 sm:mx-auto",
}

export function EnhancedDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
  size = "lg",
  loading = false,
}: EnhancedDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          sizeClasses[size],
          "max-h-[90vh] overflow-hidden flex flex-col",
          className
        )}
        aria-labelledby="dialog-title"
        aria-describedby={description ? "dialog-description" : undefined}
        role="dialog"
        aria-modal="true"
      >
        <DialogHeader>
          <DialogTitle
            id="dialog-title"
            className="flex items-center gap-2"
          >
            {loading && (
              <Loader2
                className="h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            )}
            {title || "Dialog"}
          </DialogTitle>
          {description && (
            <DialogDescription id="dialog-description">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div
          className="flex-1 overflow-y-auto px-4 py-4 sm:px-6"
          role="main"
          tabIndex={-1}
        >
          {children}
        </div>

        {footer && (
          <DialogFooter role="group" aria-label="Dialog actions">
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

interface FormSectionProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <div className={cn("space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-500", className)}>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold leading-none tracking-tight border-b border-border/50 pb-3 transition-colors duration-200">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed transition-colors duration-200">
            {description}
          </p>
        )}
      </div>
      <div className="space-y-4 pt-2">
        {children}
      </div>
    </div>
  )
}

interface FormFieldProps {
  label: string
  description?: string
  required?: boolean
  error?: string
  children: React.ReactNode
  className?: string
}

export function FormField({
  label,
  description,
  required = false,
  error,
  children,
  className
}: FormFieldProps) {
  const fieldId = React.useId()
  const errorId = error ? `${fieldId}-error` : undefined
  const descriptionId = description ? `${fieldId}-description` : undefined

  return (
    <div className={cn("space-y-2 animate-in fade-in-0 slide-in-from-left-1 duration-300", className)}>
      <div className="space-y-1">
        <label
          htmlFor={fieldId}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 transition-colors duration-200"
        >
          {label}
          {required && (
            <>
              <span className="text-destructive ml-1" aria-hidden="true">*</span>
              <span className="sr-only">(required)</span>
            </>
          )}
        </label>
        {description && (
          <p
            id={descriptionId}
            className="text-xs text-muted-foreground leading-relaxed"
          >
            {description}
          </p>
        )}
      </div>
      {React.cloneElement(children as React.ReactElement<any>, {
        id: fieldId,
        'aria-describedby': [descriptionId, errorId].filter(Boolean).join(' ') || undefined,
        'aria-invalid': !!error,
        'aria-required': required,
      })}
      {error && (
        <p
          id={errorId}
          className="text-xs text-destructive leading-relaxed"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  )
}

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel?: () => void
  variant?: "default" | "destructive"
  loading?: boolean
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  variant = "default",
  loading = false,
}: ConfirmDialogProps) {
  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      onOpenChange(false)
    }
  }

  const handleConfirm = () => {
    onConfirm()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-full max-w-md mx-4 sm:mx-auto"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        role="alertdialog"
        aria-modal="true"
      >
        <DialogHeader>
          <DialogTitle id="confirm-dialog-title">
            {title || "Confirm Action"}
          </DialogTitle>
          <DialogDescription
            id="confirm-dialog-description"
            className="leading-relaxed"
          >
            {description}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter role="group" aria-label="Confirmation actions">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
            aria-label={`${cancelText} this action`}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant}
            onClick={handleConfirm}
            disabled={loading}
            aria-label={`${confirmText} this action`}
            autoFocus
          >
            {loading && (
              <Loader2
                className="h-4 w-4 animate-spin mr-2"
                aria-hidden="true"
              />
            )}
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface DetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  subtitle?: string
  children: React.ReactNode
  actions?: React.ReactNode
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl"
}

export function DetailDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  children,
  actions,
  size = "2xl",
}: DetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          sizeClasses[size],
          "max-h-[90vh] overflow-hidden flex flex-col"
        )}
        aria-labelledby="detail-dialog-title"
        aria-describedby={subtitle ? "detail-dialog-subtitle" : undefined}
        role="dialog"
        aria-modal="true"
      >
        <DialogHeader>
          <DialogTitle id="detail-dialog-title">
            {title || "Details"}
          </DialogTitle>
          {subtitle && (
            <DialogDescription id="detail-dialog-subtitle">
              {subtitle}
            </DialogDescription>
          )}
        </DialogHeader>

        <div
          className="flex-1 overflow-y-auto px-4 py-4 sm:px-6"
          role="main"
          tabIndex={-1}
          aria-label="Detail content"
        >
          {children}
        </div>

        {actions && (
          <DialogFooter role="group" aria-label="Detail actions">
            {actions}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

interface DetailSectionProps {
  title: string
  children: React.ReactNode
  className?: string
  columns?: 1 | 2 | 3
}

export function DetailSection({ title, children, className, columns = 2 }: DetailSectionProps) {
  const sectionId = React.useId()
  const gridClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  }

  return (
    <section
      className={cn("space-y-4", className)}
      aria-labelledby={`${sectionId}-title`}
    >
      <h4
        id={`${sectionId}-title`}
        className="font-semibold text-lg border-b border-border/30 pb-2"
      >
        {title}
      </h4>
      <div
        className={cn("grid gap-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300", gridClasses[columns])}
        role="group"
        aria-labelledby={`${sectionId}-title`}
      >
        {children}
      </div>
    </section>
  )
}

interface DetailFieldProps {
  label: string
  value: React.ReactNode
  className?: string
}

export function DetailField({ label, value, className }: DetailFieldProps) {
  const fieldId = React.useId()

  return (
    <div className={cn("space-y-1 group hover:bg-muted/30 rounded-md p-2 -m-2 transition-colors duration-200", className)}>
      <label
        id={`${fieldId}-label`}
        className="text-sm font-medium text-muted-foreground transition-colors duration-200 group-hover:text-foreground"
      >
        {label}
      </label>
      <div
        className="text-sm text-foreground transition-all duration-200"
        aria-labelledby={`${fieldId}-label`}
        role="text"
      >
        {value || (
          <span className="text-muted-foreground italic" aria-label={`${label} not provided`}>
            Not provided
          </span>
        )}
      </div>
    </div>
  )
}
