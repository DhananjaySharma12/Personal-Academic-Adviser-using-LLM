/**
 * RegisterPage — real signup form with Firebase Authentication.
 * Includes email/password creation, fullName profile update, and Google sign-in.
 */
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { GraduationCap, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useState } from 'react'
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
} from 'firebase/auth'
import { auth, googleProvider } from '@/firebase'
import { getFirebaseAuthErrorMessage } from '@/utils/firebaseErrors'

const schema = z
  .object({
    displayName: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export default function RegisterPage() {
  const navigate = useNavigate()
  const [showPass, setShowPass] = useState(false)
  const [serverError, setServerError] = useState('')
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (data) => {
    setServerError('')
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password,
      )
      if (data.displayName) {
        await updateProfile(userCredential.user, {
          displayName: data.displayName,
        })
      }
      navigate('/app/dashboard', { replace: true })
    } catch (err) {
      setServerError(getFirebaseAuthErrorMessage(err))
    }
  }

  const handleGoogleSignIn = async () => {
    setServerError('')
    setIsGoogleLoading(true)
    try {
      await signInWithPopup(auth, googleProvider)
      navigate('/app/dashboard', { replace: true })
    } catch (err) {
      setServerError(getFirebaseAuthErrorMessage(err))
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const isBusy = isSubmitting || isGoogleLoading

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{
        background: 'linear-gradient(145deg, #FEFAF3 0%, #F5F0E8 40%, #EDE8DE 100%)',
      }}
    >
      {/* Botanical radial glows */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(184, 207, 179, 0.35) 0%, transparent 70%), radial-gradient(circle at 80% 80%, rgba(246, 226, 233, 0.28) 0%, transparent 50%)',
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
                boxShadow: '0 0 20px rgba(132,162,130,0.40)',
              }}
            >
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
        <div
          className="p-8 space-y-5 rounded-card"
          style={{
            background: '#FFFFFF',
            border: '1px solid rgba(132, 162, 130, 0.25)',
            boxShadow: '0 4px 32px rgba(132, 162, 130, 0.15), 0 0 40px rgba(184, 207, 179, 0.10)',
          }}
        >
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
                  placeholder="Min. 6 characters"
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

            {/* Error Area */}
            {serverError && (
              <div className="rounded-input bg-danger/10 border border-danger/30 px-3 py-2 text-danger text-sm">
                {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={isBusy}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isSubmitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center py-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: 'rgba(132, 162, 130, 0.20)' }} />
            </div>
            <span
              className="relative px-3 text-xs uppercase font-medium bg-white"
              style={{ color: '#7A8E79' }}
            >
              Or
            </span>
          </div>

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isBusy}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
            style={{
              background: '#FFFFFF',
              border: '1px solid rgba(132, 162, 130, 0.35)',
              color: '#2D3A2C',
              boxShadow: '0 1px 4px rgba(132, 162, 130, 0.08)',
            }}
          >
            {isGoogleLoading ? (
              <Loader2 size={16} className="animate-spin text-primary" />
            ) : (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>{isGoogleLoading ? 'Connecting…' : 'Continue with Google'}</span>
          </button>

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
