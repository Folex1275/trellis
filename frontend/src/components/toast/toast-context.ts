import { createContext } from 'react'

export type ToastType = 'pending' | 'success' | 'error' | 'info'

export interface ToastLink {
  label: string
  href: string
}

export interface ToastOptions {
  /** Short headline, e.g. "Transaction submitted". */
  title: string
  /** Optional supporting detail, e.g. the contract error message. */
  message?: string
  /** Optional outbound link, e.g. the transaction on a block explorer. */
  link?: ToastLink
  /**
   * Milliseconds before the toast auto-dismisses. `null` keeps it on screen
   * until it is dismissed or updated — the default for `pending` toasts,
   * since a Soroban transaction can take several seconds to confirm.
   */
  duration?: number | null
}

export interface Toast extends ToastOptions {
  id: string
  type: ToastType
}

export interface ToastContextValue {
  toasts: Toast[]
  /** Show a toast and return its id, so it can be updated once the tx settles. */
  show: (type: ToastType, options: ToastOptions) => string
  pending: (options: ToastOptions) => string
  success: (options: ToastOptions) => string
  error: (options: ToastOptions) => string
  info: (options: ToastOptions) => string
  /** Replace the type/content of an existing toast in place. */
  update: (id: string, type: ToastType, options: ToastOptions) => void
  dismiss: (id: string) => void
  dismissAll: () => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)

/** Default lifetimes per toast type. Pending toasts stay until updated. */
export const DEFAULT_DURATIONS: Record<ToastType, number | null> = {
  pending: null,
  success: 5000,
  error: 8000,
  info: 5000,
}
