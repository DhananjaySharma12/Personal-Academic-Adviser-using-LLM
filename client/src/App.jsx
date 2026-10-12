/**
 * App.jsx — root router + providers.
 * Page transition: fade + slight slide via Framer Motion.
 */
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AuthProvider } from '@/contexts/AuthContext'
import { ToastProvider } from '@/components/ui/Toast'
import { ProtectedRoute, PublicOnlyRoute } from '@/components/auth/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'

// Public pages
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage'

// App pages — real implementations
import OnboardingPage from '@/pages/app/OnboardingPage'
import ProfilePage from '@/pages/app/ProfilePage'
import DashboardPage from '@/pages/app/DashboardPage'
import SubjectsPage from '@/pages/app/SubjectsPage'
import ChatPage from '@/pages/app/ChatPage'
import PlannerPage from '@/pages/app/PlannerPage'
import QuizPage from '@/pages/app/QuizPage'
import DocumentsPage from '@/pages/app/DocumentsPage'
import AnalyticsPage from '@/pages/app/AnalyticsPage'
import CareerPage from '@/pages/app/CareerPage'
import RemindersPage from '@/pages/app/RemindersPage'
import AdminPage from '@/pages/app/AdminPage'

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
}

function PageWrapper({ children }) {
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
      {children}
    </motion.div>
  )
}

export default function App() {
  const location = useLocation()

  return (
    <AuthProvider>
        <ToastProvider>
          <AnimatePresence mode="wait" initial={false}>
            <Routes location={location} key={location.pathname}>
              {/* ── Public routes ── */}
              <Route path="/" element={<PageWrapper><LandingPage /></PageWrapper>} />

              <Route element={<PublicOnlyRoute />}>
                <Route path="/login" element={<PageWrapper><LoginPage /></PageWrapper>} />
                <Route path="/register" element={<PageWrapper><RegisterPage /></PageWrapper>} />
                <Route path="/forgot-password" element={<PageWrapper><ForgotPasswordPage /></PageWrapper>} />
                <Route path="/reset-password" element={<PageWrapper><ResetPasswordPage /></PageWrapper>} />
              </Route>

              {/* ── Protected app routes ── */}
              <Route element={<ProtectedRoute />}>
                {/* Onboarding — allowed before onboarding is complete */}
                <Route path="/app/onboarding" element={<PageWrapper><OnboardingPage /></PageWrapper>} />

                <Route path="/app" element={<AppLayout />}>
                  <Route index element={<PageWrapper><DashboardPage /></PageWrapper>} />
                  <Route path="dashboard" element={<PageWrapper><DashboardPage /></PageWrapper>} />
                  <Route path="subjects" element={<PageWrapper><SubjectsPage /></PageWrapper>} />
                  <Route path="chat" element={<PageWrapper><ChatPage /></PageWrapper>} />
                  <Route path="planner" element={<PageWrapper><PlannerPage /></PageWrapper>} />
                  <Route path="quiz" element={<PageWrapper><QuizPage /></PageWrapper>} />
                  <Route path="documents" element={<PageWrapper><DocumentsPage /></PageWrapper>} />
                  <Route path="analytics" element={<PageWrapper><AnalyticsPage /></PageWrapper>} />
                  <Route path="career" element={<PageWrapper><CareerPage /></PageWrapper>} />
                  <Route path="reminders" element={<PageWrapper><RemindersPage /></PageWrapper>} />
                  <Route path="admin" element={<PageWrapper><AdminPage /></PageWrapper>} />
                  <Route path="profile" element={<PageWrapper><ProfilePage /></PageWrapper>} />
                </Route>
              </Route>

              {/* ── 404 ── */}
              <Route
                path="*"
                element={
                  <div className="min-h-screen bg-bg flex items-center justify-center">
                    <div className="text-center space-y-3">
                      <h1 className="font-display text-6xl font-bold text-primary-soft">404</h1>
                      <p className="text-text-secondary">Page not found</p>
                      <a href="/" className="inline-block text-primary-soft hover:underline text-sm mt-2">
                        ← Back to home
                      </a>
                    </div>
                  </div>
                }
              />
            </Routes>
          </AnimatePresence>
        </ToastProvider>
    </AuthProvider>
  )
}
