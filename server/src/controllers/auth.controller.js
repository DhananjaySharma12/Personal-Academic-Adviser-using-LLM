/**
 * auth.controller.js — register, login, logout, me.
 * Passwords never logged. Errors go through central handler.
 */
import crypto from 'crypto'
import { z } from 'zod'
import User from '../models/User.js'
import StudentProfile from '../models/StudentProfile.js'
import { signToken } from '../utils/jwt.js'
import { ok, created } from '../utils/response.js'
import { conflict, unauthorized, badRequest } from '../utils/ApiError.js'


// ── Zod schemas ──────────────────────────────────────────────────────────────
export const registerSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long'),
  displayName: z.string().trim().min(1).max(80).optional(),
})

export const loginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1).max(128),
})

// ── Helpers ──────────────────────────────────────────────────────────────────
async function buildUserResponse(user, token) {
  const profile = await StudentProfile.findOne({ userId: user._id })
  return {
    token,
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    profile: profile ?? null,
  }
}

// ── Controllers ──────────────────────────────────────────────────────────────

/** POST /api/auth/register */
export async function register(req, res, next) {
  try {
    const { email, password, displayName } = req.body

    const existing = await User.findOne({ email })
    if (existing) throw conflict('An account with this email already exists')

    // passwordHash field triggers bcrypt pre-save hook
    const user = await User.create({ email, passwordHash: password })

    // Create empty profile
    const profile = await StudentProfile.create({
      userId: user._id,
      displayName: displayName ?? email.split('@')[0],
      onboardingComplete: false,
    })

    const token = signToken(user._id)
    created(res, {
      token,
      user: { id: user._id, email: user.email, role: user.role },
      profile,
    })
  } catch (err) {
    next(err)
  }
}

/** POST /api/auth/login */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body

    // Explicitly select passwordHash (excluded by default)
    const user = await User.findOne({ email }).select('+passwordHash')
    if (!user) throw unauthorized('Invalid email or password')

    const valid = await user.comparePassword(password)
    if (!valid) throw unauthorized('Invalid email or password')

    const token = signToken(user._id)
    const userResponse = await buildUserResponse(user, token)
    ok(res, userResponse)
  } catch (err) {
    next(err)
  }
}

/** POST /api/auth/logout — stateless JWT; client just discards token */
export function logout(_req, res) {
  ok(res, { message: 'Logged out successfully' })
}

/** GET /api/auth/me — returns user + profile info */
export async function me(req, res, next) {
  try {
    const user = await User.findById(req.user.id)
    if (!user) throw unauthorized('User not found')

    const profile = await StudentProfile.findOne({ userId: req.user.id })

    ok(res, {
      user: { id: user._id, email: user.email, role: user.role },
      profile: profile ?? null,
      onboardingComplete: profile?.onboardingComplete ?? false,
    })
  } catch (err) {
    next(err)
  }
}

/** POST /api/auth/forgot-password */
export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body
    if (!email) throw badRequest('Email is required')

    const user = await User.findOne({ email: email.toLowerCase().trim() })
    if (!user) {
      // Don't leak user existence
      return ok(res, { message: 'If an account exists, password reset instructions have been sent.' })
    }

    const resetToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex')

    user.resetPasswordToken = tokenHash
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    await user.save()

    const devResetUrl = `http://localhost:5173/reset-password?token=${resetToken}`

    ok(res, {
      message: 'Password reset instructions have been sent.',
      devResetToken: resetToken,
      devResetUrl,
    })
  } catch (err) {
    next(err)
  }
}

/** POST /api/auth/reset-password */
export async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body
    if (!token || !newPassword) {
      throw badRequest('Reset token and new password are required')
    }

    if (newPassword.length < 8) {
      throw badRequest('Password must be at least 8 characters long')
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    const user = await User.findOne({
      resetPasswordToken: tokenHash,
      resetPasswordExpires: { $gt: new Date() },
    })

    if (!user) {
      throw unauthorized('Password reset token is invalid or has expired')
    }

    user.passwordHash = newPassword
    user.resetPasswordToken = null
    user.resetPasswordExpires = null
    await user.save()

    ok(res, { message: 'Password has been successfully reset. You can now log in.' })
  } catch (err) {
    next(err)
  }
}

