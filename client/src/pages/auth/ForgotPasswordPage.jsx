/**
 * ForgotPasswordPage.jsx — Request password reset link.
 * Sage & Blush botanical aesthetic with soft glow.
 */
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { GraduationCap, ArrowLeft, Mail, Loader2, CheckCircle2 } from 'lucide-react'
import { authApi } from '@/api/auth'

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

export default function ForgotPasswordPage() {
  const [isSuccess, setIsSuccess] = useState(false)
  const [devResetUrl, setDevResetUrl] = useState('')
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (data) => {
    setServerError('')
    try {
      const res = await authApi.forgotPassword(data.email)
      setIsSuccess(true)
      if (res?.devResetUrl) {
        setDevResetUrl(res.devResetUrl)
      }
    } catch (err) {
      setServerError(err.message || 'Failed to send reset instructions')
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 relative overflow-hidden">
      {/* Botanical glow backdrop */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 65% 45% at 50% 0%, rgba(132,162,130,0.2) 0%, transparent 70%), radial-gradient(circle at 85% 15%, rgba(246,226,233,0.1) 0%, transparent 45%)',
        }}
      />

      <div className="relative w-full max-w-md z-10 space-y-6">
        {/* Header & Logo */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
            <div className="w-10 h-10 rounded-xl bg-elevated border border-border-strong flex items-center justify-center shadow-glow-xs">
              <GraduationCap size={22} className="text-accent" />
            </div>
            <span className="font-display text-lg font-semibold text-text-main">
              Scholar Sense
            </span>
          </Link>
          <h1 className="font-display text-3xl font-bold text-text-main">Reset Password</h1>
          <p className="text-text-secondary text-sm">
            Enter your registered email and we&apos;ll send you a recovery link
          </p>
        </div>

        {/* Card */}
        <div className="card p-8 space-y-5">
          {isSuccess ? (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-accent/20 border border-accent/40 text-accent flex items-center justify-center mx-auto shadow-glow-xs">
                <CheckCircle2 size={24} />
              </div>
              <h2 className="font-display text-lg font-bold text-text-main">
                Check Your Email
              </h2>
              <p className="text-xs text-text-secondary leading-relaxed">
                If an account exists with that email address, password reset instructions have been issued.
              </p>

              {devResetUrl && (
                <div className="p-3.5 rounded-xl bg-elevated/70 border border-border-strong text-left space-y-2 text-xs">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-accent font-bold">
                    Dev Test Shortcut
                  </span>
                  <p className="text-text-muted">Click below to test your password reset directly:</p>
                  <a
                    href={devResetUrl}
                    className="inline-block px-3 py-1.5 rounded-lg bg-accent text-bg font-semibold hover:bg-accent-soft transition-colors"
                  >
                    Open Reset Page →
                  </a>
                </div>
              )}

              <div className="pt-2">
                <Link
                  to="/login"
                  className="text-xs text-accent hover:text-accent-soft font-medium inline-flex items-center gap-1.5"
                >
                  <ArrowLeft size={14} />
                  <span>Back to login</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-medium text-text-main">
                  Email address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="student@university.edu"
                    className={`input w-full pl-10 ${errors.email ? 'border-danger/60 focus:ring-danger/40' : ''}`}
                    {...register('email')}
                  />
                  <Mail
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                  />
                </div>
                {errors.email && (
                  <p className="text-danger text-xs mt-1">{errors.email.message}</p>
                )}
              </div>

              {serverError && (
                <div className="rounded-input bg-danger/10 border border-danger/30 px-3 py-2 text-danger text-xs">
                  {serverError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                {isSubmitting ? 'Sending instructions…' : 'Send Reset Link'}
              </button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="text-xs text-text-muted hover:text-text-main transition-colors inline-flex items-center gap-1.5"
                >
                  <ArrowLeft size={13} />
                  <span>Return to login</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
