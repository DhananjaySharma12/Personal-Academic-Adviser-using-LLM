/**
 * Sidebar — left navigation with botanical Sage & Blush palette.
 * Background: deep sage. Text: ivory. Accents: laurel & blush.
 */
import { NavLink, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  BookOpen,
  MessageSquare,
  CalendarDays,
  HelpCircle,
  FileText,
  BarChart2,
  Compass,
  GraduationCap,
  ChevronLeft,
  LogOut,
  Bell,
  ShieldCheck,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const NAV_ITEMS = [
  { to: '/app/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/app/subjects',   icon: BookOpen,        label: 'Subjects' },
  { to: '/app/chat',       icon: MessageSquare,   label: 'AI Advisor' },
  { to: '/app/planner',    icon: CalendarDays,    label: 'Study Planner' },
  { to: '/app/quiz',       icon: HelpCircle,      label: 'Quiz' },
  { to: '/app/documents',  icon: FileText,        label: 'PDF Assistant' },
  { to: '/app/analytics',  icon: BarChart2,       label: 'Analytics' },
  { to: '/app/career',     icon: Compass,         label: 'Career' },
  { to: '/app/reminders',  icon: Bell,            label: 'Reminders' },
]

export default function Sidebar({ collapsed, onToggle }) {
  const { logout, profile, user } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const displayName = profile?.displayName || user?.email?.split('@')[0] || 'Student'
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 224 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="relative hidden md:flex flex-col h-screen overflow-hidden shrink-0"
      style={{
        background: 'linear-gradient(180deg, #5E7A5C 0%, #4A5E49 60%, #3A4E39 100%)',
        borderRight: '1px solid rgba(184, 207, 179, 0.30)',
        boxShadow: '4px 0 24px rgba(94, 122, 92, 0.20)',
      }}
    >
      {/* ── Logo ─────────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-4 py-5"
        style={{ borderBottom: '1px solid rgba(254, 250, 243, 0.15)' }}
      >
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{
            background: 'rgba(254, 250, 243, 0.20)',
            border: '1px solid rgba(254, 250, 243, 0.35)',
            boxShadow: '0 0 12px rgba(184, 207, 179, 0.30)',
          }}
        >
          <GraduationCap size={18} style={{ color: '#FEFAF3' }} />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="font-display text-sm font-semibold tracking-wide whitespace-nowrap"
              style={{ color: '#FEFAF3' }}
            >
              Scholar Sense
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* ── Nav Items ──────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2" aria-label="Main navigation">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            className="group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150"
            style={({ isActive }) => ({
              background: isActive ? 'rgba(254, 250, 243, 0.18)' : 'transparent',
              color: isActive ? '#FEFAF3' : 'rgba(254, 250, 243, 0.65)',
              border: isActive ? '1px solid rgba(254, 250, 243, 0.25)' : '1px solid transparent',
              boxShadow: isActive ? '0 0 12px rgba(184, 207, 179, 0.20)' : 'none',
            })}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full"
                    style={{
                      background: '#B8CFB3',
                      boxShadow: '0 0 10px rgba(184, 207, 179, 0.70)',
                    }}
                  />
                )}
                <Icon
                  size={18}
                  className="shrink-0 transition-colors"
                  style={{ color: isActive ? '#B8CFB3' : 'rgba(254, 250, 243, 0.60)' }}
                />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="whitespace-nowrap"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </>
            )}
          </NavLink>
        ))}

        {/* Admin Link if role is admin */}
        {user?.role === 'admin' && (
          <NavLink
            to="/app/admin"
            title={collapsed ? 'Admin Control' : undefined}
            className="group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150"
            style={({ isActive }) => ({
              background: isActive ? 'rgba(246, 226, 233, 0.20)' : 'transparent',
              color: isActive ? '#F6E2E9' : 'rgba(246, 226, 233, 0.60)',
              border: isActive ? '1px solid rgba(246, 226, 233, 0.35)' : '1px solid transparent',
            })}
          >
            <ShieldCheck size={18} className="shrink-0" style={{ color: '#F6E2E9' }} />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="whitespace-nowrap"
                >
                  Admin Center
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        )}
      </nav>

      {/* ── User Profile Area ─────────────────────────────────────────── */}
      <div
        className="px-2 py-3 space-y-1"
        style={{ borderTop: '1px solid rgba(254, 250, 243, 0.15)' }}
      >
        {/* Profile link */}
        <Link
          to="/app/profile"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-150 group"
          style={{ color: 'rgba(254, 250, 243, 0.65)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(254, 250, 243, 0.12)'
            e.currentTarget.style.color = '#FEFAF3'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'rgba(254, 250, 243, 0.65)'
          }}
          title={collapsed ? `Profile: ${displayName}` : undefined}
        >
          {/* Avatar */}
          <div
            className="h-7 w-7 shrink-0 rounded-lg overflow-hidden flex items-center justify-center text-xs font-bold"
            style={{
              background: profile?.avatarUrl
                ? undefined
                : 'linear-gradient(135deg, #84A282, #5E7A5C)',
              color: '#FEFAF3',
              border: '1px solid rgba(254, 250, 243, 0.30)',
            }}
          >
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex-1 min-w-0"
              >
                <p className="text-xs font-semibold truncate" style={{ color: '#FEFAF3' }}>
                  {displayName}
                </p>
                <p className="text-[10px] truncate" style={{ color: 'rgba(254, 250, 243, 0.50)' }}>
                  Edit profile →
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150"
          style={{ color: 'rgba(254, 250, 243, 0.55)' }}
          title={collapsed ? 'Logout' : undefined}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(246, 226, 233, 0.15)'
            e.currentTarget.style.color = '#F6E2E9'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'rgba(254, 250, 243, 0.55)'
          }}
        >
          <LogOut size={17} className="shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150"
          style={{ color: 'rgba(254, 250, 243, 0.45)' }}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(254, 250, 243, 0.08)'
            e.currentTarget.style.color = 'rgba(254, 250, 243, 0.75)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'rgba(254, 250, 243, 0.45)'
          }}
        >
          <motion.span animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.25 }}>
            <ChevronLeft size={17} />
          </motion.span>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="whitespace-nowrap text-sm"
              >
                Collapse
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  )
}
