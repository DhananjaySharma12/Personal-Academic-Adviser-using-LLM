/**
 * ResetPasswordPage.jsx — Set new password with token.
 * Sage & Blush botanical aesthetic with glowing inputs.
 */
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { GraduationCap, Eye, EyeOff, Loader2, CheckCircle2, Lock } from 'lucide-react'
import { authApi } from '@/api/auth'

const schema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()

  const [showPass, setShowPass] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (data) => {
    if (!token) {
      setServerError('Missing reset token in URL. Please click the link from your email.')
      return
    }
    setServerError('')
    try {
      await authApi.resetPassword(token, data.password)
      setIsSuccess(true)
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err) {
      setServerError(err.message || 'Failed to reset password')
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 relative overflow-hidden">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 65% 45% at 50% 0%, rgba(132,162,130,0.2) 0%, transparent 70%), radial-gradient(circle at 85% 15%, rgba(246,226,233,0.1) 0%, transparent 45%)',
        }}
      />

      <div className="relative w-full max-w-md z-10 space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
            <div className="w-10 h-10 rounded-xl bg-elevated border border-border-strong flex items-center justify-center shadow-glow-xs">
              <GraduationCap size={22} className="text-accent" />
            </div>
            <span className="font-display text-lg font-semibold text-text-main">
              Scholar Sense
            </span>
          </Link>
          <h1 className="font-display text-3xl font-bold text-text-main">New Password</h1>
          <p className="text-text-secondary text-sm">
            Create a secure new password for your account
          </p>
        </div>

        <div className="card p-8 space-y-5">
          {isSuccess ? (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-accent/20 border border-accent/40 text-accent flex items-center justify-center mx-auto shadow-glow-xs">
                <CheckCircle2 size={24} />
              </div>
              <h2 className="font-display text-lg font-bold text-text-main">
                Password Reset Complete!
              </h2>
              <p className="text-xs text-text-secondary leading-relaxed">
                Your password has been securely updated. Redirecting you to login…
              </p>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-block px-5 py-2.5 rounded-xl bg-accent text-bg font-semibold hover:bg-accent-soft transition-colors text-xs"
                >
                  Proceed to Login Now →
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {!token && (
                <div className="p-3 rounded-xl bg-warning/15 border border-warning/30 text-warning text-xs">
                  ⚠️ No reset token detected in the URL. Please ensure you opened the full link sent to your email.
                </div>
              )}

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-text-main">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={`input w-full pr-10 ${errors.password ? 'border-danger/60' : ''}`}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-danger text-xs">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-text-main">
                  Confirm New Password
                </label>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`input w-full ${errors.confirmPassword ? 'border-danger/60' : ''}`}
                  {...register('confirmPassword')}
                />
                {errors.confirmPassword && (
                  <p className="text-danger text-xs">{errors.confirmPassword.message}</p>
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
                {isSubmitting ? 'Updating password…' : 'Reset Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
