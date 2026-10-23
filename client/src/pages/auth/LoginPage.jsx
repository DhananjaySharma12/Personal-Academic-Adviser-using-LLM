/**
 * LoginPage — botanical sage & blush palette with Firebase Authentication.
 */
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { GraduationCap, Eye, EyeOff, Loader2, Phone } from 'lucide-react'
import { useState } from 'react'
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '@/firebase'
import { getFirebaseAuthErrorMessage } from '@/utils/firebaseErrors'
import PhoneAuthFlow from '@/components/auth/PhoneAuthFlow'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname ?? '/app/dashboard'

  const [showPass, setShowPass] = useState(false)
  const [serverError, setServerError] = useState('')
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [authMethod, setAuthMethod] = useState('email') // 'email' | 'phone'
  const [showOtherWays, setShowOtherWays] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (data) => {
    setServerError('')
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password)
      navigate(from, { replace: true })
    } catch (err) {
      setServerError(getFirebaseAuthErrorMessage(err))
    }
  }

  const handleGoogleSignIn = async () => {
    setServerError('')
    setIsGoogleLoading(true)
    try {
      await signInWithPopup(auth, googleProvider)
      navigate(from, { replace: true })
    } catch (err) {
      setServerError(getFirebaseAuthErrorMessage(err))
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const isBusy = isSubmitting || isGoogleLoading

  return (
    <div
      className="min-h-screen flex items-center justify-center px-3.5 sm:px-4 py-6 sm:py-12"
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
          `,
        }}
      />

      <div className="relative w-full max-w-md z-10">
        {/* Logo */}
        <div className="mb-6 sm:mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-4 sm:mb-6 group">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #84A282, #5E7A5C)',
                boxShadow: '0 0 20px rgba(132, 162, 130, 0.40)',
              }}
            >
              <GraduationCap size={22} style={{ color: '#FEFAF3' }} />
            </div>
            <span className="font-display text-base sm:text-lg font-semibold" style={{ color: '#2D3A2C' }}>
              Personal Academic Adviser
            </span>
          </Link>
          <h1 className="font-display text-2xl sm:text-3xl font-bold mb-2" style={{ color: '#2D3A2C' }}>
            Welcome back
          </h1>
          <p className="text-xs sm:text-sm" style={{ color: '#7A8E79' }}>
            Sign in to continue your learning journey
          </p>
        </div>

        {/* Card */}
        <div
          className="p-5 sm:p-8 space-y-5 rounded-card"
          style={{
            background: '#FFFFFF',
            border: '1px solid rgba(132, 162, 130, 0.25)',
            boxShadow: '0 4px 32px rgba(132, 162, 130, 0.15), 0 0 40px rgba(184, 207, 179, 0.10)',
          }}
        >
          {authMethod === 'phone' ? (
            <PhoneAuthFlow
              mode="signIn"
              containerId="login-phone-recaptcha"
              onBackToEmail={() => {
                setAuthMethod('email')
                setShowOtherWays(false)
              }}
              onSuccess={() => {
                navigate(from, { replace: true })
              }}
            />
          ) : (
            <>
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
                    <p className="text-xs mt-1" style={{ color: '#C0645A' }}>
                      {errors.email.message}
                    </p>
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
                    <p className="text-xs mt-1" style={{ color: '#C0645A' }}>
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Error Area */}
                {serverError && (
                  <div
                    className="rounded-input px-3 py-2 text-sm"
                    style={{
                      background: 'rgba(192, 100, 90, 0.10)',
                      border: '1px solid rgba(192,100,90,0.30)',
                      color: '#C0645A',
                    }}
                  >
                    {serverError}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isBusy}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                  {isSubmitting ? 'Signing in…' : 'Sign in'}
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

              {/* Try another way divider & button */}
              <div className="pt-1">
                {!showOtherWays ? (
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setShowOtherWays(true)}
                      disabled={isBusy}
                      className="text-xs font-medium hover:underline transition-colors"
                      style={{ color: '#5E7A5C' }}
                    >
                      Try another way
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 pt-1">
                    <div className="relative flex items-center justify-center py-1">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t" style={{ borderColor: 'rgba(132, 162, 130, 0.15)' }} />
                      </div>
                      <span className="relative px-2 text-[10px] uppercase font-semibold bg-white" style={{ color: '#7A8E79' }}>
                        Other Options
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAuthMethod('phone')}
                      disabled={isBusy}
                      className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:bg-sage/10"
                      style={{
                        background: 'rgba(132, 162, 130, 0.08)',
                        border: '1px solid rgba(132, 162, 130, 0.35)',
                        color: '#2D3A2C',
                      }}
                    >
                      <Phone size={15} style={{ color: '#5E7A5C' }} />
                      <span>Continue with phone (OTP)</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          <p className="text-center text-sm" style={{ color: '#7A8E79' }}>
            Don&apos;t have an account?{' '}
            <Link
              to="/register"
              className="auth-link"
              aria-disabled={isBusy ? 'true' : undefined}
            >
              Create account →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
