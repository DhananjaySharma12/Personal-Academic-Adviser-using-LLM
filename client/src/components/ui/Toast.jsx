/**
 * Toast notification system.
 * Usage: import { useToast } from '@/components/ui/Toast'
 * const { toast } = useToast()
 * toast({ type: 'success', message: 'Saved!' })
 */
import { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, AlertCircle, X } from 'lucide-react'

const ToastContext = createContext(null)

const icons = {
  success: <CheckCircle2 size={18} className="text-success" />,
  error: <XCircle size={18} className="text-danger" />,
  warning: <AlertCircle size={18} className="text-warning" />,
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback(({ type = 'success', message, duration = 4000 }) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration)
  }, [])

  /**
   * Positional-args alias used throughout the app:
   *   addToast('Message text', 'success' | 'error' | 'warning')
   * Maps to the object-based `toast({ type, message })` API above.
   */
  const addToast = useCallback(
    (message, type = 'success', duration = 4000) => toast({ type, message, duration }),
    [toast],
  )

  const dismiss = (id) => setToasts((prev) => prev.filter((t) => t.id !== id))

  return (
    <ToastContext.Provider value={{ toast, addToast }}>
      {children}
      <div
        className="fixed bottom-6 right-6 z-50 flex flex-col gap-2"
        aria-live="polite"
        aria-atomic="false"
      >
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="flex items-start gap-3 rounded-card bg-raised border border-border px-4 py-3 shadow-lg min-w-[280px] max-w-sm"
              role="alert"
            >
              {icons[t.type]}
              <p className="flex-1 text-sm text-text-main">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                className="text-text-muted hover:text-text-main transition-colors"
                aria-label="Dismiss"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  // ctx exposes both { toast } (object API) and { addToast } (positional API)
  return ctx
}
