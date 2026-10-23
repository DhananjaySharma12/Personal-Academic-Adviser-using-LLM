/**
 * TopBar — botanical Sage & Blush palette header.
 */
import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Menu, User, LogOut, ChevronDown, GraduationCap, Bell, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { getSafeDisplayName, getSafeUserIdentifier } from '@/utils/phoneUtils'

export default function TopBar({ onMobileMenuOpen, mobileMenuOpen, menuButtonRef }) {
  const { user, profile, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      // Do NOT call navigate('/login') here.
      // After signOut(), Firebase fires onAuthStateChanged which sets user=null.
      // ProtectedRoute then renders <Navigate to="/login" replace />.
      // Manually navigating here causes a race: PublicOnlyRoute still sees
      // the old user token and redirects back to /app/dashboard (blank flash).
    } catch {
      // signOut failure is extremely rare — force redirect as fallback
      navigate('/login', { replace: true })
    }
  }

  const displayName = getSafeDisplayName(user, profile, 'User')
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const hasAvatar = !!profile?.avatarUrl

  return (
    <header
      className="relative z-30 flex h-14 shrink-0 items-center justify-between px-4 backdrop-blur-md"
      style={{
        background: 'rgba(254, 250, 243, 0.95)',
        borderBottom: '1px solid rgba(132, 162, 130, 0.25)',
        boxShadow: '0 1px 12px rgba(132, 162, 130, 0.10)',
      }}
    >
      {/* Left: mobile menu + logo */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          ref={menuButtonRef}
          onClick={onMobileMenuOpen}
          className="md:hidden flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl transition-colors hover:bg-sage/10 active:bg-sage/20 focus:outline-none focus:ring-2 focus:ring-sage/40"
          style={{ color: '#4A5E49' }}
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={Boolean(mobileMenuOpen)}
          aria-controls="mobile-navigation-drawer"
        >
          <Menu size={22} />
        </button>
        <Link to="/app/dashboard" className="md:hidden flex items-center gap-2">
          <GraduationCap size={20} style={{ color: '#84A282' }} />
          <span className="font-display text-sm font-semibold tracking-wide" style={{ color: '#2D3A2C' }}>
            Scholar Sense
          </span>
        </Link>
      </div>

      {/* Right: Quick actions & user avatar menu */}
      <div className="flex items-center gap-3">
        {/* Quick Notification Bell */}
        <Link
          to="/app/reminders"
          className="p-2 rounded-xl transition-all hover:bg-sage/10"
          style={{ color: '#7A8E79' }}
          title="Reminders & Notifications"
        >
          <Bell size={18} />
        </Link>

        {/* User Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2.5 rounded-xl px-3 py-1.5 text-sm font-medium transition-all duration-200"
            style={{
              background: 'rgba(132, 162, 130, 0.12)',
              border: '1px solid rgba(132, 162, 130, 0.30)',
              color: '#4A5E49',
              boxShadow: '0 0 10px rgba(132, 162, 130, 0.10)',
            }}
            aria-haspopup="true"
            aria-expanded={menuOpen}
          >
            {/* Avatar */}
            <div
              className="h-7 w-7 rounded-lg overflow-hidden flex items-center justify-center text-xs font-bold shrink-0"
              style={{
                background: hasAvatar ? undefined : 'linear-gradient(135deg, #84A282, #5E7A5C)',
                border: '1px solid rgba(132, 162, 130, 0.35)',
                color: '#FEFAF3',
              }}
            >
              {hasAvatar ? (
                <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <span className="hidden sm:block max-w-[120px] truncate" style={{ color: '#2D3A2C' }}>
              {displayName.split(' ')[0]}
            </span>
            <ChevronDown
              size={13}
              style={{ color: '#84A282' }}
              className={`transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`}
            />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-56 rounded-card z-50 overflow-hidden"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid rgba(132, 162, 130, 0.30)',
                  boxShadow: '0 8px 32px rgba(132, 162, 130, 0.18), 0 0 20px rgba(132, 162, 130, 0.10)',
                }}
                role="menu"
              >
                {/* User info header */}
                <div
                  className="px-4 py-3"
                  style={{ borderBottom: '1px solid rgba(132, 162, 130, 0.15)' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-9 w-9 rounded-xl overflow-hidden flex items-center justify-center text-sm font-bold shrink-0"
                      style={{
                        background: hasAvatar ? undefined : 'linear-gradient(135deg, #84A282, #5E7A5C)',
                        border: '1px solid rgba(132, 162, 130, 0.30)',
                        color: '#FEFAF3',
                      }}
                    >
                      {hasAvatar ? (
                        <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        initials
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: '#2D3A2C' }}>
                        {displayName}
                      </p>
                      <p className="text-[11px] truncate" style={{ color: '#7A8E79' }}>
                        {getSafeUserIdentifier(user, profile) || '—'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <div className="py-1.5">
                  <Link
                    to="/app/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm transition-colors"
                    style={{ color: '#4A5E49' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(132, 162, 130, 0.10)'
                      e.currentTarget.style.color = '#2D3A2C'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = '#4A5E49'
                    }}
                    role="menuitem"
                  >
                    <User size={14} style={{ color: '#84A282' }} />
                    Edit Profile & Avatar
                  </Link>

                  <Link
                    to="/app/reminders"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm transition-colors"
                    style={{ color: '#4A5E49' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(132, 162, 130, 0.10)'
                      e.currentTarget.style.color = '#2D3A2C'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = '#4A5E49'
                    }}
                    role="menuitem"
                  >
                    <Bell size={14} style={{ color: '#84A282' }} />
                    Study Reminders
                  </Link>

                  {user?.role === 'admin' && (
                    <Link
                      to="/app/admin"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm transition-colors"
                      style={{ color: '#8B4A5E' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(246, 226, 233, 0.40)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                      }}
                      role="menuitem"
                    >
                      <ShieldCheck size={14} style={{ color: '#8B4A5E' }} />
                      Admin Control Center
                    </Link>
                  )}

                  <div style={{ borderTop: '1px solid rgba(132, 162, 130, 0.15)', margin: '4px 0' }} />

                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-sm transition-colors"
                    style={{ color: '#7A8E79' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(192, 100, 90, 0.08)'
                      e.currentTarget.style.color = '#C0645A'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = '#7A8E79'
                    }}
                    role="menuitem"
                  >
                    <LogOut size={14} />
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
