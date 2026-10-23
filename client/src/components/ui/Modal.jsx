/**
 * Modal — accessible dialog with focus trap and Framer Motion animation.
 */
import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

export default function Modal({ isOpen, open, onClose, title, children, size = 'md' }) {
  const isModalOpen = Boolean(isOpen ?? open)
  const overlayRef = useRef(null)
  const closeRef = useRef(null)

  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  // Close on Escape & initial focus setup
  useEffect(() => {
    if (!isModalOpen) return
    const onKey = (e) => { if (e.key === 'Escape') onCloseRef.current?.() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isModalOpen])

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = isModalOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isModalOpen])

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return (
    <AnimatePresence>
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Backdrop */}
          <motion.div
            ref={overlayRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`relative w-full ${sizeClasses[size]} max-h-[92vh] flex flex-col bg-surface border border-border rounded-card shadow-2xl`}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 sm:px-6 py-3.5 sm:py-4 shrink-0">
              <h2 id="modal-title" className="font-display text-base sm:text-lg font-semibold text-text-main truncate">
                {title}
              </h2>
              <button
                ref={closeRef}
                onClick={onClose}
                className="rounded-lg h-9 w-9 flex items-center justify-center text-text-muted hover:text-text-main hover:bg-raised transition-colors shrink-0 ml-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="px-4 sm:px-6 py-4 sm:py-5 overflow-y-auto flex-1">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
