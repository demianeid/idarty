'use client'

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
}

interface ToastContextValue {
  toast: (type: ToastType, message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

const TOAST_DURATION = 4000

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="size-5 shrink-0 text-[#24865b]" aria-hidden="true" />,
  error: <AlertCircle className="size-5 shrink-0 text-[#b42318]" aria-hidden="true" />,
  info: <Info className="size-5 shrink-0 text-brand-teal" aria-hidden="true" />,
}

const bgColors: Record<ToastType, string> = {
  success: 'bg-[#ecfdf5] border-[#a7f3d0]',
  error: 'bg-[#fef2f2] border-[#fecaca]',
  info: 'bg-[#f0faf9] border-[#b2e4df]',
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counterRef = useRef(0)

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback((type: ToastType, message: string) => {
    const id = `toast-${++counterRef.current}`
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => removeToast(id), TOAST_DURATION)
  }, [removeToast])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed bottom-4 left-4 right-4 z-[9999] flex flex-col items-center gap-2 sm:left-auto sm:right-4 sm:items-end"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border p-4 shadow-[0_8px_30px_rgba(11,11,15,0.12)] animate-in slide-in-from-bottom-2 fade-in duration-300 ${bgColors[t.type]}`}
          >
            {icons[t.type]}
            <p className="flex-1 text-sm font-medium text-ink">{t.message}</p>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="shrink-0 rounded-lg p-1 text-ink-muted transition hover:bg-black/5 hover:text-ink"
              aria-label="Dismiss"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
