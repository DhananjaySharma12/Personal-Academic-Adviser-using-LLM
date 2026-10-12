/**
 * RegisterPage — real signup form with React Hook Form + Zod.
 * Personal Academic Adviser branding. Violet color scheme.
 */
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { GraduationCap, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { authApi } from '@/api/auth'

const schema = z
  .object({
    displayName: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
    email: z.string().email('Enter a valid email'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password too long'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export default function RegisterPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
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
      const { token, user, profile } = await authApi.register({
        email: data.email,
        password: data.password,
        displayName: data.displayName,
      })
      login(token, user, profile)
      navigate('/app/onboarding', { replace: true })
    } catch (err) {
      setServerError(err.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'linear-gradient(145deg, #FEFAF3 0%, #F5F0E8 40%, #EDE8DE 100%)' }}>
      {/* Botanical radial glows */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(184, 207, 179, 0.35) 0%, transparent 70%), radial-gradient(circle at 80% 80%, rgba(246, 226, 233, 0.28) 0%, transparent 50%)' }}
      />

      <div className="relative w-full max-w-md z-10">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-6 group">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-105" style={{ background: 'linear-gradient(135deg, #84A282, #5E7A5C)', boxShadow: '0 0 20px rgba(132,162,130,0.40)' }}>
              <GraduationCap size={22} style={{ color: '#FEFAF3' }} />
            </div>
            <span className="font-display text-lg font-semibold" style={{ color: '#2D3A2C' }}>
              Personal Academic Adviser
            </span>
          </Link>
          <h1 className="font-display text-3xl font-bold mb-2" style={{ color: '#2D3A2C' }}>
            Start your journey
          </h1>
          <p className="text-sm" style={{ color: '#7A8E79' }}>
            Create your account — it&apos;s free
          </p>
        </div>

        {/* Card */}
        <div className="p-8 space-y-5 rounded-card" style={{ background: '#FFFFFF', border: '1px solid rgba(132, 162, 130, 0.25)', boxShadow: '0 4px 32px rgba(132, 162, 130, 0.15), 0 0 40px rgba(184, 207, 179, 0.10)' }}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Display name */}
            <div className="space-y-1.5">
              <label htmlFor="reg-name" className="block text-sm font-medium text-text-main">
                Full name
              </label>
              <input
                id="reg-name"
                type="text"
                autoComplete="name"
                placeholder="Rahul Sharma"
                className={`input w-full ${errors.displayName ? 'border-danger/60' : ''}`}
                {...register('displayName')}
              />
              {errors.displayName && (
                <p className="text-danger text-xs">{errors.displayName.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="reg-email" className="block text-sm font-medium text-text-main">
                Email address
              </label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={`input w-full ${errors.email ? 'border-danger/60' : ''}`}
                {...register('email')}
              />
              {errors.email && <p className="text-danger text-xs">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="reg-password" className="block text-sm font-medium text-text-main">
                Password
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  className={`input w-full pr-10 ${errors.password ? 'border-danger/60' : ''}`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-danger text-xs">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
              <label
                htmlFor="reg-confirm"
                className="block text-sm font-medium text-text-main"
              >
                Confirm password
              </label>
              <input
                id="reg-confirm"
                type={showPass ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Repeat your password"
                className={`input w-full ${errors.confirmPassword ? 'border-danger/60' : ''}`}
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="text-danger text-xs">{errors.confirmPassword.message}</p>
              )}
            </div>

            {serverError && (
              <div className="rounded-input bg-danger/10 border border-danger/30 px-3 py-2 text-danger text-sm">
                {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isSubmitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-text-muted text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-accent hover:underline font-medium">
              Sign in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
