"use client"

import { toast as sonnerToast } from "sonner"
import React from "react"

export type ToastVariant = "success" | "error" | "warning" | "info"

// Icons for toast variants
import { CheckCircle2, AlertCircle, Flame, Info } from "lucide-react"

const VARIANT_ICONS: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4" />,  
  error: <AlertCircle className="h-4 w-4" />,  
  warning: <Flame className="h-4 w-4" />,  
  info: <Info className="h-4 w-4" />,  
}

// Basic style adjustments; sonner default theme will handle background
const VARIANT_STYLES: Record<ToastVariant, React.CSSProperties> = {
  success: { border: "1px solid var(--primary)", color: "var(--primary)" },
  error:   { border: "1px solid var(--destructive)", color: "var(--destructive)" },
  warning: { border: "1px solid var(--accent)", color: "var(--accent)" },
  info:    { border: "1px solid var(--secondary)", color: "var(--secondary)" },
}

/**
 * Show a toast message with a given variant.
 * @param message The text to display in the toast.
 * @param variant One of success, error, warning, or info.
 * @param options Additional Sonner ToastOptions.
 */
export function toast(
  message: string,
  variant: ToastVariant = "info",
  options?: Parameters<typeof sonnerToast>[1]
) {
  return sonnerToast(message, {
    icon: VARIANT_ICONS[variant],
    style: {
      backgroundColor: 'var(--popover)',
      ...VARIANT_STYLES[variant],
      ...(options?.style || {}),
    },
    ...options,
  })
}
