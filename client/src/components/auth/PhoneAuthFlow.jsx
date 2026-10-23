/**
 * PhoneAuthFlow.jsx — Reusable Phone Authentication & Verification flow.
 * Supports:
 * - mode="signIn": for Login & Register pages (signInWithPhoneNumber)
 * - mode="link": for ProfilePage linking (linkWithPhoneNumber)
 *
 * Implements:
 * - Country code selector (default +91)
 * - E.164 phone validation
 * - Masked number display on OTP step (e.g. +91 98••••••12)
 * - 6-digit segmented OtpInput with paste support
 * - Resend countdown timer (45 seconds)
 * - Firebase RecaptchaVerifier (invisible) with full cleanup
 * - New phone user name onboarding step
 * - Complete error handling with getFirebaseAuthErrorMessage
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  linkWithPhoneNumber,
} from 'firebase/auth'
import {
  Phone,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  RefreshCw,
  User,
  CheckCircle2,
} from 'lucide-react'
import { auth } from '@/firebase'
import { useAuth } from '@/context/AuthContext'
import { profileApi } from '@/api/profile'
import { getFirebaseAuthErrorMessage } from '@/utils/firebaseErrors'
import {
  COUNTRY_CODES,
  isValidE164,
  formatToE164,
  maskPhoneNumber,
} from '@/utils/phoneUtils'
import OtpInput from './OtpInput'

const RESEND_COOLDOWN_SECONDS = 45

export default function PhoneAuthFlow({
  mode = 'signIn', // 'signIn' | 'link'
  onBackToEmail,
  onSuccess,
  containerId = 'recaptcha-container',
}) {
  const navigate = useNavigate()
  const { user: currentUser, refreshProfile, setProfile } = useAuth()

  // Steps: 'phone' | 'otp' | 'name' | 'success'
  const [step, setStep] = useState('phone')

  // Form states
  const [countryCode, setCountryCode] = useState('+91')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [formattedNumber, setFormattedNumber] = useState('')
  const [otp, setOtp] = useState('')
  const [fullName, setFullName] = useState('')

  // Loading & error states
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isSavingName, setIsSavingName] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Resend countdown timer
  const [countdown, setCountdown] = useState(0)

  // Firebase confirmation result reference
  const confirmationResultRef = useRef(null)
  const recaptchaVerifierRef = useRef(null)

  // Clean up recaptcha on unmount
  const cleanupRecaptcha = useCallback(() => {
    if (recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current.clear()
      } catch {
        // ignore cleanup error
      }
      recaptchaVerifierRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => cleanupRecaptcha()
  }, [cleanupRecaptcha])

  // Countdown timer effect
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [countdown])

  // Initialize or get invisible RecaptchaVerifier
  const getRecaptchaVerifier = useCallback(() => {
    cleanupRecaptcha()

    const verifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved
      },
      'expired-callback': () => {
        setErrorMessage('reCAPTCHA expired. Please try sending OTP again.')
        cleanupRecaptcha()
      },
    })
    recaptchaVerifierRef.current = verifier
    return verifier
  }, [cleanupRecaptcha, containerId])

  // ── Step 1: Send OTP ────────────────────────────────────────────────────────
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault()
    setErrorMessage('')

    const fullE164 = formatToE164(countryCode, phoneNumber)
    if (!isValidE164(fullE164)) {
      setErrorMessage('Please enter a valid phone number with 10 digits.')
      return
    }

    setIsSendingOtp(true)
    try {
      const appVerifier = getRecaptchaVerifier()
      let confirmation

      if (mode === 'link') {
        if (!auth.currentUser) {
          throw new Error('You must be logged in to link a phone number.')
        }
        confirmation = await linkWithPhoneNumber(auth.currentUser, fullE164, appVerifier)
      } else {
        confirmation = await signInWithPhoneNumber(auth, fullE164, appVerifier)
      }

      confirmationResultRef.current = confirmation
      setFormattedNumber(fullE164)
      setStep('otp')
      setOtp('')
      setCountdown(RESEND_COOLDOWN_SECONDS)
    } catch (err) {
      cleanupRecaptcha()
      const friendlyMsg = getFirebaseAuthErrorMessage(err)
      setErrorMessage(friendlyMsg)
    } finally {
      setIsSendingOtp(false)
    }
  }

  // ── Step 2: Resend OTP ──────────────────────────────────────────────────────
  const handleResendOtp = async () => {
    if (countdown > 0 || isSendingOtp) return
    setErrorMessage('')
    setIsSendingOtp(true)

    try {
      const appVerifier = getRecaptchaVerifier()
      let confirmation

      if (mode === 'link') {
        confirmation = await linkWithPhoneNumber(auth.currentUser, formattedNumber, appVerifier)
      } else {
        confirmation = await signInWithPhoneNumber(auth, formattedNumber, appVerifier)
      }

      confirmationResultRef.current = confirmation
      setCountdown(RESEND_COOLDOWN_SECONDS)
      setOtp('')
    } catch (err) {
      cleanupRecaptcha()
      const friendlyMsg = getFirebaseAuthErrorMessage(err)
      setErrorMessage(friendlyMsg)
    } finally {
      setIsSendingOtp(false)
    }
  }

  // ── Step 2: Verify OTP ──────────────────────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault()
    setErrorMessage('')

    if (otp.length !== 6) {
      setErrorMessage('Please enter all 6 digits of the verification code.')
      return
    }

    if (!confirmationResultRef.current) {
      setErrorMessage('Verification session expired. Please request a new code.')
      setStep('phone')
      return
    }

    setIsVerifying(true)
    try {
      const userCredential = await confirmationResultRef.current.confirm(otp)
      cleanupRecaptcha()

      if (mode === 'link') {
        // Link mode: save phoneNumber to backend profile
        try {
          const updated = await profileApi.update({ phoneNumber: formattedNumber })
          if (setProfile) setProfile(updated)
          if (refreshProfile) await refreshProfile()
        } catch (saveErr) {
          console.warn('Profile phone save warning:', saveErr)
        }

        if (onSuccess) {
          onSuccess(formattedNumber)
        } else {
          setStep('success')
        }
        return
      }

      // SignIn mode: fetch or check if new user needs a name
      let userProfile = null
      try {
        userProfile = await profileApi.get()
      } catch {
        // profile might not exist yet
      }

      // Check if displayName is missing, placeholder, or empty
      const isPlaceholderName =
        !userProfile?.displayName ||
        userProfile.displayName.trim() === '' ||
        userProfile.displayName.startsWith('Student ')

      if (isPlaceholderName) {
        setStep('name')
      } else {
        if (refreshProfile) await refreshProfile()
        if (onSuccess) {
          onSuccess(userCredential)
        } else {
          navigate('/app/dashboard', { replace: true })
        }
      }
    } catch (err) {
      const friendlyMsg = getFirebaseAuthErrorMessage(err)
      setErrorMessage(friendlyMsg)
    } finally {
      setIsVerifying(false)
    }
  }

  // ── Step 3: Complete Name for New Phone Users ──────────────────────────────
  const handleSaveName = async (e) => {
    e.preventDefault()
    setErrorMessage('')

    const cleanName = fullName.trim()
    if (cleanName.length < 2) {
      setErrorMessage('Name must be at least 2 characters.')
      return
    }

    setIsSavingName(true)
    try {
      const updated = await profileApi.update({
        displayName: cleanName,
        phoneNumber: formattedNumber,
      })
      if (setProfile) setProfile(updated)
      if (refreshProfile) await refreshProfile()

      if (onSuccess) {
        onSuccess(updated)
      } else {
        navigate('/app/dashboard', { replace: true })
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to save name. Please try again.')
    } finally {
      setIsSavingName(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Invisible reCAPTCHA container */}
      <div id={containerId} className="hidden" />

      {/* ── STEP 1: Phone input ────────────────────────────────────────────── */}
      {step === 'phone' && (
        <form onSubmit={handleSendOtp} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium" style={{ color: '#2D3A2C' }}>
              {mode === 'link' ? 'Enter phone number to link' : 'Phone number'}
            </label>
            <div className="flex items-center gap-2">
              {/* Country code selector */}
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                disabled={isSendingOtp}
                className="input shrink-0 w-[110px] sm:w-[130px] font-medium cursor-pointer"
                style={{
                  paddingRight: '0.5rem',
                  borderColor: 'rgba(132, 162, 130, 0.40)',
                }}
                aria-label="Country code"
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.dialCode}>
                    {c.flag} {c.dialCode} ({c.code})
                  </option>
                ))}
              </select>

              {/* National number input */}
              <div className="relative flex-1">
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="98765 43210"
                  value={phoneNumber}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/[^\d\s-]/g, '')
                    setPhoneNumber(clean)
                    if (errorMessage) setErrorMessage('')
                  }}
                  disabled={isSendingOtp}
                  autoFocus
                  autoComplete="tel-national"
                  className="input w-full pl-9"
                  style={{ borderColor: errorMessage ? '#C0645A' : undefined }}
                />
                <Phone
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: '#7A8E79' }}
                />
              </div>
            </div>
            <p className="text-[11px]" style={{ color: '#7A8E79' }}>
              We will send a 6-digit OTP via SMS to verify this number.
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div
              className="rounded-input px-3 py-2 text-sm"
              style={{
                background: 'rgba(192, 100, 90, 0.10)',
                border: '1px solid rgba(192, 100, 90, 0.30)',
                color: '#C0645A',
              }}
            >
              {errorMessage}
            </div>
          )}

          {/* Action button */}
          <button
            type="submit"
            disabled={isSendingOtp || !phoneNumber.trim()}
            className="btn-primary w-full flex items-center justify-center gap-2 font-medium"
          >
            {isSendingOtp && <Loader2 size={16} className="animate-spin" />}
            {isSendingOtp ? 'Sending OTP…' : 'Send OTP'}
          </button>

          {/* Back to email option */}
          {mode === 'signIn' && onBackToEmail && (
            <button
              type="button"
              onClick={onBackToEmail}
              disabled={isSendingOtp}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 transition-colors hover:underline"
              style={{ color: '#5E7A5C' }}
            >
              <ArrowLeft size={13} /> Back to email sign in
            </button>
          )}
        </form>
      )}

      {/* ── STEP 2: OTP verification ───────────────────────────────────────── */}
      {step === 'otp' && (
        <form onSubmit={handleVerifyOtp} className="space-y-5" noValidate>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span style={{ color: '#7A8E79' }}>Code sent to:</span>
              <button
                type="button"
                onClick={() => {
                  setStep('phone')
                  setErrorMessage('')
                }}
                className="font-medium hover:underline flex items-center gap-1"
                style={{ color: '#5E7A5C' }}
              >
                Change number
              </button>
            </div>
            <p className="text-sm font-semibold tracking-wide" style={{ color: '#2D3A2C' }}>
              {maskPhoneNumber(formattedNumber)}
            </p>
          </div>

          {/* 6-digit OTP input boxes */}
          <div className="space-y-2">
            <OtpInput
              value={otp}
              onChange={(val) => {
                setOtp(val)
                if (errorMessage) setErrorMessage('')
              }}
              disabled={isVerifying}
              error={!!errorMessage}
            />
          </div>

          {/* Resend OTP countdown */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span style={{ color: '#7A8E79' }}>Didn&apos;t receive code?</span>
            {countdown > 0 ? (
              <span className="font-medium" style={{ color: '#7A8E79' }}>
                Resend in {countdown}s
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isSendingOtp || isVerifying}
                className="font-semibold hover:underline flex items-center gap-1 transition-opacity disabled:opacity-50"
                style={{ color: '#5E7A5C' }}
              >
                {isSendingOtp ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <RefreshCw size={12} />
                )}
                Resend OTP
              </button>
            )}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div
              className="rounded-input px-3 py-2 text-sm"
              style={{
                background: 'rgba(192, 100, 90, 0.10)',
                border: '1px solid rgba(192, 100, 90, 0.30)',
                color: '#C0645A',
              }}
            >
              {errorMessage}
            </div>
          )}

          {/* Verify button */}
          <button
            type="submit"
            disabled={isVerifying || otp.length !== 6}
            className="btn-primary w-full flex items-center justify-center gap-2 font-medium"
          >
            {isVerifying ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Verifying…
              </>
            ) : (
              <>
                <ShieldCheck size={16} /> Verify & Continue
              </>
            )}
          </button>

          {/* Back button */}
          {mode === 'signIn' && onBackToEmail && (
            <button
              type="button"
              onClick={onBackToEmail}
              disabled={isVerifying}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-medium py-1 transition-colors hover:underline"
              style={{ color: '#7A8E79' }}
            >
              <ArrowLeft size={13} /> Back to email sign in
            </button>
          )}
        </form>
      )}

      {/* ── STEP 3: Complete Name for New Phone Users ───────────────────────── */}
      {step === 'name' && (
        <form onSubmit={handleSaveName} className="space-y-4" noValidate>
          <div className="space-y-1 text-center sm:text-left">
            <div className="inline-flex p-2.5 rounded-xl mb-1" style={{ background: 'rgba(132, 162, 130, 0.15)' }}>
              <User size={20} style={{ color: '#5E7A5C' }} />
            </div>
            <h3 className="text-base font-semibold" style={{ color: '#2D3A2C' }}>
              Welcome to Scholar Sense!
            </h3>
            <p className="text-xs" style={{ color: '#7A8E79' }}>
              Please enter your full name to complete your student profile.
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="phone-user-fullname" className="block text-sm font-medium" style={{ color: '#2D3A2C' }}>
              Your Full Name
            </label>
            <input
              id="phone-user-fullname"
              type="text"
              placeholder="e.g. Alex Johnson"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value)
                if (errorMessage) setErrorMessage('')
              }}
              autoFocus
              className="input w-full"
              style={{ borderColor: errorMessage ? '#C0645A' : undefined }}
            />
          </div>

          {errorMessage && (
            <div
              className="rounded-input px-3 py-2 text-sm"
              style={{
                background: 'rgba(192, 100, 90, 0.10)',
                border: '1px solid rgba(192, 100, 90, 0.30)',
                color: '#C0645A',
              }}
            >
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isSavingName || fullName.trim().length < 2}
            className="btn-primary w-full flex items-center justify-center gap-2 font-medium"
          >
            {isSavingName ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Setting up your profile…
              </>
            ) : (
              'Continue to Dashboard'
            )}
          </button>
        </form>
      )}

      {/* ── Link Mode Success Confirmation ─────────────────────────────────── */}
      {step === 'success' && (
        <div className="text-center py-4 space-y-2">
          <div className="inline-flex p-3 rounded-full" style={{ background: 'rgba(132, 162, 130, 0.20)' }}>
            <CheckCircle2 size={24} style={{ color: '#5E7A5C' }} />
          </div>
          <h4 className="text-sm font-semibold" style={{ color: '#2D3A2C' }}>
            Phone number verified!
          </h4>
          <p className="text-xs" style={{ color: '#7A8E79' }}>
            Your phone number {maskPhoneNumber(formattedNumber)} is linked to your account.
          </p>
        </div>
      )}
    </div>
  )
}
