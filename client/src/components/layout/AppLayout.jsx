/**
 * AppLayout — wraps all protected pages with Sidebar + TopBar.
 * Mobile: full slide-in drawer with backdrop, Escape key listener, body scroll lock,
 * and accessible focus handling.
 *
 * DRAWER WIDTH NOTE: We use inline style={{ width: 'min(272px, 85vw)' }} instead of
 * Tailwind arbitrary value classes (w-[17rem]) because Tailwind JIT only compiles classes
 * that appear in the initial source scan. Classes added via patch scripts after the dev
 * server starts may not make it into the generated CSS bundle.
 */
import { useState, useEffect, useRef } from 'react'
import { Outlet, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

// Drawer width enforced as a CSS inline style — guaranteed to apply regardless of Tailwind JIT.
// min(17rem, 85vw) ≈ 272px on standard root font size; 85vw cap ensures it never fills narrow screens.
const DRAWER_WIDTH = 'min(17rem, 85vw)'

export default function AppLayout() {
  const [searchParams] = useSearchParams()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(
    () => searchParams.get('drawer') === 'open'
  )
  const menuButtonRef = useRef(null)

  // Close mobile drawer on Escape key and restore focus
  useEffect(() => {
    if (!mobileMenuOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false)
        menuButtonRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mobileMenuOpen])

  // Prevent background body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#FEFAF3' }}>
      {/* Desktop sidebar — hidden on mobile via hidden md:flex in Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((v) => !v)}
      />

      {/* Mobile drawer — only rendered below md breakpoint */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden" id="mobile-navigation-drawer">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => {
                setMobileMenuOpen(false)
                menuButtonRef.current?.focus()
              }}
              aria-hidden="true"
            />
            {/* Slide-out drawer panel.
                Width is set via inline style, NOT Tailwind arbitrary value, to guarantee
                the rule is applied even if JIT hasn't compiled the class. */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="relative z-10 h-full shadow-2xl"
              style={{
                width: DRAWER_WIDTH,
                maxWidth: '85vw',
                maxHeight: '100dvh',
              }}
            >
              <Sidebar
                isMobile={true}
                onClose={() => {
                  setMobileMenuOpen(false)
                  menuButtonRef.current?.focus()
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar
          onMobileMenuOpen={() => setMobileMenuOpen(true)}
          mobileMenuOpen={mobileMenuOpen}
          menuButtonRef={menuButtonRef}
        />
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
