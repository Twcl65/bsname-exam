"use client"

import { toast } from "sonner"

type ToastType = "success" | "error" | "info" | "warning"

export function useToast() {
  const showToast = (
    type: ToastType,
    title: string,
    description?: string,
    options?: Record<string, unknown>
  ) => {
    switch (type) {
      case "success":
        toast.success(title, { description, ...options })
        break
      case "error":
        toast.error(title, { description, ...options })
        break
      case "info":
        toast.info(title, { description, ...options })
        break
      case "warning":
        toast.warning(title, { description, ...options })
        break
      default:
        toast(title, { description, ...options })
    }
  }

  return { showToast }
}