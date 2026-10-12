/**
 * LoginPage — botanical sage & blush palette.
 */
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { GraduationCap, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { authApi } from '@/api/auth'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname ?? '/app/dashboard'

  const [showPass, setShowPass] = useState(false)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (data) => {
    setServerError('')
    try {
      const { token, user, profile } = await authApi.login(data)
      login(token, user, profile)
      if (profile && !profile.onboardingComplete) {
        navigate('/app/onboarding', { replace: true })
      } else {
        navigate(from, { replace: true })
      }
    } catch (err) {
      setServerError(err.message)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: 'linear-gradient(145deg, #FEFAF3 0%, #F5F0E8 40%, #EDE8DE 100%)',
      }}
    >
      {/* Botanical radial glows */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 70% 50% at 50% 0%, rgba(184, 207, 179, 0.35) 0%, transparent 70%),
            radial-gradient(circle at 80% 80%, rgba(246, 226, 233, 0.30) 0%, transparent 50%),
            radial-gradient(circle at 10% 60%, rgba(132, 162, 130, 0.12) 0%, transparent 40%)
          `
        }}
      />

      <div className="relative w-full max-w-md z-10">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-6 group">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #84A282, #5E7A5C)',
                boxShadow: '0 0 20px rgba(132, 162, 130, 0.40)',
              }}
            >
              <GraduationCap size={22} style={{ color: '#FEFAF3' }} />
            </div>
            <span className="font-display text-lg font-semibold" style={{ color: '#2D3A2C' }}>
              Personal Academic Adviser
            </span>
          </Link>
          <h1 className="font-display text-3xl font-bold mb-2" style={{ color: '#2D3A2C' }}>Welcome back</h1>
          <p className="text-sm" style={{ color: '#7A8E79' }}>Sign in to continue your learning journey</p>
        </div>

        {/* Card */}
        <div
          className="p-8 space-y-5 rounded-card"
          style={{
            background: '#FFFFFF',
            border: '1px solid rgba(132, 162, 130, 0.25)',
            boxShadow: '0 4px 32px rgba(132, 162, 130, 0.15), 0 0 40px rgba(184, 207, 179, 0.10)',
          }}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="block text-sm font-medium" style={{ color: '#2D3A2C' }}>
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="input"
                style={errors.email ? { borderColor: '#C0645A' } : {}}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs mt-1" style={{ color: '#C0645A' }}>{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="block text-sm font-medium" style={{ color: '#2D3A2C' }}>
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs hover:underline transition-colors"
                  style={{ color: '#84A282' }}
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="input pr-10"
                  style={errors.password ? { borderColor: '#C0645A' } : {}}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#7A8E79' }}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs mt-1" style={{ color: '#C0645A' }}>{errors.password.message}</p>
              )}
            </div>

            {/* Server error */}
            {serverError && (
              <div
                className="rounded-input px-3 py-2 text-sm"
                style={{ background: 'rgba(192, 100, 90, 0.10)', border: '1px solid rgba(192,100,90,0.30)', color: '#C0645A' }}
              >
                {serverError}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm" style={{ color: '#7A8E79' }}>
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-medium hover:underline" style={{ color: '#84A282' }}>
              Create one →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
